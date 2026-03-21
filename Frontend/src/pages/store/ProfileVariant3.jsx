import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStoreDetails } from "../../api/store.api";

export default function ProfileVariant3() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  useEffect(() => {
    getStoreDetails(storeId).then((res) => setStore(res.data));
  }, [storeId]);
  if (!store) return <p className="p-6 text-white/60">Loading...</p>;
  return (
    <div className="p-6 border-2 border-dashed border-white/20 rounded-2xl bg-white/5">
      <h2 className="text-xl font-semibold text-white">{store.store_name}</h2>
      <p className="italic text-white/70">{store.description}</p>
      <p className="mt-3 text-sm text-white/60">Delivery radius: {store.delivery_radius_km} km</p>
    </div>
  );
}
