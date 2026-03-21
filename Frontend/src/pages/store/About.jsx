import { useOutletContext } from "react-router-dom";

export default function About() {
  const { store } = useOutletContext();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
      <h3 className="text-lg font-semibold text-white">About {store.store_name}</h3>
      <p className="text-white/70">{store.description || "No description provided by the store."}</p>
      <div className="text-sm text-white/60 space-y-1">
        <p>
          <span className="font-medium text-white">Address:</span> {store.address || "Not provided"}
        </p>
        <p>
          <span className="font-medium text-white">City:</span> {store.city || "Not provided"}
        </p>
        <p>
          <span className="font-medium text-white">Pincode:</span> {store.pincode || "Not provided"}
        </p>
        <p>
          <span className="font-medium text-white">Delivery Radius:</span> {store.delivery_radius_km || 0} km
        </p>
        <p>
          <span className="font-medium text-white">Rating:</span> {store.average_rating || 0} ({store.total_reviews || 0} reviews)
        </p>
      </div>
    </div>
  );
}
