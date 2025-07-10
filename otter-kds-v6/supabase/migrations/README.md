# Supabase Migrations for Otter KDS v6

These migrations are designed to work with existing Supabase projects without permission errors.

## Migration Order

Run these SQL files in your Supabase SQL Editor in this exact order:

### 1. Initial Schema (001_initial_schema_safe.sql)
- Creates all KDS tables (restaurants, orders, etc.)
- Checks for existing tables before creating
- Handles permission issues gracefully
- Creates `user_profiles` if needed

### 2. Row Level Security (002_row_level_security_fixed.sql)
- Enables RLS for data isolation between restaurants
- Skips protected tables gracefully
- Ensures each restaurant only sees their own data

### 3. Real-time and Functions (003_realtime_and_functions.sql)
- Enables real-time subscriptions for orders
- Creates analytics helper functions
- Sets up performance optimizations

## Quick Start

1. Copy each SQL file content
2. Paste into Supabase SQL Editor
3. Run each migration in order
4. Test with: `python test_connection.py`

## Important Notes

- These migrations work with existing Supabase projects
- No modifications to system tables (auth.users)
- All tables are created in the public schema
- Full multi-restaurant data isolation included