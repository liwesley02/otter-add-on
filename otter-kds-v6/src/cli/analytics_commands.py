"""Analytics CLI commands."""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.columns import Columns
from rich.progress import Progress, SpinnerColumn, TextColumn
import structlog

from ..database import SupabaseManager
from ..auth.manager import AuthManager

console = Console()
logger = structlog.get_logger()


@click.group()
@click.pass_context
def analytics(ctx):
    """View analytics and predictions."""
    # Initialize database connection
    ctx.ensure_object(dict)
    ctx.obj['db'] = SupabaseManager()
    ctx.obj['auth'] = AuthManager(ctx.obj['db'])


@analytics.command('prep-time')
@click.option('--restaurant-id', required=True, help='Restaurant ID')
@click.option('--period', type=click.Choice(['hour', 'today', 'week', 'month']), 
              default='today', help='Time period for analysis')
@click.pass_context
def prep_time(ctx, restaurant_id: str, period: str):
    """Analyze preparation time statistics."""
    
    async def analyze_prep_time():
        db: SupabaseManager = ctx.obj['db']
        
        try:
            # Map period to time window
            time_windows = {
                'hour': '1 hour',
                'today': '1 day',
                'week': '7 days',
                'month': '30 days'
            }
            time_window = time_windows[period]
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
            ) as progress:
                task = progress.add_task("Analyzing prep time data...", total=None)
                
                # Get prep time statistics
                stats = await db.get_prep_time_stats(restaurant_id, time_window)
                
                progress.update(task, completed=True)
            
            if not stats or stats.get('total_orders', 0) == 0:
                console.print(f"[yellow]No order data available for {period}[/yellow]")
                return
            
            # Create summary panel
            summary_text = f"""[bold cyan]Preparation Time Analysis - {period.title()}[/bold cyan]
            
📊 [bold]Orders Analyzed:[/bold] {stats['total_orders']}
⏱️  [bold]Average Prep Time:[/bold] {stats['avg_prep_time_minutes']:.1f} minutes
🚀 [bold]Fastest Order:[/bold] {stats['min_prep_time_minutes']:.1f} minutes
🐌 [bold]Slowest Order:[/bold] {stats['max_prep_time_minutes']:.1f} minutes
📦 [bold]Items per Order:[/bold] {stats['items_per_order']:.1f}
            """
            
            console.print(Panel(summary_text, title="Summary", border_style="cyan"))
            
            # Performance indicators
            avg_time = stats['avg_prep_time_minutes']
            if avg_time < 15:
                performance = "[green]Excellent[/green] 🌟"
            elif avg_time < 20:
                performance = "[yellow]Good[/yellow] ✅"
            elif avg_time < 25:
                performance = "[orange3]Fair[/orange3] ⚠️"
            else:
                performance = "[red]Needs Improvement[/red] ❌"
            
            console.print(f"\n[bold]Performance Rating:[/bold] {performance}")
            
            # Recommendations
            console.print("\n[bold]Recommendations:[/bold]")
            if avg_time > 20:
                console.print("• Consider adding more kitchen staff during peak hours")
                console.print("• Review and optimize preparation workflows")
                console.print("• Pre-prepare popular items during slow periods")
            else:
                console.print("• [green]Keep up the great work![/green]")
                console.print("• Monitor for consistency across all shifts")
            
        except Exception as e:
            console.print(f"[red]Error analyzing prep time: {str(e)}[/red]")
            logger.error("Failed to analyze prep time", error=str(e))
    
    asyncio.run(analyze_prep_time())


@analytics.command('popular')
@click.option('--restaurant-id', required=True, help='Restaurant ID')
@click.option('--day', type=int, help='Day of week (0=Sunday, 6=Saturday)')
@click.option('--hour', type=int, help='Hour of day (0-23)')
@click.option('--limit', default=10, help='Number of items to show')
@click.pass_context
def popular(ctx, restaurant_id: str, day: Optional[int], hour: Optional[int], limit: int):
    """Show most popular menu items."""
    
    async def show_popular_items():
        db: SupabaseManager = ctx.obj['db']
        
        try:
            # Get item popularity
            items = await db.get_item_popularity(restaurant_id, day, hour)
            
            if not items:
                console.print("[yellow]No item data available[/yellow]")
                return
            
            # Create table
            title = "Most Popular Items"
            if day is not None:
                days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                title += f" - {days[day]}"
            if hour is not None:
                title += f" @ {hour:02d}:00"
            
            table = Table(title=title)
            table.add_column("Rank", style="cyan", justify="center")
            table.add_column("Item", style="white")
            table.add_column("Total Sold", style="magenta", justify="right")
            table.add_column("Daily Avg", style="yellow", justify="right")
            table.add_column("Peak Hour", style="green", justify="center")
            
            for i, item in enumerate(items[:limit], 1):
                # Add emoji for top 3
                rank = f"{i}"
                if i == 1:
                    rank = "🥇 1"
                elif i == 2:
                    rank = "🥈 2"
                elif i == 3:
                    rank = "🥉 3"
                
                table.add_row(
                    rank,
                    item['item_name'],
                    str(item['total_quantity']),
                    f"{item['avg_daily_quantity']:.1f}",
                    f"{item['peak_hour']:02d}:00"
                )
            
            console.print(table)
            
            # Show insights
            if items:
                top_item = items[0]
                console.print(f"\n[bold]Top Seller:[/bold] {top_item['item_name']}")
                console.print(f"Peak demand at {top_item['peak_hour']:02d}:00")
                
        except Exception as e:
            console.print(f"[red]Error showing popular items: {str(e)}[/red]")
            logger.error("Failed to show popular items", error=str(e))
    
    asyncio.run(show_popular_items())


@analytics.command('predict')
@click.option('--restaurant-id', required=True, help='Restaurant ID')
@click.option('--window', default=30, help='Prediction window in minutes')
@click.option('--confidence', default=0.5, help='Minimum confidence threshold (0-1)')
@click.pass_context
def predict(ctx, restaurant_id: str, window: int, confidence: float):
    """Show demand predictions for upcoming period."""
    
    async def show_predictions():
        db: SupabaseManager = ctx.obj['db']
        
        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
            ) as progress:
                task = progress.add_task("Generating predictions...", total=None)
                
                # Get demand predictions
                predictions = await db.get_demand_predictions(restaurant_id, window)
                
                progress.update(task, completed=True)
            
            if not predictions:
                console.print("[yellow]Insufficient data for predictions[/yellow]")
                console.print("Need at least 7 days of historical data")
                return
            
            # Filter by confidence
            filtered_predictions = [
                p for p in predictions 
                if p['confidence_score'] >= confidence
            ]
            
            if not filtered_predictions:
                console.print(f"[yellow]No predictions meet confidence threshold ({confidence})[/yellow]")
                return
            
            # Create prediction panels
            console.print(f"\n[bold cyan]Demand Predictions - Next {window} Minutes[/bold cyan]\n")
            
            panels = []
            for pred in filtered_predictions[:6]:  # Show top 6
                # Determine confidence color
                conf = pred['confidence_score']
                conf_color = "green" if conf > 0.8 else "yellow" if conf > 0.6 else "orange3"
                
                # Create panel content
                content = f"""[bold]{pred['item_name']}[/bold]
                
📊 Predicted: [bold]{pred['predicted_quantity']}[/bold] orders
🎯 Confidence: [{conf_color}]{conf*100:.0f}%[/{conf_color}]
                """
                
                # Recommendation based on quantity
                if pred['predicted_quantity'] >= 10:
                    content += "\n⚡ [red]High demand - prepare now![/red]"
                elif pred['predicted_quantity'] >= 5:
                    content += "\n📝 [yellow]Moderate demand expected[/yellow]"
                else:
                    content += "\n✅ [green]Normal demand[/green]"
                
                panels.append(Panel(content, border_style=conf_color))
            
            # Display in columns
            console.print(Columns(panels, equal=True, expand=True))
            
            # Summary statistics
            total_predicted = sum(p['predicted_quantity'] for p in filtered_predictions)
            avg_confidence = sum(p['confidence_score'] for p in filtered_predictions) / len(filtered_predictions)
            
            console.print(f"\n[bold]Summary:[/bold]")
            console.print(f"• Total predicted orders: {total_predicted}")
            console.print(f"• Average confidence: {avg_confidence*100:.0f}%")
            console.print(f"• Items above threshold: {len(filtered_predictions)}")
            
            # Action recommendations
            console.print("\n[bold]Recommended Actions:[/bold]")
            high_demand_items = [p for p in filtered_predictions if p['predicted_quantity'] >= 10]
            if high_demand_items:
                console.print("[red]🔥 High Demand Items:[/red]")
                for item in high_demand_items:
                    console.print(f"  • Start preparing {item['predicted_quantity']} {item['item_name']}")
            else:
                console.print("[green]✅ Normal demand expected - maintain standard prep[/green]")
            
        except Exception as e:
            console.print(f"[red]Error generating predictions: {str(e)}[/red]")
            logger.error("Failed to generate predictions", error=str(e))
    
    asyncio.run(show_predictions())


@analytics.command('dashboard')
@click.option('--restaurant-id', required=True, help='Restaurant ID')
@click.pass_context
def dashboard(ctx, restaurant_id: str):
    """Show analytics dashboard summary."""
    
    async def show_dashboard():
        db: SupabaseManager = ctx.obj['db']
        
        try:
            console.print("[bold cyan]Analytics Dashboard[/bold cyan]\n")
            
            # Get various statistics in parallel
            async def get_all_stats():
                tasks = [
                    db.get_prep_time_stats(restaurant_id, "1 hour"),
                    db.get_prep_time_stats(restaurant_id, "1 day"),
                    db.get_active_orders(restaurant_id),
                    db.get_demand_predictions(restaurant_id, 60),
                    db.get_item_popularity(restaurant_id)
                ]
                return await asyncio.gather(*tasks, return_exceptions=True)
            
            hour_stats, day_stats, active_orders, predictions, popular_items = await get_all_stats()
            
            # Create dashboard panels
            panels = []
            
            # Active orders panel
            if not isinstance(active_orders, Exception):
                active_count = len(active_orders)
                urgent_count = len([o for o in active_orders if o.get('urgency_score', 0) >= 2])
                
                active_panel = f"""[bold]Active Orders[/bold]
                
📋 Total: {active_count}
🚨 Urgent: {urgent_count}
⏱️  Oldest: {active_orders[0]['elapsed_minutes']}m ago""" if active_orders else "No active orders"
                
                panels.append(Panel(active_panel, border_style="cyan"))
            
            # Prep time panel
            if not isinstance(hour_stats, Exception) and hour_stats.get('total_orders', 0) > 0:
                prep_panel = f"""[bold]Prep Time (Last Hour)[/bold]
                
⏱️  Average: {hour_stats['avg_prep_time_minutes']:.1f}m
📊 Orders: {hour_stats['total_orders']}
📦 Items/Order: {hour_stats['items_per_order']:.1f}"""
                
                panels.append(Panel(prep_panel, border_style="green"))
            
            # Predictions panel
            if not isinstance(predictions, Exception) and predictions:
                top_predictions = predictions[:3]
                pred_text = "[bold]Next Hour Predictions[/bold]\n\n"
                for p in top_predictions:
                    pred_text += f"• {p['item_name']}: {p['predicted_quantity']}\n"
                
                panels.append(Panel(pred_text.strip(), border_style="yellow"))
            
            # Popular items panel
            if not isinstance(popular_items, Exception) and popular_items:
                top_items = popular_items[:3]
                pop_text = "[bold]Top Items Today[/bold]\n\n"
                for i, item in enumerate(top_items, 1):
                    pop_text += f"{i}. {item['item_name']} ({item['total_quantity']})\n"
                
                panels.append(Panel(pop_text.strip(), border_style="magenta"))
            
            # Display panels in grid
            if panels:
                console.print(Columns(panels[:2], equal=True, expand=True))
                if len(panels) > 2:
                    console.print()
                    console.print(Columns(panels[2:4], equal=True, expand=True))
            else:
                console.print("[yellow]No data available for dashboard[/yellow]")
            
        except Exception as e:
            console.print(f"[red]Error loading dashboard: {str(e)}[/red]")
            logger.error("Failed to load dashboard", error=str(e))
    
    asyncio.run(show_dashboard())