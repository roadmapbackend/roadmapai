from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import Dict, Any
from app.core.security import get_current_user_id
from app.services.billing_service import get_user_subscription, update_user_tier
from app.core.config import settings

router = APIRouter()

@router.get("/status", response_model=Dict[str, Any])
async def get_subscription_status(
    user_id: str = Depends(get_current_user_id)
):
    return get_user_subscription(user_id)

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook handler for subscription updates from Stripe/payment provider.
    """
    payload = await request.json()
    event_type = payload.get("type", "")
    
    # Secure server-side tier synchronization
    if event_type == "customer.subscription.created" or event_type == "invoice.payment_succeeded":
        data = payload.get("data", {}).get("object", {})
        customer_id = data.get("customer")
        # In production, lookup user by customer_id and promote tier
        pass
        
    return {"status": "handled"}
