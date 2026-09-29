from supabase import create_client, Client
from app.core.config import settings

_supabase_admin: Client = None

def get_supabase_admin() -> Client:
    """
    Returns a backend singleton Supabase client authenticated with the service role key.
    Agents interact through typed backend tools only, preserving DB isolation.
    """
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_admin
