import { Badge } from '@/components/ui/badge';
import React from 'react'
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '@/utils/media';

const StoreCard = ({ store }) => {
  const storeName = store?.store_name || store?.name || "Store";
  const storeImage = resolveMediaUrl(store?.logo_url || store?.image, "/store.jpg");
  const eta = store?.delivery_time_minutes ?? store?.eta_mins;
  const distance = store?.distance_km;

  return (
    <Link
      to={`/store/${store?.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 p-4 transition-transform duration-300 hover:-translate-y-1 hover:bg-white/10"
    >
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={storeImage}
          className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          alt={storeName}
        />
        {store?.is_open && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-black">
            Open Now
          </span>
        )}
      </div>
      <h4 className="mt-3 text-lg font-semibold text-white">{storeName}</h4>
      <p className="text-sm text-white/60">
        {typeof distance === "number" ? `${distance} km` : "Nearby"} • {eta ? `${eta} mins` : "Fast delivery"}
      </p>
      {store?.average_rating > 0 && (
        <p className="text-xs text-white/50 mt-2">
          {Number(store.average_rating).toFixed(1)} rating • {store.total_reviews || 0} reviews
        </p>
      )}
    </Link>
  );
}

export default StoreCard
