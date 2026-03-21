import { useEffect, useState } from "react";

import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import {
  createSellerProfile,
  getSellerProfile,
  updateSellerProfile,
  uploadSellerImage,
} from "../../api/seller.api";

const initialForm = {
  store_name: "",
  description: "",
  address: "",
  city: "",
  pincode: "",
  latitude: "",
  longitude: "",
  logo_url: "",
  cover_image: "",
  delivery_radius_km: "5",
};

export default function SellerOnboarding() {
  const [form, setForm] = useState(initialForm);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [autoLocationAttempted, setAutoLocationAttempted] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    getSellerProfile()
      .then((res) => {
        const p = res.data;
        setHasProfile(true);
        setForm({
          store_name: p.store_name || "",
          description: p.description || "",
          address: p.address || "",
          city: p.city || "",
          pincode: p.pincode || "",
          latitude: p.latitude || "",
          longitude: p.longitude || "",
          logo_url: p.logo_url || "",
          cover_image: p.cover_image || "",
          delivery_radius_km: String(p.delivery_radius_km || 5),
        });
      })
      .catch(() => {
        setHasProfile(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data?.address || {};
      return {
        address: data?.display_name || "",
        city: addr.city || addr.town || addr.village || "",
        pincode: addr.postcode || "",
      };
    } catch {
      return null;
    }
  };

  const applyLiveLocation = async ({ silent = false } = {}) => {
    if (!("geolocation" in navigator)) {
      if (!silent) setMessage("Geolocation is not supported in this browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const resolved = await reverseGeocode(lat, lng);
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: prev.address || resolved?.address || "",
          city: prev.city || resolved?.city || "",
          pincode: prev.pincode || resolved?.pincode || "",
        }));
        setDetectingLocation(false);
        if (!silent) setMessage("Live location fetched.");
      },
      (error) => {
        setDetectingLocation(false);
        if (silent) return;
        if (error.code === 1) setMessage("Location permission denied.");
        else if (error.code === 3) setMessage("Location request timed out.");
        else setMessage("Unable to fetch live location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (loading || autoLocationAttempted) return;
    setAutoLocationAttempted(true);
    if (!form.latitude || !form.longitude) {
      void applyLiveLocation({ silent: true });
    }
  }, [loading, autoLocationAttempted, form.latitude, form.longitude]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview("");
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setUploadingImages(true);
    try {
      let logoUrl = form.logo_url || "";
      let coverUrl = form.cover_image || "";

      if (logoFile) {
        const logoRes = await uploadSellerImage(logoFile, "logo");
        logoUrl = logoRes?.data?.url || logoRes?.data?.path || logoUrl;
      }
      if (coverFile) {
        const coverRes = await uploadSellerImage(coverFile, "cover");
        coverUrl = coverRes?.data?.url || coverRes?.data?.path || coverUrl;
      }

      const payload = {
        ...form,
        logo_url: logoUrl || undefined,
        cover_image: coverUrl || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        delivery_radius_km: Number(form.delivery_radius_km || 5),
      };
      if (hasProfile) {
        await updateSellerProfile(payload);
        setMessage("Seller profile updated.");
      } else {
        await createSellerProfile(payload);
        setMessage("Seller onboarding submitted.");
        setHasProfile(true);
      }
      setForm((prev) => ({ ...prev, logo_url: logoUrl, cover_image: coverUrl }));
      setLogoFile(null);
      setCoverFile(null);
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Failed to save seller profile");
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <RoleDashboardLayout role="seller" title="Seller Onboarding">
      <div className="max-w-2xl">
        {loading ? (
          <p className="text-white/60">Loading...</p>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                placeholder="Store name"
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                required
              />
              <input
                className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <textarea
              className="w-full border border-white/10 rounded px-3 py-2 min-h-[90px] bg-white/5 text-white"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => applyLiveLocation({ silent: false })}
                disabled={detectingLocation}
                className="text-sm px-3 py-1.5 rounded border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-60"
              >
                {detectingLocation ? "Detecting location..." : "Use Live Location"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                placeholder="Pincode"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
              <input
                className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
              <input
                className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Store Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                />
                {(logoPreview || form.logo_url) && (
                  <img
                    src={logoPreview || form.logo_url}
                    alt="Logo preview"
                    className="mt-2 w-16 h-16 object-cover rounded border border-white/10"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                />
                {(coverPreview || form.cover_image) && (
                  <img
                    src={coverPreview || form.cover_image}
                    alt="Cover preview"
                    className="mt-2 w-full h-16 object-cover rounded border border-white/10"
                  />
                )}
              </div>
              <input
                type="number"
                min={1}
                max={50}
                className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                placeholder="Delivery radius (km)"
                value={form.delivery_radius_km}
                onChange={(e) => setForm({ ...form, delivery_radius_km: e.target.value })}
              />
            </div>
            <button disabled={uploadingImages} className="w-full bg-emerald-300 text-black py-2 rounded disabled:opacity-70">
              {uploadingImages ? "Uploading images..." : hasProfile ? "Update Seller Profile" : "Submit Onboarding"}
            </button>
            {message && <p className="text-sm text-white/70">{message}</p>}
          </form>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
