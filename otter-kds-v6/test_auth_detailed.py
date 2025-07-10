"""Detailed test of Supabase authentication."""

import os
import json
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print("=== Environment Check ===")
print(f"URL: {url}")
print(f"Key exists: {'Yes' if key else 'No'}")
if key:
    print(f"Key length: {len(key)}")
    print(f"Key starts with: {key[:20]}...")
    print(f"Key ends with: ...{key[-20:]}")
    
    # Decode the JWT to check its structure (without verifying signature)
    try:
        # JWT has 3 parts separated by dots
        parts = key.split('.')
        if len(parts) == 3:
            # Decode the payload (second part)
            # Add padding if needed
            payload = parts[1]
            payload += '=' * (4 - len(payload) % 4)
            decoded = base64.urlsafe_b64decode(payload)
            data = json.loads(decoded)
            print(f"\nJWT payload includes:")
            print(f"  Role: {data.get('role', 'Not found')}")
            print(f"  Issuer: {data.get('iss', 'Not found')}")
            if 'exp' in data:
                import datetime
                exp_date = datetime.datetime.fromtimestamp(data['exp'])
                print(f"  Expires: {exp_date}")
        else:
            print(f"Key doesn't appear to be a valid JWT (parts: {len(parts)})")
    except Exception as e:
        print(f"Couldn't decode JWT: {e}")

print("\n=== Testing Connection ===")
try:
    from supabase import create_client
    client = create_client(url, key)
    print("✅ Client created")
    
    # Try to access the auth admin (this will fail with anon key, which is expected)
    try:
        # This should work with anon key
        result = client.auth.get_session()
        print("✅ Auth check passed")
    except Exception as e:
        print(f"Auth check: {e}")
    
    # Try a simple table query
    try:
        result = client.table("restaurants").select("count", count="exact").execute()
        print(f"✅ Database query successful")
    except Exception as e:
        print(f"❌ Database query failed: {e}")
        
except Exception as e:
    print(f"❌ Failed to create client: {e}")
    print(f"Error type: {type(e).__name__}")

print("\n=== Checking both keys ===")
service_key = os.getenv("SUPABASE_SERVICE_KEY")
if service_key:
    print("Service key is set, trying with service key...")
    try:
        from supabase import create_client
        client2 = create_client(url, service_key)
        print("✅ Client created with service key")
    except Exception as e:
        print(f"❌ Service key also failed: {e}")