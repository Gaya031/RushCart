import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import ProductCard from "./ProductCard";
import { getFeaturedProducts } from "../../api/product.api";

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedProducts()
      .then(res => setProducts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="px-6 text-white/60">Loading products...</p>;
  if (!products.length) return <p className="px-6 text-white/60">No products found</p>;

  return (
    <section className="max-w-7xl mx-auto px-6 mt-16">
      <div className="flex items-end justify-between gap-6 mb-5">
        <div>
          <h3 className="font-display text-2xl text-white">Best Selling Products</h3>
          <p className="text-sm text-white/60 mt-2">Fast-moving picks from high-rated stores.</p>
        </div>
      </div>

      <Swiper
        slidesPerView={1.4}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 4 },
        }}
      >
        {products.map(product => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
