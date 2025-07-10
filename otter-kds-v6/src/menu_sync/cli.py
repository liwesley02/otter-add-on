"""CLI interface for menu synchronization."""

import asyncio
import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

from src.config.settings import settings
from src.menu_sync.sync import MenuSyncService, start_sync_service
from src.utils.logging import setup_logging

console = Console()


@click.group()
def cli():
    """Otter Menu Sync - Synchronize menu data from Otter."""
    setup_logging()


@cli.command()
@click.option(
    '--restaurant-id', 
    help='Specific restaurant ID to sync',
    default=None
)
@click.option(
    '--dry-run',
    is_flag=True,
    help='Run in dry-run mode (no changes applied)'
)
@click.option(
    '--profile',
    help='Profile name to use for sync',
    default=None
)
@click.option(
    '--all-profiles',
    is_flag=True,
    help='Sync all configured profiles'
)
def sync(restaurant_id: str, dry_run: bool, profile: str, all_profiles: bool):
    """Run a one-time menu synchronization."""
    if dry_run:
        settings.dry_run_mode = True
        console.print("[yellow]Running in dry-run mode - no changes will be applied[/yellow]")
    
    if all_profiles:
        # Sync all profiles
        from src.config.profiles import profile_manager
        profiles = profile_manager.list_profiles()
        
        if not profiles:
            console.print("[red]No profiles configured[/red]")
            return
        
        console.print(f"[cyan]Syncing {len(profiles)} profiles...[/cyan]")
        
        for profile_name in profiles:
            console.print(f"\n[bold]Profile: {profile_name}[/bold]")
            _sync_single_profile(profile_name, restaurant_id)
    else:
        # Single profile sync
        _sync_single_profile(profile, restaurant_id)


def _sync_single_profile(profile_name: Optional[str], restaurant_id: Optional[str]):
    """Sync a single profile."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Synchronizing menu data...", total=None)
        
        async def run_sync():
            sync_service = MenuSyncService(profile_name)
            result = await sync_service.sync_menu(restaurant_id)
            return result
        
        result = asyncio.run(run_sync())
        progress.update(task, completed=True)
    
    if result.status == "success":
        console.print("[green]✓ Menu sync completed successfully![/green]")
        
        if result.sync_status:
            # Display sync statistics
            table = Table(title="Sync Statistics")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="magenta")
            
            table.add_row("Items Processed", str(result.sync_status.items_processed))
            table.add_row("Items Created", str(result.sync_status.items_created))
            table.add_row("Items Updated", str(result.sync_status.items_updated))
            table.add_row("Items Deleted", str(result.sync_status.items_deleted))
            
            console.print(table)
            
            if result.sync_status.errors:
                console.print("\n[red]Errors encountered:[/red]")
                for error in result.sync_status.errors:
                    console.print(f"  • {error}")
    else:
        console.print(f"[red]✗ Menu sync failed: {result.error}[/red]")


@cli.command()
def start():
    """Start the menu sync service (runs continuously)."""
    console.print(
        f"[green]Starting menu sync service[/green]\n"
        f"Sync interval: {settings.sync_interval_minutes} minutes\n"
        f"Press Ctrl+C to stop"
    )
    
    try:
        start_sync_service()
    except KeyboardInterrupt:
        console.print("\n[yellow]Menu sync service stopped[/yellow]")


@cli.command()
def status():
    """Check the current configuration and status."""
    table = Table(title="Menu Sync Configuration")
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="magenta")
    
    table.add_row("Otter Username", settings.otter_username)
    table.add_row("Otter Base URL", settings.otter_base_url)
    table.add_row("Sync Interval", f"{settings.sync_interval_minutes} minutes")
    table.add_row("Sync Enabled", "Yes" if settings.sync_enabled else "No")
    table.add_row("Dry Run Mode", "Yes" if settings.dry_run_mode else "No")
    table.add_row("Log Level", settings.log_level)
    
    console.print(table)


@cli.command()
@click.option(
    '--format',
    type=click.Choice(['json', 'csv', 'table']),
    default='table',
    help='Output format for menu data'
)
def export(format: str):
    """Export current menu data."""
    async def export_menu():
        sync_service = MenuSyncService()
        
        # Authenticate and fetch menu
        async with sync_service.client as client:
            if not await client.authenticate():
                console.print("[red]Authentication failed[/red]")
                return
            
            menu = await client.fetch_menu_data()
            if not menu:
                console.print("[red]Failed to fetch menu data[/red]")
                return
        
        if format == 'json':
            import json
            console.print(json.dumps(menu.model_dump(), indent=2))
        elif format == 'csv':
            # Export as CSV
            import csv
            import sys
            writer = csv.writer(sys.stdout)
            writer.writerow(['Category', 'Item Name', 'Description', 'Price'])
            
            for category in menu.categories:
                for item in category.items:
                    writer.writerow([
                        category.name,
                        item.name,
                        item.description or '',
                        f"${item.price:.2f}"
                    ])
        else:  # table
            for category in menu.categories:
                table = Table(title=f"Category: {category.name}")
                table.add_column("Item", style="cyan")
                table.add_column("Description", style="white")
                table.add_column("Price", style="green")
                
                for item in category.items:
                    table.add_row(
                        item.name,
                        item.description or "",
                        f"${item.price:.2f}"
                    )
                
                console.print(table)
                console.print()
    
    asyncio.run(export_menu())


@cli.group()
def profile():
    """Manage Otter account profiles."""
    pass


@profile.command('add')
@click.option('--name', prompt=True, help='Profile name')
@click.option('--username', prompt=True, help='Otter username/email')
@click.option('--password', prompt=True, hide_input=True, help='Otter password')
@click.option('--description', help='Profile description')
def profile_add(name: str, username: str, password: str, description: str):
    """Add a new Otter account profile."""
    from src.config.profiles import profile_manager, OtterProfile
    
    try:
        profile = OtterProfile(
            name=name,
            username=username,
            password=password,
            description=description
        )
        profile_manager.add_profile(profile)
        console.print(f"[green]✓ Profile '{name}' added successfully![/green]")
    except Exception as e:
        console.print(f"[red]✗ Error adding profile: {e}[/red]")


@profile.command('list')
def profile_list():
    """List all configured profiles."""
    from src.config.profiles import profile_manager
    
    profiles = profile_manager.list_profiles()
    
    if not profiles:
        console.print("[yellow]No profiles configured[/yellow]")
        console.print("Use 'profile add' to add a profile")
        return
    
    table = Table(title="Configured Profiles")
    table.add_column("Name", style="cyan")
    table.add_column("Username", style="magenta")
    table.add_column("Description", style="white")
    
    for name in profiles:
        profile = profile_manager.get_profile(name)
        table.add_row(
            name,
            profile.username,
            profile.description or ""
        )
    
    console.print(table)


@profile.command('remove')
@click.argument('name')
def profile_remove(name: str):
    """Remove a profile."""
    from src.config.profiles import profile_manager
    
    if profile_manager.remove_profile(name):
        console.print(f"[green]✓ Profile '{name}' removed[/green]")
    else:
        console.print(f"[red]✗ Profile '{name}' not found[/red]")


@profile.command('show')
@click.argument('name')
def profile_show(name: str):
    """Show details of a specific profile."""
    from src.config.profiles import profile_manager
    
    profile = profile_manager.get_profile(name)
    if not profile:
        console.print(f"[red]Profile '{name}' not found[/red]")
        return
    
    table = Table(title=f"Profile: {name}")
    table.add_column("Field", style="cyan")
    table.add_column("Value", style="magenta")
    
    table.add_row("Username", profile.username)
    table.add_row("Base URL", profile.base_url)
    table.add_row("Description", profile.description or "")
    if profile.restaurant_ids:
        table.add_row("Restaurant IDs", ", ".join(profile.restaurant_ids))
    
    console.print(table)


if __name__ == "__main__":
    cli()