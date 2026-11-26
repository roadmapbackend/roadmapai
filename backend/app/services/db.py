from threading import Lock

from supabase import create_client, Client, ClientOptions
from app.core.config import settings

_supabase_admin: Client = None
_lock = Lock()

def get_supabase_admin() -> Client:
    """
    Returns a backend singleton Supabase client authenticated with the service role key.
    Agents interact through typed backend tools only, preserving DB isolation.
    """
    global _supabase_admin
    if _supabase_admin is None:
        # Handlers run in several threads, so only one may create the client
        with _lock:
            if _supabase_admin is None:
                _supabase_admin = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY,
                    options=ClientOptions(postgrest_client_timeout=settings.DB_TIMEOUT_SECONDS),
                )
    return _supabase_admin
