import { useState, useEffect, useCallback } from "react";
import { MapPin } from "lucide-react";
import { useLocationStore } from "../../store/location.store";
import { pushToast } from "../../store/toast.store";

export default function LocationSelector({ variant = "light" }) {
  const {
    location,
    address,
    city,
    state,
    pincode,
    latitude,
    longitude,
    fetchLocation,
  } = useLocationStore();
  const [showModal, setShowModal] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const isDark = variant === "dark";
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const openModal = useCallback(() => {
    setFormData({
      address: address || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",
      // latitude: latitude || (location?.lat ? String(location.lat) : ""),
      // longitude: longitude || (location?.lng ? String(location.lng) : ""),
    });
    setShowModal(true);
  }, [address, city, state, pincode, latitude, longitude, location]);

  useEffect(() => {
    const openSelector = () => openModal();
    window.addEventListener("openLocationSelector", openSelector);
    return () =>
      window.removeEventListener("openLocationSelector", openSelector);
  }, [openModal]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data?.address || {};
      return {
        address: data?.display_name || "",
        city: addr.city || addr.town || addr.village || "",
        state: addr.state || "",
        pincode: addr.postcode || "",
      };
    } catch {
      return null;
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!("geolocation" in navigator)) {
      pushToast({
        type: "error",
        message: "Geolocation is not supported in this browser.",
      });
      return;
    }

    setDetecting(true);
    const fallbackTimer = setTimeout(() => {
      setDetecting(false);
    }, 12000);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(fallbackTimer);
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const resolved = await reverseGeocode(lat, lng);
        setFormData((prev) => ({
          ...prev,
          address: resolved?.address || prev.address || "Current Location",
          city: resolved?.city || prev.city,
          state: resolved?.state || prev.state,
          pincode: resolved?.pincode || prev.pincode,
          latitude: lat,
          longitude: lng,
        }));
        setDetecting(false);
        pushToast({ type: "success", message: "Live location captured." });
      },
      (error) => {
        clearTimeout(fallbackTimer);
        setDetecting(false);
        let message = "Unable to fetch live location.";
        if (error.code === 1)
          message = "Location permission denied. Please allow location access.";
        if (error.code === 2) message = "Location is unavailable right now.";
        if (error.code === 3) message = "Location request timed out.";
        pushToast({ type: "error", message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { saveLocation } = useLocationStore.getState();
    const ok = await saveLocation(formData);
    if (!ok) {
      pushToast({ type: "error", message: "Failed to save location." });
      return;
    }
    pushToast({ type: "success", message: "Location updated successfully." });
    setShowModal(false);
  };

  const displayLocation =
    address || city
      ? `${address || ""} ${city ? `, ${city}` : ""}`.trim()
      : location?.label || "Select Location";

  return (
    <>
      <div
        className={`text-sm cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          isDark
            ? "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            : "border-gray-200 bg-white text-gray-700 hover:text-gray-900"
        }`}
        onClick={openModal}
      >
        <MapPin className="w-4 h-4" />
        <span className="hidden md:inline max-w-[180px] truncate">
          Delivering to <b>{displayLocation}</b>
        </span>
        <span className="md:hidden max-w-[120px] truncate">
          <b>{city || "Location"}</b>
        </span>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`relative mt-100 rounded-2xl p-6 w-full overflow-y-auto pointer-events-auto ${
              isDark
                ? "bg-[#121212] text-white border border-white/10"
                : "bg-white"
            }`}
            style={{ maxWidth: "60vw" }}
          >
            <h2 className="text-xl font-bold mb-4">Update Delivery Location</h2>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={detecting}
              className={`w-full mb-4 px-4 py-2 rounded-lg disabled:opacity-60 ${
                isDark
                  ? "border border-amber-300/60 text-amber-200 hover:bg-amber-300/10"
                  : "border border-green-600 text-green-700 hover:bg-green-50"
              }`}
            >
              {detecting ? "Detecting live location..." : "Use Live Location"}
            </button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? "text-white/70" : ""}`}
                >
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg ${isDark ? "bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-amber-300/40" : "border"}`}
                  placeholder="Enter your address"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDark ? "text-white/70" : ""}`}
                  >
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg ${isDark ? "bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-amber-300/40" : "border"}`}
                    required
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDark ? "text-white/70" : ""}`}
                  >
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg ${isDark ? "bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-amber-300/40" : "border"}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${isDark ? "text-white/70" : ""}`}
                  >
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                    className={`w-full px-3 py-2 rounded-lg ${isDark ? "bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-amber-300/40" : "border"}`}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg ${isDark ? "border border-white/10 hover:bg-white/5" : "border hover:bg-gray-50"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded-lg ${isDark ? "bg-amber-300 text-black hover:bg-amber-200" : "bg-green-600 text-white hover:bg-green-700"}`}
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
