import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import PromoSlide from "./PromoSlide";
import { getBanners } from "../../api/banner.api";

const defaultBanners = [
  {
    id: "default-1",
    title: "Fresh Groceries in 20 mins",
    subtitle: "Daily essentials from nearby stores",
    image_url: "/hero.png",
    cta_primary_label: "Shop Now",
    cta_primary_link: "/products",
    cta_secondary_label: "View Offers",
    cta_secondary_link: "/products?offers=1",
  },
];

export default function HeroSection() {
  const [banners, setBanners] = useState(defaultBanners);

  useEffect(() => {
    getBanners()
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (rows.length) {
          setBanners(rows);
        }
      })
      .catch(() => {
        // keep default fallback banner
      });
  }, []);

  return (
    <section className="relative w-full">
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 4800, disableOnInteraction: false }}
        loop={banners.length > 1}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <PromoSlide banner={banner} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
