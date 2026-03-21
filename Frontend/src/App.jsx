import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useAuthStore } from "./store/auth.store";
import { getRoleHomePath } from "./utils/rolePaths";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import ToastViewport from "./components/ui/ToastViewport";

const Login = lazy(() => import("./pages/auth/Login"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetConfirmation = lazy(() => import("./pages/auth/ResetConfirmation"));
const Home = lazy(() => import("./pages/buyer/Home"));
const Register = lazy(() => import("./pages/auth/Register"));
const StoreLayout = lazy(() => import("./pages/store/StoreLayout"));
const Products = lazy(() => import("./pages/store/Products"));
const Review = lazy(() => import("./pages/store/Review"));
const Promotions = lazy(() => import("./pages/store/Promotions"));
const About = lazy(() => import("./pages/store/About"));
const Product = lazy(() => import("./pages/buyer/Product"));
const ProductListing = lazy(() => import("./pages/buyer/ProductListing"));
const CategoryPage = lazy(() => import("./pages/buyer/CategoryPage"));
const OrderTracking = lazy(() => import("./pages/buyer/OrderTracking"));
const SubmitReview = lazy(() => import("./pages/buyer/SubmitReview"));
const ProfileVariant1 = lazy(() => import("./pages/store/ProfileVariant1"));
const ProfileVariant2 = lazy(() => import("./pages/store/ProfileVariant2"));
const ProfileVariant3 = lazy(() => import("./pages/store/ProfileVariant3"));
const CartPage = lazy(() => import("./pages/cart/CartPage"));
const CheckoutPage = lazy(() => import("./pages/checkout/CheckoutPage"));
const OrderSuccess = lazy(() => import("./pages/order/OrderSuccess"));
const OrderDetail = lazy(() => import("./pages/order/OrderDetail"));
const BuyerOrders = lazy(() => import("./pages/buyer/Orders"));
const BuyerWallet = lazy(() => import("./pages/buyer/Wallet"));
const BuyerDashboard = lazy(() => import("./pages/buyer/Dashboard"));
const SellerDashboard = lazy(() => import("./pages/seller/Dashboard"));
const SellerProducts = lazy(() => import("./pages/seller/Products"));
const SellerOrders = lazy(() => import("./pages/seller/Orders"));
const SellerOnboarding = lazy(() => import("./pages/seller/Onboarding"));
const SellerKYCUpload = lazy(() => import("./pages/seller/KYCUpload"));
const SellerApprovalStatus = lazy(() => import("./pages/seller/ApprovalStatus"));
const SellerEarnings = lazy(() => import("./pages/seller/Earnings"));
const SellerCommission = lazy(() => import("./pages/seller/Commission"));
const SellerSubscriptionStatus = lazy(() => import("./pages/seller/SubscriptionStatus"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminSellers = lazy(() => import("./pages/admin/Sellers"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminPayouts = lazy(() => import("./pages/admin/Payouts"));
const AdminUserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AdminReturnApproval = lazy(() => import("./pages/admin/ReturnApproval"));
const AdminRefundControl = lazy(() => import("./pages/admin/RefundControl"));
const AdminCommissionConfig = lazy(() => import("./pages/admin/CommissionConfig"));
const AdminSubscriptions = lazy(() => import("./pages/admin/Subscriptions"));
const AdminRevenueAnalytics = lazy(() => import("./pages/admin/RevenueAnalytics"));
const AdminReportsExports = lazy(() => import("./pages/admin/ReportsExports"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const DeliveryDeliveries = lazy(() => import("./pages/delivery/Deliveries"));
const AvailableDeliveries = lazy(() => import("./pages/delivery/AvailableDeliveries"));
const AssignedDelivery = lazy(() => import("./pages/delivery/AssignedDelivery"));
const NavigationMap = lazy(() => import("./pages/delivery/NavigationMap"));
const PickupConfirmation = lazy(() => import("./pages/delivery/PickupConfirmation"));
const DeliveryConfirmationPage = lazy(() => import("./pages/delivery/DeliveryConfirmation"));
const DeliveryEarningsSummary = lazy(() => import("./pages/delivery/EarningsSummary"));

function App() {
  useAuth();

  return (
    <BrowserRouter>
      <ToastViewport />
      <Suspense fallback={<AppRouteFallback />}>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-confirmation" element={<ResetConfirmation />} />
        <Route path="/" element={<RoleAwareHome />} />

        {/* Product Detail */}
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/products" element={<ProductListing />} />
        <Route path="/category/:slug" element={<CategoryPage />} />

        {/* Store Routes */}
        <Route path="/store/:storeId" element={<StoreLayout />}>
          <Route index element={<Products />} />
          <Route path="reviews" element={<Review />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="about" element={<About />} />
          <Route path="profile-variant-1" element={<ProfileVariant1 />} />
          <Route path="profile-variant-2" element={<ProfileVariant2 />} />
          <Route path="profile-variant-3" element={<ProfileVariant3 />} />
        </Route>

        {/* Cart & Checkout - Protected */}
        <Route
          path="/cart"
          element={<CartPage />}
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/success"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />

        {/* Buyer Routes */}
        <Route
          path="/buyer"
          element={
            <ProtectedRoute>
              <RoleRoute role="buyer">
                <BuyerDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/orders"
          element={
            <ProtectedRoute>
              <BuyerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/wallet"
          element={
            <ProtectedRoute>
              <BuyerWallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/order/:orderId/tracking"
          element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/review"
          element={
            <ProtectedRoute>
              <SubmitReview />
            </ProtectedRoute>
          }
        />

        {/* Seller Routes */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerProducts />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerOrders />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/onboarding"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerOnboarding />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/kyc"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerKYCUpload />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/approval-status"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerApprovalStatus />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/earnings"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerEarnings />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/commission"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerCommission />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/subscription"
          element={
            <ProtectedRoute>
              <RoleRoute role="seller">
                <SellerSubscriptionStatus />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sellers"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminSellers />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminOrders />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payouts"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminPayouts />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminUserManagement />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/returns"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminReturnApproval />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/refunds"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminRefundControl />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/commission-config"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminCommissionConfig />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminSubscriptions />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/revenue-analytics"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminRevenueAnalytics />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminReportsExports />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/banners"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminBanners />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Delivery Partner Routes */}
        <Route
          path="/delivery"
          element={
            <ProtectedRoute>
              <RoleRoute role="delivery">
                <DeliveryDeliveries />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/available"
          element={
            <ProtectedRoute>
              <RoleRoute role="delivery">
                <AvailableDeliveries />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/assigned"
          element={
            <ProtectedRoute>
              <RoleRoute role="delivery">
                <AssignedDelivery />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/map"
          element={
            <ProtectedRoute>
              <RoleRoute role="delivery">
                <NavigationMap />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/:deliveryId/pickup"
          element={
            <ProtectedRoute>
              <RoleRoute role="delivery">
                <PickupConfirmation />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/:deliveryId/confirm"
          element={
            <ProtectedRoute>
              <RoleRoute role="delivery">
                <DeliveryConfirmationPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/earnings"
          element={
            <ProtectedRoute>
              <RoleRoute role="delivery">
                <DeliveryEarningsSummary />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function AppRouteFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
      Loading page...
    </div>
  );
}

function RoleAwareHome() {
  const user = useAuthStore((s) => s.user);

  if (!user || user.role === "buyer") {
    return <Home />;
  }

  return <Navigate to={getRoleHomePath(user.role)} replace />;
}

export default App;
