import { getNearbyStores } from '@/api/store.api';
import { useLocationStore } from '@/store/location.store'
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import StoreCard from './StoreCard';
import "swiper/css";

const NearbyStores = () => {
  const { lat, lng } = useLocationStore(s => s.location);
  const hasCoordinates = typeof lat === "number" && typeof lng === "number";
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(hasCoordinates);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasCoordinates) {
      return;
    }
    let alive = true;
    const loadStores = async () => {
      setLoading(true);
      try {
        const res = await getNearbyStores({ lat, lng });
        if (!alive) return;
        const rows = Array.isArray(res?.data) ? res.data : [];
        setStores(rows);
        setError("");
      } catch (err) {
        if (!alive) return;
        console.error(err);
        setError(err?.response?.data?.detail || "Failed to load nearby stores.");
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };
    loadStores();
    return () => {
      alive = false;
    };
  }, [hasCoordinates, lat, lng]);

  if (!hasCoordinates) return <p className='px-6 text-white/60'>Enable location to view nearby stores.</p>;
  if (loading) return <p className='px-6 text-white/60'>Loading stores...</p>;
  if (error) return <p className='px-6 text-sm text-red-300'>{error}</p>;
  if (!stores.length) return <p className='px-6 text-white/60'>No stores nearby</p>;
  return (
    <section className='max-w-7xl mx-auto px-6 mt-16'>
      <div className="flex items-end justify-between gap-6 mb-5">
        <div>
          <h3 className='font-display text-2xl text-white'>Stores Near You</h3>
          <p className="text-sm text-white/60 mt-2">Open now, fast handoff, trusted ratings.</p>
        </div>
      </div>
      <Swiper
        slidesPerView={1.2}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 2.1 },
          1024: { slidesPerView: 3 },
        }}
      >
        {stores.map(store => (
          <SwiperSlide key={store.id}>
            <StoreCard store={store} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default NearbyStores;
