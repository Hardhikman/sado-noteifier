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
        # Check if subscription already exists
        res = client.table("push_subscriptions").select("*").eq("fcm_token", subscription.fcm_token).execute()
        data = getattr(res, 'data', res.get('data') if isinstance(res, dict) else None) if res else None
        
        if data and len(data) > 0:
            # Update existing subscription
            res = client.table("push_subscriptions").update({
                "user_id": user_id,
                "updated_at": "now()"
            }).eq("fcm_token", subscription.fcm_token).execute()
            logger.info(f"Updated FCM subscription for user {user_id}")
        else:
            # Create new subscription
            res = client.table("push_subscriptions").insert({
                "user_id": user_id,
                "fcm_token": subscription.fcm_token
            }).execute()
            logger.info(f"Created new FCM subscription for user {user_id}")
        
        return {"message": "Subscription saved successfully"}
    except Exception as e:
        logger.error(f"Error saving subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unsubscribe")
def unsubscribe_from_notifications(unsubscribe_data: UnsubscribeModel, user_id: str = Depends(get_user_id_from_token)):
    """Remove a user's FCM subscription"""
    try:
        res = client.table("push_subscriptions").delete().eq("fcm_token", unsubscribe_data.fcm_token).execute()
        logger.info(f"Removed FCM subscription for user {user_id}")
        return {"message": "Subscription removed successfully"}
    except Exception as e:
        logger.error(f"Error removing subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))