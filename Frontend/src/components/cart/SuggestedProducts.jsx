import React from 'react'
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import ProductCard from "../product/ProductCard";

const mockProducts = [
  {
    id: 101,
    title: "Fresh Coriander",
    price: 15,
    image: "/images/coriander.jpg",
  },
  {
    id: 102,
    title: "Green Chillies",
    price: 10,
    image: "/images/chillies.jpg",
  },
  {
    id: 103,
    title: "Ginger",
    price: 25,
    image: "/images/ginger.jpg",
  },
];

const SuggestedProducts = () => {
  return (
    <div className="mt-12">
      <h3 className="font-display text-2xl text-white mb-4">Suggested for you</h3>

      <Swiper
        slidesPerView={1.4}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 4 },
        }}
      >
        {mockProducts.map(p => (
          <SwiperSlide key={p.id}>
            <ProductCard product={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default SuggestedProducts
