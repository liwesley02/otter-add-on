"""Server command to start the KDS web dashboard."""

import asyncio
import click
from rich.console import Console
import uvicorn
import structlog

console = Console()
logger = structlog.get_logger()


@click.command()
@click.option('--host', default='0.0.0.0', help='Host to bind to')
@click.option('--port', default=8000, help='Port to bind to')
@click.option('--reload', is_flag=True, help='Enable auto-reload for development')
@click.option('--workers', default=1, help='Number of worker processes')
def server(host: str, port: int, reload: bool, workers: int):
    """Start the KDS web dashboard server."""
    
    console.print(f"[bold cyan]Starting Otter KDS Dashboard[/bold cyan]")
    console.print(f"Server: http://{host}:{port}")
    console.print(f"Workers: {workers}")
    console.print(f"Auto-reload: {'Enabled' if reload else 'Disabled'}")
    console.print("\nPress Ctrl+C to stop\n")
    
    try:
        # Import the FastAPI app (will be created next)
        app_str = "src.kds.app:app"
        
        if reload:
            # Development mode with auto-reload
            uvicorn.run(
                app_str,
                host=host,
                port=port,
                reload=True,
                log_level="info"
            )
        else:
            # Production mode
            uvicorn.run(
                app_str,
                host=host,
                port=port,
                workers=workers,
                log_level="info"
            )
            
    except ModuleNotFoundError:
        console.print("[red]Error: FastAPI app not found[/red]")
        console.print("Creating placeholder app...")
        
        # Create a minimal FastAPI app for testing
        from fastapi import FastAPI
        from fastapi.responses import JSONResponse
        
        app = FastAPI(title="Otter KDS", version="6.0.0")
        
        @app.get("/")
        async def root():
            return JSONResponse({
                "message": "Otter KDS Dashboard",
                "status": "Starting up...",
                "version": "6.0.0"
            })
        
        @app.get("/health")
        async def health():
            return {"status": "healthy"}
        
        # Run the minimal app
        uvicorn.run(app, host=host, port=port)
        
    except KeyboardInterrupt:
        console.print("\n[yellow]Server stopped[/yellow]")
    except Exception as e:
        console.print(f"[red]Server error: {str(e)}[/red]")
        logger.error("Server failed to start", error=str(e))