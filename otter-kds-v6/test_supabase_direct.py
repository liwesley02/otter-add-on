"""Test Supabase connection directly."""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"URL: {url}")
print(f"Key starts with: {key[:10] if key else 'None'}")
print(f"Key length: {len(key) if key else 0}")

try:
    # Try to create client
    supabase = create_client(url, key)
    print("✅ Client created successfully!")
    
    # Try a simple query
    result = supabase.table("restaurants").select("*").limit(1).execute()
    print(f"✅ Query successful! Found {len(result.data)} restaurants")
    
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {str(e)}")
    print("\nPossible issues:")
    print("1. Wrong API key (make sure it's the 'anon public' key)")
    print("2. Key has extra spaces or line breaks")
    print("3. URL doesn't match the key's project")