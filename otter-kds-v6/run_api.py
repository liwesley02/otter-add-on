"""Run the FastAPI server."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    # Set environment variables if not set
    os.environ.setdefault("API_HOST", "0.0.0.0")
    os.environ.setdefault("API_PORT", "8000")
    os.environ.setdefault("API_RELOAD", "true")
    
    # Import and run
    from src.api.main import app
    import uvicorn
    
    print("Starting Otter KDS API Server...")
    print(f"Host: {os.environ['API_HOST']}")
    print(f"Port: {os.environ['API_PORT']}")
    print(f"Reload: {os.environ['API_RELOAD']}")
    print("\nAPI Documentation: http://localhost:8000/docs")
    print("WebSocket Demo: http://localhost:8000/ws/demo")
    
    uvicorn.run(
        "src.api.main:app",
        host=os.environ["API_HOST"],
        port=int(os.environ["API_PORT"]),
        reload=os.environ["API_RELOAD"].lower() == "true",
        access_log=True,
        log_level="info"
    )