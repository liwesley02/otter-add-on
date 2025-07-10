# Claude Continue Context - Otter KDS v6

## Quick Summary for Next Session
You're building Otter KDS v6, a Python-based Kitchen Display System that evolved from a Chrome extension (v4). The system now uses Supabase for the database with complete multi-restaurant support.

## What's Done ✅
1. **Database**: Supabase migrations completed, tables created
2. **Auth**: Multi-restaurant authentication working
3. **CLI**: Full command-line interface implemented
4. **Models**: Order and user models with Pydantic validation
5. **Migration Issues**: Fixed all permission/type mismatch errors

## What's Next 🔄
1. **Create FastAPI Web Server** (Priority 1)
   - File: `src/api/main.py` (needs to be created)
   - WebSocket support for real-time orders
   - REST endpoints for Chrome extension
   - CORS configuration

2. **Update Chrome Extension** (Priority 2)
   - Modify v4 extension to use Python API
   - Update batch label printing
   - Add restaurant selection UI

## Key Technical Details
- **Python**: 3.13 (pandas skipped due to compatibility)
- **Database**: Supabase with RLS enabled
- **Auth**: Supabase Auth with JWT tokens
- **Tables**: Uses `user_profiles` (not `users`) to avoid conflicts
- **Real-time**: Supabase real-time subscriptions ready

## Project Location
```
C:\Users\liwes\OneDrive\Desktop\Python Projects\Otter Order Consolidator\otter-kds-v6
```

## Critical Files
- `src/database/supabase_manager.py` - Database operations
- `src/auth/manager.py` - Authentication logic
- `src/cli/main.py` - CLI commands
- `PROJECT_STATUS.md` - Detailed documentation

## Environment Variables Needed
```
SUPABASE_URL=xxx
SUPABASE_KEY=xxx
JWT_SECRET=xxx
```

## Next Command to Run
When you continue, start with:
```python
# Create the FastAPI server
# File: src/api/main.py
```

The user wants to continue building the web API to connect the Chrome extension to this Python backend.