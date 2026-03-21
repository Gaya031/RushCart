import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { getProduct } from "../../api/product.api";
import { getProductReviewSummary, getProductReviews } from "../../api/review.api";
import { getStoreDetails } from "../../api/store.api";
import ReviewModal from "../../components/store/ReviewModal";
import ReviewsList from "../../components/store/ReviewsList";
import StoreReviewsSummary from "../../components/store/StoreReviewsSummary";
import { useCartStore } from "../../store/cart.store";
import { getProductImage } from "../../utils/media";

const Product = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const productImage = getProductImage(product, "/product.jpg");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await getProduct(productId);
        setProduct(res.data);
        
        // Fetch store details
        if (res.data.seller_id) {
          const storeRes = await getStoreDetails(res.data.seller_id);
          setStore(storeRes.data);
        }
        const [reviewsRes, summaryRes] = await Promise.all([
          getProductReviews(productId, { page: 1, size: 20 }),
          getProductReviewSummary(productId),
        ]);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
        setSummary(summaryRes.data || null);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = () => {
    addItem(product.seller_id, {
      id: product.id,
      title: product.title,
      price: product.price,
      image: productImage,
      quantity,
    });
  };

  const refreshReviews = async () => {
    const [reviewsRes, summaryRes] = await Promise.all([
      getProductReviews(productId, { page: 1, size: 20 }),
      getProductReviewSummary(productId),
    ]);
    setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
    setSummary(summaryRes.data || null);
  };

  if (loading) {
    return (
      <div className="min-h-screen rc-shell flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen rc-shell flex items-center justify-center">
        <p className="text-white/60">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Product Image */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            {product.images && product.images.length > 0 ? (
              <img
                src={productImage}
                alt={product.title}
                className="w-full h-96 object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-96 bg-white/5 rounded-xl flex items-center justify-center text-white/50">
                <span>No Image</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="font-display text-3xl text-white mb-2">{product.title}</h1>
            
            {store && (
              <p className="text-sm text-white/60 mb-4">
                Sold by: <span className="font-medium text-white">{store.store_name}</span>
              </p>
            )}
            
            <p className="text-3xl font-bold text-amber-300 mb-4">
              ₹{product.price}
            </p>
            
            {product.stock > 0 ? (
              <p className="text-emerald-300 mb-4">In Stock ({product.stock} available)</p>
            ) : (
              <p className="text-red-300 mb-4">Out of Stock</p>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-white/70">Quantity:</span>
              <div className="flex items-center border border-white/10 rounded-lg bg-white/5">
                <button
                  className="px-3 py-1 hover:bg-white/10 text-white"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="px-3 py-1 text-white">{quantity}</span>
                <button
                  className="px-3 py-1 hover:bg-white/10 text-white"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full bg-amber-300 text-black py-3 rounded-lg font-medium hover:bg-amber-200 disabled:bg-white/20 disabled:text-white/50 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>

            {/* Product Description */}
            {product.description && (
              <div className="mt-6">
                <h3 className="font-semibold text-white mb-2">Description</h3>
                <p className="text-white/60">{product.description}</p>
              </div>
            )}

            {/* Category */}
            {product.category && (
              <div className="mt-4">
                <span className="text-sm text-white/50">Category: {product.category}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="mt-6 w-full border border-white/20 text-white/80 rounded-lg py-2 hover:bg-white/10"
            >
              Write a Review
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <StoreReviewsSummary summary={summary} title="Product Ratings" />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold mb-3 text-white">Customer Reviews</h3>
            <ReviewsList reviews={reviews} />
          </div>
        </div>
      </div>

      <ReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        productId={product?.id}
        onSubmitted={refreshReviews}
      />

      <Footer />
    </div>
  );
};

export default Product;
