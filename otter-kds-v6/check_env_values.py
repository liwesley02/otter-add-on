"""Check what's in the .env file."""

import os
from pathlib import Path

# Show current directory
print(f"Current directory: {os.getcwd()}")

# Check if .env exists
env_path = Path(".env")
print(f"\n.env exists: {env_path.exists()}")
print(f".env absolute path: {env_path.absolute()}")

# Read and display the .env file content (masking sensitive parts)
if env_path.exists():
    print("\n.env file contents:")
    print("-" * 50)
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    if 'KEY' in key:
                        # Show only first/last 10 chars of keys
                        if len(value) > 20:
                            masked = f"{value[:10]}...{value[-10:]}"
                        else:
                            masked = value
                        print(f"{key}={masked}")
                    else:
                        print(line)
            elif line.startswith('#'):
                print(line)
    print("-" * 50)
else:
    print("\n.env file NOT FOUND!")

# Now test loading with python-dotenv
print("\nLoading with python-dotenv:")
from dotenv import load_dotenv
load_dotenv(override=True)  # Force reload

print(f"SUPABASE_URL from env: {os.getenv('SUPABASE_URL')}")
key = os.getenv('SUPABASE_KEY')
if key:
    print(f"SUPABASE_KEY from env: {key[:10]}...{key[-10:]} (length: {len(key)})")
else:
    print("SUPABASE_KEY from env: NOT SET")