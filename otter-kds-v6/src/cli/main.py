"""Main CLI entry point for Otter KDS v6."""

import os
import asyncio
from pathlib import Path
import click
from rich.console import Console
from rich.panel import Panel
import structlog

from .order_commands import orders, items
from .analytics_commands import analytics
from .server_command import server
from ..database import SupabaseManager
from ..auth import AuthManager, LoginRequest, SignupRequest

console = Console()
logger = structlog.get_logger()

# CLI context settings
CONTEXT_SETTINGS = dict(help_option_names=['-h', '--help'])

# Config directory for storing auth tokens
CONFIG_DIR = Path.home() / '.otter-kds'
TOKEN_FILE = CONFIG_DIR / 'auth_token.json'


@click.group(context_settings=CONTEXT_SETTINGS)
@click.version_option(version='6.0.0', prog_name='Otter KDS')
def cli():
    """Otter Kitchen Display System - Manage orders and analytics.
    
    \b
    Examples:
      otter-kds login --email chef@restaurant.com
      otter-kds orders list --restaurant-id <uuid>
      otter-kds analytics dashboard --restaurant-id <uuid>
      otter-kds server start
    """
    # Ensure config directory exists
    CONFIG_DIR.mkdir(exist_ok=True)


@cli.command()
@click.option('--email', prompt=True, help='Your email address')
@click.option('--password', prompt=True, hide_input=True, help='Your password')
@click.option('--restaurant-id', help='Specific restaurant to log into (for multi-location users)')
def login(email: str, password: str, restaurant_id: str):
    """Log in to your restaurant account."""
    
    async def do_login():
        db = SupabaseManager()
        auth = AuthManager(db)
        
        try:
            # Create login request
            login_req = LoginRequest(
                email=email,
                password=password,
                restaurant_id=restaurant_id
            )
            
            # Attempt login
            with console.status("Logging in..."):
                response = await auth.login(login_req)
            
            # Save token
            import json
            token_data = {
                'token': response.token.access_token,
                'user_id': str(response.user_id),
                'email': response.email,
                'restaurants': [
                    {
                        'id': str(r.id),
                        'name': r.name,
                        'role': r.role
                    } for r in response.restaurants
                ],
                'active_restaurant': {
                    'id': str(response.active_restaurant.id),
                    'name': response.active_restaurant.name,
                    'role': response.active_restaurant.role
                } if response.active_restaurant else None
            }
            
            TOKEN_FILE.write_text(json.dumps(token_data, indent=2))
            
            # Display success
            console.print(f"[green]✓ Logged in as {response.email}[/green]")
            
            if response.active_restaurant:
                console.print(f"Active restaurant: [cyan]{response.active_restaurant.name}[/cyan] (Role: {response.active_restaurant.role})")
            
            if response.has_multiple_restaurants:
                console.print(f"\nYou have access to {len(response.restaurants)} restaurants:")
                for r in response.restaurants:
                    console.print(f"  • {r.name} ({r.role})")
                console.print("\nUse 'otter-kds switch' to change restaurants")
            
        except Exception as e:
            console.print(f"[red]Login failed: {str(e)}[/red]")
            logger.error("Login failed", error=str(e))
    
    asyncio.run(do_login())


@cli.command()
def logout():
    """Log out from your account."""
    if TOKEN_FILE.exists():
        TOKEN_FILE.unlink()
        console.print("[green]✓ Logged out successfully[/green]")
    else:
        console.print("[yellow]Not logged in[/yellow]")


@cli.command()
@click.option('--name', prompt=True, help='Your name')
@click.option('--email', prompt=True, help='Your email address')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='Your password')
@click.option('--restaurant-name', prompt=True, help='Restaurant name')
@click.option('--restaurant-location', prompt=True, help='Restaurant location')
@click.option('--timezone', default='America/New_York', help='Restaurant timezone')
def signup(name: str, email: str, password: str, restaurant_name: str, 
          restaurant_location: str, timezone: str):
    """Sign up for a new restaurant account."""
    
    async def do_signup():
        db = SupabaseManager()
        auth = AuthManager(db)
        
        try:
            # Create signup request
            signup_req = SignupRequest(
                email=email,
                password=password,
                name=name,
                restaurant_name=restaurant_name,
                restaurant_location=restaurant_location,
                timezone=timezone
            )
            
            # Attempt signup
            with console.status("Creating account..."):
                response = await auth.signup(signup_req)
            
            # Save token
            import json
            token_data = {
                'token': response.token.access_token,
                'user_id': str(response.user_id),
                'email': response.email,
                'restaurants': [{
                    'id': str(response.active_restaurant.id),
                    'name': response.active_restaurant.name,
                    'role': response.active_restaurant.role
                }],
                'active_restaurant': {
                    'id': str(response.active_restaurant.id),
                    'name': response.active_restaurant.name,
                    'role': response.active_restaurant.role
                }
            }
            
            TOKEN_FILE.write_text(json.dumps(token_data, indent=2))
            
            # Display success
            console.print(f"[green]✓ Account created successfully![/green]")
            console.print(f"Restaurant: [cyan]{restaurant_name}[/cyan]")
            console.print(f"Location: {restaurant_location}")
            console.print(f"You are now logged in as the owner")
            
        except Exception as e:
            console.print(f"[red]Signup failed: {str(e)}[/red]")
            logger.error("Signup failed", error=str(e))
    
    asyncio.run(do_signup())


@cli.command()
def whoami():
    """Show current logged-in user and restaurant."""
    if not TOKEN_FILE.exists():
        console.print("[yellow]Not logged in[/yellow]")
        console.print("Use 'otter-kds login' to log in")
        return
    
    import json
    try:
        data = json.loads(TOKEN_FILE.read_text())
        
        info_text = f"""[bold]Current Session[/bold]
        
👤 User: {data['email']}
🏪 Restaurant: {data['active_restaurant']['name']}
👔 Role: {data['active_restaurant']['role']}
🏢 Total Restaurants: {len(data['restaurants'])}
        """
        
        console.print(Panel(info_text, border_style="cyan"))
        
    except Exception as e:
        console.print("[red]Error reading auth token[/red]")
        console.print("Try logging in again")


@cli.command()
@click.argument('restaurant_id')
def switch(restaurant_id: str):
    """Switch to a different restaurant (for multi-location users)."""
    
    async def do_switch():
        if not TOKEN_FILE.exists():
            console.print("[yellow]Not logged in[/yellow]")
            return
        
        import json
        data = json.loads(TOKEN_FILE.read_text())
        
        # Check if user has access to this restaurant
        restaurant = next(
            (r for r in data['restaurants'] if r['id'] == restaurant_id),
            None
        )
        
        if not restaurant:
            console.print(f"[red]You don't have access to restaurant {restaurant_id}[/red]")
            console.print("\nYour restaurants:")
            for r in data['restaurants']:
                console.print(f"  • {r['name']} (ID: {r['id']})")
            return
        
        # Update active restaurant
        data['active_restaurant'] = restaurant
        TOKEN_FILE.write_text(json.dumps(data, indent=2))
        
        console.print(f"[green]✓ Switched to {restaurant['name']}[/green]")
        console.print(f"Role: {restaurant['role']}")
    
    asyncio.run(do_switch())


@cli.command()
def restaurants():
    """List all restaurants you have access to."""
    if not TOKEN_FILE.exists():
        console.print("[yellow]Not logged in[/yellow]")
        return
    
    import json
    try:
        data = json.loads(TOKEN_FILE.read_text())
        
        from rich.table import Table
        table = Table(title="Your Restaurants")
        table.add_column("Name", style="cyan")
        table.add_column("ID", style="magenta")
        table.add_column("Role", style="yellow")
        table.add_column("Active", style="green")
        
        for r in data['restaurants']:
            is_active = "✓" if r['id'] == data['active_restaurant']['id'] else ""
            table.add_row(
                r['name'],
                r['id'],
                r['role'],
                is_active
            )
        
        console.print(table)
        
        if len(data['restaurants']) > 1:
            console.print("\nUse 'otter-kds switch <restaurant-id>' to change active restaurant")
            
    except Exception as e:
        console.print("[red]Error reading restaurants[/red]")


# Add command groups
cli.add_command(orders)
cli.add_command(analytics)
cli.add_command(server)

# Add the items subgroup to orders
orders.add_command(items)


def get_current_restaurant_id():
    """Helper to get current restaurant ID from token."""
    if not TOKEN_FILE.exists():
        console.print("[red]Not logged in. Use 'otter-kds login' first[/red]")
        return None
    
    import json
    try:
        data = json.loads(TOKEN_FILE.read_text())
        return data['active_restaurant']['id']
    except:
        return None


# Override the restaurant-id requirement for commands when logged in
def inject_restaurant_id(ctx, param, value):
    """Inject restaurant ID from auth token if not provided."""
    if value is None:
        value = get_current_restaurant_id()
    return value


# Update command options to use the injector
# This would be done by modifying the click.option decorators in the command files


if __name__ == "__main__":
    cli()