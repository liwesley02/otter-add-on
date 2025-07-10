"""Debug environment variables."""

import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Check what's loaded
print("Environment variables loaded:")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")

# Only show first/last 10 chars of keys for security
key = os.getenv('SUPABASE_KEY')
if key:
    print(f"SUPABASE_KEY: {key[:10]}...{key[-10:]} (length: {len(key)})")
else:
    print("SUPABASE_KEY: Not found")

service_key = os.getenv('SUPABASE_SERVICE_KEY')
if service_key:
    print(f"SUPABASE_SERVICE_KEY: {service_key[:10]}...{service_key[-10:]} (length: {len(service_key)})")
else:
    print("SUPABASE_SERVICE_KEY: Not found")

jwt_secret = os.getenv('JWT_SECRET')
if jwt_secret:
    print(f"JWT_SECRET: {'*' * len(jwt_secret)} (length: {len(jwt_secret)})")
else:
    print("JWT_SECRET: Not found")

# Check if .env file exists
from pathlib import Path
env_path = Path('.env')
print(f"\n.env file exists: {env_path.exists()}")
if env_path.exists():
    print(f".env file location: {env_path.absolute()}")