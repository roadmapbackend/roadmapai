from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer(auto_error=False)

def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """
    Validates the Supabase JWT token passed in the Authorization header
    and extracts the authenticated user's UUID.
    Falls back to a demo ID in development if no token is provided.
    """
    if not credentials or not credentials.credentials:
        # Default UUID for rapid development / guest simulation
        return "00000000-0000-0000-0000-000000000001"
    
    token = credentials.credentials
    if settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET != "your-supabase-jwt-secret-here":
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            user_id: str = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token claims: sub missing"
                )
            return user_id
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token validation failed: {str(e)}"
            )
    else:
        # Unverified decode for development mode
        try:
            payload = jwt.get_unverified_claims(token)
            return payload.get("sub") or "00000000-0000-0000-0000-000000000001"
        except Exception:
            return "00000000-0000-0000-0000-000000000001"
