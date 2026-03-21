import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStoreDetails } from "../../api/store.api";

export default function ProfileVariant2() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  useEffect(() => {
    getStoreDetails(storeId).then((res) => setStore(res.data));
  }, [storeId]);
  if (!store) return <p className="p-6 text-white/60">Loading...</p>;
  return (
    <div className="p-6 rounded-2xl border border-amber-300/30 bg-amber-300/10">
      <h2 className="text-2xl font-black text-white">{store.store_name}</h2>
      <p className="mt-3 text-white/70">{store.description}</p>
      <div className="mt-4 text-sm text-white/70">Rating: {store.average_rating} / Reviews: {store.total_reviews}</div>
    </div>
  );
}
