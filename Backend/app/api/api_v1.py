from fastapi import APIRouter
from app.api.routes.auth_routes import router as auth_router
from app.api.routes.user_routes import router as user_router
from app.api.routes.seller_routes import router as seller_router
from app.api.routes.product_routes import router as product_router
from app.api.routes.order_routes import router as order_router
from app.api.routes.payment_routes import router as payment_router
from app.api.routes.delivery_routes import router as delivery_router
from app.api.routes.subscription_routes import router as subscription_router
from app.api.routes.admin_routes import router as admin_router
from app.api.routes.search_routes import router as search_router
from app.api.routes.category_routes import router as category_router
from app.api.routes.notification_routes import router as notification_router
from app.api.routes.store_routes import router as store_router
from app.api.routes.review_routes import router as review_router
from app.api.routes.wallet_routes import router as wallet_router
from app.api.routes.payout_routes import router as payout_router
from app.api.routes.commission_routes import router as commission_router
from app.api.routes.cart_routes import router as cart_router
from app.api.routes.banner_routes import router as banner_router


api_router = APIRouter()

api_router.include_router(auth_router, tags=["Auth"])
api_router.include_router(user_router, prefix="/users", tags=["Users"])
api_router.include_router(store_router, tags=["Stores"])
api_router.include_router(seller_router, prefix="/sellers", tags=["Sellers"])
api_router.include_router(product_router, prefix="/products", tags=["Products"])
api_router.include_router(order_router, tags=["Orders"])
api_router.include_router(payment_router, tags=["Payments"])
api_router.include_router(delivery_router, tags=["Delivery"])
api_router.include_router(subscription_router, tags=["Subscriptions"])
api_router.include_router(admin_router, tags=["Admin"])
api_router.include_router(search_router, tags=["Search"])
api_router.include_router(category_router, tags=["Categories"])
api_router.include_router(notification_router, tags=["Notifications"])
api_router.include_router(review_router, tags=["Reviews"])
api_router.include_router(wallet_router, tags=["Wallet"])
api_router.include_router(payout_router, tags=["Payouts"])
api_router.include_router(commission_router, tags=["Commissions"])
api_router.include_router(cart_router, tags=["Cart"])
api_router.include_router(banner_router, tags=["Banners"])
