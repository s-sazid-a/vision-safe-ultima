from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import razorpay
import logging
import config
from database.client import db
from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

# Initialize Razorpay Client
# Note: We initialize lazily or handle missing keys gracefully to avoid crash on startup
razorpay_client = None
if config.RAZORPAY_KEY_ID and config.RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(config.RAZORPAY_KEY_ID, config.RAZORPAY_KEY_SECRET))
else:
    logger.warning("⚠️ Razorpay keys not found. Payment endpoints will fail.")

# --- Models ---
class OrderRequest(BaseModel):
    amount: int  # Amount in INR (full units, e.g., 299)
    currency: str = "INR"
    plan_id: str  # 'starter', 'professional', 'enterprise'

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str

# --- Endpoints ---

@router.post("/create-order")
async def create_payment_order(
    request: OrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a Razorpay order for the specified amount.
    """
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    try:
        # Check if plan is valid
        if request.plan_id not in ['starter', 'professional', 'enterprise']:
             raise HTTPException(status_code=400, detail="Invalid plan selected")

        # Amount in paise (1 INR = 100 paise)
        amount_paise = request.amount * 100
        
        data = {
            "amount": amount_paise,
            "currency": request.currency,
            "receipt": f"receipt_{current_user['id'][:8]}_{request.plan_id}",
            "notes": {
                "user_id": current_user['id'],
                "email": current_user['email'],
                "plan": request.plan_id
            }
        }
        
        order = razorpay_client.order.create(data=data)
        
        return {
            "id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "key_id": config.RAZORPAY_KEY_ID
        }
        
    except Exception as e:
        logger.error(f"Error creating Razorpay order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_payment(
    verification: PaymentVerification,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify Razorpay payment signature and update user subscription.
    """
    if not razorpay_client:
         raise HTTPException(status_code=503, detail="Payment gateway not configured")

    try:
        # Verify Signature
        params_dict = {
            'razorpay_order_id': verification.razorpay_order_id,
            'razorpay_payment_id': verification.razorpay_payment_id,
            'razorpay_signature': verification.razorpay_signature
        }
        
        # This will raise an error if verification fails
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # If successful, update user subscription
        logger.info(f"✅ Payment verified for user {current_user['id']} (Plan: {verification.plan_id})")
        
        await db.execute(
            "UPDATE users SET subscription_tier = ? WHERE id = ?",
            (verification.plan_id, current_user['id'])
        )
        
        return {"status": "success", "message": f"Subscription upgraded to {verification.plan_id.title()}"}
        
    except razorpay.errors.SignatureVerificationError:
        logger.error("❌ Payment Signature Verification Failed")
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        logger.error(f"Error validating payment: {e}")
        raise HTTPException(status_code=500, detail="Payment verification failed")
