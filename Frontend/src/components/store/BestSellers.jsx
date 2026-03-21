import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { getStoreBestSellers } from "../../api/store.api";
import ProductCard from "../product/ProductCard";

const BestSellers = () => {
  const {storeId} = useParams();
  const [products, setProducts] = useState([]);
  useEffect(() => {
    getStoreBestSellers(storeId).then(res => setProducts(res.data));
  }, [storeId]);

  if(!products.length) return null;

  return (
    <section className='mb-10'>
      <h3 className='font-display text-2xl text-white mb-4'>Best Sellers</h3>

      <Swiper
        slidesPerView={1.4}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 4 },
        }}
      >
        {products.map(p => (
          <SwiperSlide key={p.id}>
            <ProductCard product={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default BestSellers
