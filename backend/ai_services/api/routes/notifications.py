from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ai_services.api.auth import get_user_id_from_token
from ai_services.core.supabase_client import client
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class SubscriptionModel(BaseModel):
    fcm_token: str

class UnsubscribeModel(BaseModel):
    fcm_token: str

@router.post("/subscribe")
def subscribe_to_notifications(subscription: SubscriptionModel, user_id: str = Depends(get_user_id_from_token)):
    """Store a user's FCM token for push notifications"""
    try:
        logger.info(f"Attempting to subscribe FCM token for user {user_id}")
        logger.info(f"FCM token (first 20 chars): {subscription.fcm_token[:20] if subscription.fcm_token else 'None'}")
        logger.info(f"FCM token length: {len(subscription.fcm_token) if subscription.fcm_token else 0}")
        
        # Validate input
        if not subscription.fcm_token:
            logger.error("No FCM token provided")
            raise HTTPException(status_code=400, detail="FCM token is required")
        
        if len(subscription.fcm_token) < 10:
            logger.error(f"FCM token too short: {len(subscription.fcm_token)} characters")
            raise HTTPException(status_code=400, detail="Invalid FCM token")
        
        # Check if subscription already exists
        logger.info("Checking if subscription already exists...")
        res = client.table("push_subscriptions").select("*").eq("fcm_token", subscription.fcm_token).execute()
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        
        logger.info(f"Existing subscription check result: {len(data) if data else 0} records found")
        
        if data and len(data) > 0:
            # Update existing subscription
            logger.info("Updating existing subscription...")
            res = client.table("push_subscriptions").update({
                "user_id": user_id,
                "updated_at": "now()"
            }).eq("fcm_token", subscription.fcm_token).execute()
            logger.info(f"Updated FCM subscription for user {user_id}")
        else:
            # Create new subscription
            logger.info("Creating new subscription...")
            res = client.table("push_subscriptions").insert({
                "user_id": user_id,
                "fcm_token": subscription.fcm_token
            }).execute()
            logger.info(f"Created new FCM subscription for user {user_id}")
        
        logger.info("Subscription saved successfully")
        return {"message": "Subscription saved successfully"}
    except HTTPException as he:
        logger.error(f"HTTP error in subscription: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error saving subscription: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unsubscribe")
def unsubscribe_from_notifications(unsubscribe_data: UnsubscribeModel, user_id: str = Depends(get_user_id_from_token)):
    """Remove a user's FCM subscription"""
    try:
        logger.info(f"Attempting to unsubscribe FCM token for user {user_id}")
        logger.info(f"FCM token (first 20 chars): {unsubscribe_data.fcm_token[:20] if unsubscribe_data.fcm_token else 'None'}")
        
        if not unsubscribe_data.fcm_token:
            logger.error("No FCM token provided for unsubscription")
            raise HTTPException(status_code=400, detail="FCM token is required")
        
        res = client.table("push_subscriptions").delete().eq("fcm_token", unsubscribe_data.fcm_token).execute()
        logger.info(f"Removed FCM subscription for user {user_id}")
        return {"message": "Subscription removed successfully"}
    except Exception as e:
        logger.error(f"Error removing subscription: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))