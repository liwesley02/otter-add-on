"""Test Supabase connection."""

import asyncio
import os
from dotenv import load_dotenv
from src.database import SupabaseManager

# Load environment variables
load_dotenv()

async def test_connection():
    """Test the Supabase connection."""
    print("Testing Supabase connection...")
    print(f"URL: {os.getenv('SUPABASE_URL')}")
    
    try:
        # Initialize manager
        db = SupabaseManager()
        
        # Test basic connection by checking if we can access the client
        if db.client:
            print("✅ Successfully connected to Supabase!")
            
            # Try to query restaurants (will be empty initially)
            try:
                result = db.client.table("restaurants").select("*").execute()
                print(f"Found {len(result.data)} restaurants")
            except Exception as e:
                print(f"⚠️  Tables not yet created. Run migrations first.")
                print(f"   Error: {str(e)}")
        else:
            print("❌ Failed to connect to Supabase")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\nMake sure you have:")
        print("1. Created a Supabase project")
        print("2. Set SUPABASE_URL and SUPABASE_KEY in .env")
        print("3. Run the migration scripts in order:")
        print("   - 000_enable_auth.sql")
        print("   - 001_initial_schema.sql")
        print("   - 002_row_level_security.sql")
        print("   - 003_realtime_and_functions.sql")

if __name__ == "__main__":
    asyncio.run(test_connection())