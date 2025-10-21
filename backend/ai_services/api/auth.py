# backend/ai_services/api/auth.py
from fastapi import HTTPException, Header, APIRouter, Depends
from typing import Optional
import logging
from ..core.supabase_client import client

logger = logging.getLogger(__name__)
router = APIRouter()


def register_user(name: str, email: str, password: str):
    """Registers a user via Supabase Auth and stores profile in users table."""
    try:
        # ✅ Pass a dictionary, not keyword args
        res = client.auth.sign_up({
            "email": email,
            "password": password
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signup failed: {e}")

    # Handle different response types
    user_data = getattr(res, 'user', res.get('user') if isinstance(res, dict) else None) if res else None
    if not user_data:
        raise HTTPException(status_code=400, detail="Registration failed")

    auth_user_id = getattr(user_data, 'id', user_data.get('id') if isinstance(user_data, dict) else None) if user_data else None
    if not auth_user_id:
        raise HTTPException(status_code=400, detail="Registration failed - no user ID")

    # Insert into custom users table
    profile = {
        "auth_user_id": auth_user_id,
        "name": name,
        "email": email
    }
    result = client.table("users").insert(profile).execute()

    # Simple error checking without accessing specific attributes
    if str(result).lower().find('error') != -1 and hasattr(result, '__str__'):
        raise HTTPException(status_code=400, detail=f"Failed to create user profile: {str(result)}")

    return {"auth_user_id": auth_user_id, "email": email, "name": name}


def login_user(email: str, password: str):
    try:
        res = client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        session = getattr(res, 'session', res.get('session') if isinstance(res, dict) else None) if res else None
        if not session:
            raise HTTPException(status_code=400, detail="Invalid login credentials")
        return {"message": "Login successful", "session": session}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {e}")


def get_user_from_token(authorization: Optional[str] = Header(None)):
    """Verifies user token and returns user info."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ")[1]

    try:
        # Use the Supabase client to verify the token
        user_response = client.auth.get_user(token)
        user = getattr(user_response, 'user', user_response.get('user') if isinstance(user_response, dict) else None) if user_response else None
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except Exception as e:
        logger.error("Token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_user_id_from_token(user = Depends(get_user_from_token)):
    auth_user_id = getattr(user, 'id', user.get('id') if isinstance(user, dict) else None) if user else None
    if not auth_user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")
    
    try:
        # Query the users table to get the internal user ID
        res = client.table("users").select("id").eq("auth_user_id", auth_user_id).execute()
        
        # Handle response data safely
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        
        # If user not found, create profile for OAuth users (just-in-time creation)
        if not data or (isinstance(data, list) and len(data) == 0):
            # Get user email from the auth user object
            email = getattr(user, 'email', user.get('email') if isinstance(user, dict) else None) if user else None
            if not email:
                raise HTTPException(status_code=400, detail="User email not found")
            
            # Create user profile for OAuth users
            profile = {
                "auth_user_id": auth_user_id,
                "email": email,
                "name": email.split('@')[0]  # Use email prefix as name by default
            }
            
            try:
                insert_res = client.table("users").insert(profile).execute()
                insert_data = getattr(insert_res, 'data', insert_res.get('data') if isinstance(insert_res, dict) else None) if insert_res else None
                
                if not insert_data:
                    logger.error("Failed to create user profile: No data returned from insert")
                    raise HTTPException(status_code=500, detail="Failed to create user profile")
                
                # Use the newly created user's ID
                user_data = insert_data[0] if isinstance(insert_data, list) and len(insert_data) > 0 else insert_data
                user_id = user_data.get("id") if isinstance(user_data, dict) else None
                logger.info(f"Created new user profile for OAuth user: {auth_user_id}, assigned ID: {user_id}")
            except Exception as insert_error:
                logger.error(f"Error creating user profile: {str(insert_error)}")
                # Check if user was created by another request simultaneously
                retry_res = client.table("users").select("id").eq("auth_user_id", auth_user_id).execute()
                retry_data = getattr(retry_res, 'data', retry_res.get('data') if isinstance(retry_res, dict) else None) if retry_res else None
                if retry_data and len(retry_data) > 0:
                    user_data = retry_data[0]
                    user_id = user_data.get("id") if isinstance(user_data, dict) else None
                    logger.info(f"Found existing user profile on retry: {auth_user_id}, ID: {user_id}")
                else:
                    raise HTTPException(status_code=500, detail=f"Failed to create user profile: {str(insert_error)}")
        else:
            # Get first user's id
            user_data = data[0] if isinstance(data, list) and len(data) > 0 else data if isinstance(data, dict) else None
            if not user_data:
                raise HTTPException(status_code=404, detail="User not found")
                
            user_id = user_data.get("id") if isinstance(user_data, dict) else None
        
        if not user_id:
            raise HTTPException(status_code=404, detail="User not found")
            
        logger.info(f"User authenticated successfully. Auth ID: {auth_user_id}, Internal ID: {user_id}")
        return user_id
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error("Error fetching/creating user ID: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")
