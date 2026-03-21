import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ProductCard from "../../components/product/ProductCard";
import { getStoreBestSellers, getStoreProducts } from "../../api/store.api";

export default function Promotions() {
  const { storeId } = useParams();
  const [bestsellers, setBestsellers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getStoreBestSellers(storeId).then((res) => setBestsellers(Array.isArray(res.data) ? res.data : []));
    getStoreProducts(storeId).then((res) => setProducts(Array.isArray(res.data) ? res.data : []));
  }, [storeId]);

  const discounted = products.filter((p) => p.stock > 0).slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl p-4 border border-amber-300/30 bg-amber-300/10">
        <h3 className="font-semibold text-amber-100">Current Offers</h3>
        <p className="text-sm text-amber-100/80 mt-1">
          Free delivery on orders above INR 299. Additional store offers are shown below.
        </p>
      </section>

      <section>
        <h4 className="font-semibold text-white mb-3">Top Picks</h4>
        {bestsellers.length === 0 ? (
          <p className="text-sm text-white/60">No bestsellers available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h4 className="font-semibold text-white mb-3">In-Stock Deals</h4>
        {discounted.length === 0 ? (
          <p className="text-sm text-white/60">No active deals available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {discounted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
