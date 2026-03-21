import React, { useEffect, useMemo, useState } from "react";
import { useLocationStore } from "../../store/location.store";
import { MapPin } from "lucide-react";
import { pushToast } from "../../store/toast.store";

const AddressSection = ({ onAddressSelect }) => {
  const { address, city, state, pincode, latitude, longitude, fetchLocation, saveLocation } = useLocationStore();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });

  // Single saved address from user profile
  const savedAddress = useMemo(() => (
    address
      ? {
          id: 1,
          label: "Home",
          name: "Customer",
          address: address,
          city: city,
          state: state,
          pincode: pincode,
          latitude: latitude,
          longitude: longitude,
          default: true,
        }
      : null
  ), [address, city, state, pincode, latitude, longitude]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (savedAddress) {
      onAddressSelect?.(savedAddress);
    }
  }, [savedAddress, onAddressSelect]);

  const openEditor = () => {
    setFormData({
      address: address || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",
      latitude: latitude || "",
      longitude: longitude || "",
    });
    setShowModal(true);
  };

  const submitLocation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await saveLocation(formData);
      if (!ok) {
        pushToast({ type: "error", message: "Failed to update address." });
        return;
      }
      await fetchLocation({ force: true });
      pushToast({ type: "success", message: "Address updated." });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-white">1. Shipping Address</h2>
        <button
          onClick={openEditor}
          className="text-amber-200 text-sm flex items-center gap-1"
        >
          <MapPin className="w-4 h-4" />
          Change Address
        </button>
      </div>

      {savedAddress ? (
        <div 
          onClick={() => onAddressSelect?.(savedAddress)}
          className={`border rounded-xl p-4 cursor-pointer ${
            savedAddress
              ? "border-amber-300/50 bg-amber-300/10"
              : "border-white/10"
          }`}
        >
          <div className="flex justify-between">
            <p className="font-medium text-white">{savedAddress.label}</p>
            {savedAddress.default && (
              <span className="text-xs bg-amber-300 text-black px-2 py-1 rounded">
                Default
              </span>
            )}
          </div>
          <p className="text-sm mt-1 text-white/70">{savedAddress.name}</p>
          <p className="text-sm text-white/70">{savedAddress.address}</p>
          <p className="text-sm text-white/70">
            {savedAddress.city}
            {savedAddress.state && `, ${savedAddress.state}`}
            {savedAddress.pincode && ` - ${savedAddress.pincode}`}
          </p>
          {savedAddress.latitude && savedAddress.longitude && (
            <div className="mt-2 text-xs text-white/50 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {savedAddress.latitude}, {savedAddress.longitude}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-white/20" />
          <p>No address saved</p>
          <p className="text-sm">Please add your delivery address</p>
          <button
            onClick={openEditor}
            className="mt-2 text-amber-200 text-sm"
          >
            Add Address
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md p-5 text-white">
            <h3 className="text-lg font-semibold mb-4">Update Address</h3>
            <form onSubmit={submitLocation} className="space-y-3">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
                placeholder="Address"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
                  placeholder="City"
                  required
                />
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
                  placeholder="State"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                  className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
                  placeholder="Pincode"
                />
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                  className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
                  placeholder="Latitude"
                />
              </div>
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))}
                className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
                placeholder="Longitude"
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-white/10 rounded-lg py-2 hover:bg-white/5"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-300 text-black rounded-lg py-2 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSection;
