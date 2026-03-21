import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";
import { useParams, Link } from "react-router-dom";
import { getProductImage } from "@/utils/media";

export default function ProductCard({ product }) {
  const { storeId } = useParams();
  const addItem = useCartStore((s) => s.addItem);
  const imageSrc = getProductImage(product, "/product.jpg");
  const productTitle = product?.title || product?.name || "Product";
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(Number(storeId || product.seller_id), {
      ...product,
      image: imageSrc,
    });
  };
  
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 p-3 transition-transform duration-300 hover:-translate-y-1 hover:bg-white/10"
    >
      <div className="relative overflow-hidden rounded-xl bg-black/30">
        <img
          src={imageSrc}
          alt={productTitle}
          className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <h4 className="text-sm font-medium mt-3 line-clamp-2 text-white">{productTitle}</h4>

      <p className="text-amber-300 font-semibold mt-1">₹{product.price}</p>

      <Button
        size="sm"
        className="mt-3 w-full bg-amber-300 text-black hover:bg-amber-200"
        onClick={handleAddToCart}
      >
        Add to cart
      </Button>
    </Link>
  );
}
