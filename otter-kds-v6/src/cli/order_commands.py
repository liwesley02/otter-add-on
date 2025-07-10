"""Order management CLI commands."""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
import click
from rich.console import Console
from rich.table import Table
from rich.live import Live
from rich.progress import Progress, SpinnerColumn, TextColumn
import structlog

from ..database import SupabaseManager
from ..auth.manager import AuthManager
from ..orders.models import OrderStatus, ItemStatus

console = Console()
logger = structlog.get_logger()


@click.group()
@click.pass_context
def orders(ctx):
    """Manage restaurant orders."""
    # Initialize database connection
    ctx.ensure_object(dict)
    ctx.obj['db'] = SupabaseManager()
    ctx.obj['auth'] = AuthManager(ctx.obj['db'])


@orders.command()
@click.option('--status', type=click.Choice(['pending', 'in_progress', 'completed', 'all']), 
              default='pending', help='Filter by order status')
@click.option('--limit', default=20, help='Number of orders to show')
@click.option('--restaurant-id', help='Specific restaurant ID (for multi-location users)')
@click.pass_context
def list(ctx, status: str, limit: int, restaurant_id: Optional[str]):
    """List active orders for the restaurant."""
    
    async def list_orders():
        db: SupabaseManager = ctx.obj['db']
        
        # Get current user session (would come from stored auth token)
        # For now, we'll use the restaurant_id directly
        if not restaurant_id:
            console.print("[red]Restaurant ID required. Use --restaurant-id option[/red]")
            return
        
        try:
            # Get active orders
            orders_data = await db.get_active_orders(restaurant_id)
            
            if not orders_data:
                console.print("[yellow]No active orders found[/yellow]")
                return
            
            # Create table
            table = Table(title=f"Active Orders ({len(orders_data)} total)")
            table.add_column("Order #", style="cyan", no_wrap=True)
            table.add_column("Customer", style="white")
            table.add_column("Items", justify="center")
            table.add_column("Status", style="yellow")
            table.add_column("Time", style="magenta")
            table.add_column("Urgency", justify="center")
            
            for order in orders_data:
                # Format urgency
                urgency = order.get('urgency_score', 0)
                urgency_display = "🟢" if urgency == 0 else "🟡" if urgency == 1 else "🟠" if urgency == 2 else "🔴"
                
                # Format elapsed time
                elapsed = order.get('elapsed_minutes', 0)
                time_display = f"{elapsed}m ago"
                if elapsed > 30:
                    time_display = f"[red]{time_display}[/red]"
                
                # Add row
                table.add_row(
                    order['order_number'],
                    order.get('customer_name', 'Unknown'),
                    f"{order.get('completed_items', 0)}/{order.get('total_items', 0)}",
                    order['status'].title(),
                    time_display,
                    urgency_display
                )
            
            console.print(table)
            
        except Exception as e:
            console.print(f"[red]Error listing orders: {str(e)}[/red]")
            logger.error("Failed to list orders", error=str(e))
    
    asyncio.run(list_orders())


@orders.command()
@click.argument('order_id')
@click.pass_context
def show(ctx, order_id: str):
    """Show detailed information about a specific order."""
    
    async def show_order():
        db: SupabaseManager = ctx.obj['db']
        
        try:
            # Get order details
            order = await db.client.table("orders")\
                .select("*, order_items(*)")\
                .eq("id", order_id)\
                .single()\
                .execute()
            
            if not order.data:
                console.print(f"[red]Order {order_id} not found[/red]")
                return
            
            order_data = order.data
            
            # Display order header
            console.print(f"\n[bold cyan]Order #{order_data['order_number']}[/bold cyan]")
            console.print(f"Customer: {order_data.get('customer_name', 'Unknown')}")
            console.print(f"Status: [yellow]{order_data['status'].title()}[/yellow]")
            console.print(f"Ordered: {order_data['ordered_at']}")
            
            if order_data.get('prep_time_minutes'):
                console.print(f"Prep Time: {order_data['prep_time_minutes']} minutes")
            
            # Display items
            console.print("\n[bold]Items:[/bold]")
            items_table = Table()
            items_table.add_column("Item", style="cyan")
            items_table.add_column("Quantity", justify="center")
            items_table.add_column("Status", style="yellow")
            items_table.add_column("Station", style="magenta")
            
            for item in order_data.get('order_items', []):
                status_emoji = "✅" if item['status'] == 'completed' else "🔄" if item['status'] == 'in_progress' else "⏳"
                items_table.add_row(
                    item['item_name'],
                    str(item['quantity']),
                    f"{status_emoji} {item['status'].title()}",
                    item.get('station', 'Unassigned')
                )
            
            console.print(items_table)
            
        except Exception as e:
            console.print(f"[red]Error showing order: {str(e)}[/red]")
            logger.error("Failed to show order", error=str(e), order_id=order_id)
    
    asyncio.run(show_order())


@orders.command()
@click.argument('order_id')
@click.option('--force', is_flag=True, help='Force completion even if items are pending')
@click.pass_context
def complete(ctx, order_id: str, force: bool):
    """Mark an order as completed."""
    
    async def complete_order():
        db: SupabaseManager = ctx.obj['db']
        
        try:
            # Check if all items are completed (unless forced)
            if not force:
                items = await db.client.table("order_items")\
                    .select("status")\
                    .eq("order_id", order_id)\
                    .execute()
                
                pending_items = [i for i in items.data if i['status'] != 'completed']
                if pending_items:
                    console.print(f"[yellow]Warning: {len(pending_items)} items are not completed[/yellow]")
                    if not click.confirm("Complete order anyway?"):
                        return
            
            # Update order status
            result = await db.update_order_status(order_id, OrderStatus.COMPLETED.value)
            
            if result:
                prep_time = result.get('prep_time_minutes', 'N/A')
                console.print(f"[green]✓ Order completed (prep time: {prep_time} minutes)[/green]")
            else:
                console.print(f"[red]Failed to complete order[/red]")
                
        except Exception as e:
            console.print(f"[red]Error completing order: {str(e)}[/red]")
            logger.error("Failed to complete order", error=str(e), order_id=order_id)
    
    asyncio.run(complete_order())


@orders.command()
@click.option('--restaurant-id', required=True, help='Restaurant ID')
@click.option('--refresh', default=2, help='Refresh interval in seconds')
@click.pass_context
def watch(ctx, restaurant_id: str, refresh: int):
    """Watch orders in real-time."""
    
    async def watch_orders():
        db: SupabaseManager = ctx.obj['db']
        
        console.print(f"[cyan]Watching orders for restaurant {restaurant_id}[/cyan]")
        console.print("Press Ctrl+C to stop\n")
        
        # Subscribe to real-time updates
        def on_order_change(payload):
            # This will be called when orders change
            console.print(f"[yellow]Order updated: {payload['new']['order_number']}[/yellow]")
        
        subscription_id = db.subscribe_to_orders(restaurant_id, on_order_change)
        
        try:
            with Live(console=console, refresh_per_second=1/refresh) as live:
                while True:
                    # Get current orders
                    orders_data = await db.get_active_orders(restaurant_id)
                    
                    # Create table
                    table = Table(title=f"Live Orders - {datetime.now().strftime('%H:%M:%S')}")
                    table.add_column("Order #", style="cyan", no_wrap=True)
                    table.add_column("Customer", style="white")
                    table.add_column("Items", justify="center")
                    table.add_column("Status", style="yellow")
                    table.add_column("Time", style="magenta")
                    
                    for order in orders_data[:10]:  # Show top 10
                        elapsed = order.get('elapsed_minutes', 0)
                        time_color = "red" if elapsed > 20 else "yellow" if elapsed > 10 else "green"
                        
                        table.add_row(
                            order['order_number'],
                            order.get('customer_name', 'Unknown'),
                            f"{order.get('completed_items', 0)}/{order.get('total_items', 0)}",
                            order['status'].title(),
                            f"[{time_color}]{elapsed}m[/{time_color}]"
                        )
                    
                    live.update(table)
                    await asyncio.sleep(refresh)
                    
        except KeyboardInterrupt:
            console.print("\n[yellow]Stopped watching orders[/yellow]")
        finally:
            db.unsubscribe(subscription_id)
    
    asyncio.run(watch_orders())


@orders.command()
@click.option('--restaurant-id', required=True, help='Restaurant ID')
@click.option('--period', type=click.Choice(['hour', 'today', 'week']), default='today')
@click.pass_context
def stats(ctx, restaurant_id: str, period: str):
    """Show order statistics."""
    
    async def show_stats():
        db: SupabaseManager = ctx.obj['db']
        
        try:
            # Get prep time stats
            time_window = "1 hour" if period == "hour" else "1 day" if period == "today" else "7 days"
            stats = await db.get_prep_time_stats(restaurant_id, time_window)
            
            if not stats:
                console.print("[yellow]No statistics available for this period[/yellow]")
                return
            
            # Display statistics
            table = Table(title=f"Order Statistics - {period.title()}")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="magenta")
            
            table.add_row("Total Orders", str(stats.get('total_orders', 0)))
            table.add_row("Avg Prep Time", f"{stats.get('avg_prep_time_minutes', 0):.1f} minutes")
            table.add_row("Min Prep Time", f"{stats.get('min_prep_time_minutes', 0):.1f} minutes")
            table.add_row("Max Prep Time", f"{stats.get('max_prep_time_minutes', 0):.1f} minutes")
            table.add_row("Avg Items/Order", f"{stats.get('items_per_order', 0):.1f}")
            
            console.print(table)
            
            # Get current active orders count
            active_orders = await db.get_active_orders(restaurant_id)
            console.print(f"\n[cyan]Currently Active Orders:[/cyan] {len(active_orders)}")
            
        except Exception as e:
            console.print(f"[red]Error showing statistics: {str(e)}[/red]")
            logger.error("Failed to show stats", error=str(e))
    
    asyncio.run(show_stats())


# Item-specific commands
@orders.group()
def items():
    """Manage order items."""
    pass


@items.command('complete')
@click.argument('item_id')
@click.pass_context
def item_complete(ctx, item_id: str):
    """Mark an order item as completed."""
    
    async def complete_item():
        db: SupabaseManager = ctx.obj['db']
        
        try:
            # Update item status
            result = await db.update_item_status(item_id, ItemStatus.COMPLETED.value)
            
            if result:
                console.print(f"[green]✓ Item marked as completed[/green]")
                
                # Check if this completes the order
                order_id = result['order_id']
                order = await db.client.table("orders")\
                    .select("*, order_items(status)")\
                    .eq("id", order_id)\
                    .single()\
                    .execute()
                
                if order.data:
                    items = order.data.get('order_items', [])
                    if all(item['status'] == 'completed' for item in items):
                        console.print(f"[green]✓ All items completed! Order #{order.data['order_number']} is ready[/green]")
            else:
                console.print(f"[red]Failed to complete item[/red]")
                
        except Exception as e:
            console.print(f"[red]Error completing item: {str(e)}[/red]")
            logger.error("Failed to complete item", error=str(e), item_id=item_id)
    
    asyncio.run(complete_item())