import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStoreDetails } from "../../api/store.api";

export default function ProfileVariant1() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  useEffect(() => {
    getStoreDetails(storeId).then((res) => setStore(res.data));
  }, [storeId]);
  if (!store) return <p className="p-6 text-white/60">Loading...</p>;
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
      <h2 className="text-xl font-bold text-white">{store.store_name}</h2>
      <p className="text-white/70">{store.description}</p>
      <p className="mt-2 text-sm text-white/60">City: {store.city}</p>
    </div>
  );
}
