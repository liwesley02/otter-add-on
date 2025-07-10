"""Check which .env file is being loaded."""

import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# Show current working directory
print(f"Current working directory: {os.getcwd()}")
print()

# Find .env file
dotenv_path = find_dotenv()
print(f"python-dotenv found .env at: {dotenv_path}")
print()

# Check multiple possible locations
possible_paths = [
    Path(".env"),  # Current directory
    Path(__file__).parent / ".env",  # Same directory as this script
    Path("/mnt/c/Users/liwes/OneDrive/Desktop/Python Projects/Otter Order Consolidator/otter-kds-v6/.env"),
    Path("C:/Users/liwes/OneDrive/Desktop/Python Projects/Otter Order Consolidator/otter-kds-v6/.env"),
]

print("Checking possible .env locations:")
for path in possible_paths:
    exists = path.exists() if not str(path).startswith("/mnt") else os.path.exists(str(path))
    print(f"  {path}: {'EXISTS' if exists else 'NOT FOUND'}")
    if exists and str(path).endswith(".env"):
        # Try to read first few lines
        try:
            with open(path, 'r') as f:
                lines = f.readlines()[:3]
                print(f"    First lines: {lines[0].strip()}")
        except:
            pass

print()

# Load and check what we get
load_dotenv()
print("Environment variables after load_dotenv():")
print(f"  SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
key = os.getenv('SUPABASE_KEY')
if key:
    print(f"  SUPABASE_KEY: {key[:15]}... (length: {len(key)})")
else:
    print(f"  SUPABASE_KEY: NOT SET")

# Try loading specific path
specific_path = Path(__file__).parent / ".env"
if specific_path.exists():
    print(f"\nLoading from specific path: {specific_path}")
    load_dotenv(specific_path, override=True)
    print(f"  SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
    key = os.getenv('SUPABASE_KEY')
    if key:
        print(f"  SUPABASE_KEY: {key[:15]}... (length: {len(key)})")