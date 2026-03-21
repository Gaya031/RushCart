import { useEffect, useMemo, useState } from "react";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import {
  createBanner,
  deleteBanner,
  getAdminBanners,
  updateBanner,
  uploadBannerImage,
} from "../../api/banner.api";

const initialForm = {
  title: "",
  subtitle: "",
  image_url: "",
  cta_primary_label: "Shop Now",
  cta_primary_link: "/products",
  cta_secondary_label: "View Offers",
  cta_secondary_link: "/products?offers=1",
  display_order: 0,
  is_active: true,
};

export default function AdminBanners() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          Number(a.display_order || 0) - Number(b.display_order || 0) || Number(a.id || 0) - Number(b.id || 0)
      ),
    [rows]
  );

  const fetchRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminBanners();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadBannerImage(file);
      setForm((prev) => ({ ...prev, image_url: res?.data?.url || "" }));
    } catch (err) {
      setError(err?.response?.data?.detail || "Banner upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url.trim()) {
      setError("Title and image are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createBanner({
        ...form,
        display_order: Number(form.display_order || 0),
        is_active: Boolean(form.is_active),
      });
      setForm(initialForm);
      await fetchRows();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to create banner.");
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (banner) => {
    try {
      await updateBanner(banner.id, { is_active: !banner.is_active });
      await fetchRows();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to update banner.");
    }
  };

  const onShiftOrder = async (banner, delta) => {
    try {
      const nextOrder = Number(banner.display_order || 0) + delta;
      await updateBanner(banner.id, { display_order: nextOrder });
      await fetchRows();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to reorder banner.");
    }
  };

  const onDelete = async (bannerId) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await deleteBanner(bannerId);
      await fetchRows();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to delete banner.");
    }
  };

  return (
    <RoleDashboardLayout role="admin" title="Homepage Banners">
      <div className="space-y-6">
        <form onSubmit={onCreate} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="font-semibold text-lg text-white">Add Banner</h2>
          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
              placeholder="Title"
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              required
            />
            <input
              className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
              placeholder="Subtitle"
              value={form.subtitle}
              onChange={(e) => onChange("subtitle", e.target.value)}
            />
            <input
              className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
              placeholder="Primary CTA label"
              value={form.cta_primary_label}
              onChange={(e) => onChange("cta_primary_label", e.target.value)}
            />
            <input
              className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
              placeholder="Primary CTA link"
              value={form.cta_primary_link}
              onChange={(e) => onChange("cta_primary_link", e.target.value)}
            />
            <input
              className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
              placeholder="Secondary CTA label"
              value={form.cta_secondary_label}
              onChange={(e) => onChange("cta_secondary_label", e.target.value)}
            />
            <input
              className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
              placeholder="Secondary CTA link"
              value={form.cta_secondary_link}
              onChange={(e) => onChange("cta_secondary_link", e.target.value)}
            />
            <input
              className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
              type="number"
              placeholder="Display order"
              value={form.display_order}
              onChange={(e) => onChange("display_order", e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(e) => onChange("is_active", e.target.checked)}
              />
              Active banner
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-3 items-start">
            <div className="space-y-2">
              <input
                className="border border-white/10 rounded-lg px-3 py-2 w-full bg-white/5 text-white"
                placeholder="Image URL"
                value={form.image_url}
                onChange={(e) => onChange("image_url", e.target.value)}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUpload(e.target.files?.[0])}
                disabled={uploading}
              />
              <p className="text-xs text-white/50">
                {uploading ? "Uploading..." : "Upload image from your device or paste URL manually."}
              </p>
            </div>
            <div className="border border-white/10 rounded-lg p-2 min-h-[130px] bg-white/5">
              {form.image_url ? (
                <img src={form.image_url} alt="Banner preview" className="w-full h-28 object-cover rounded" />
              ) : (
                <p className="text-sm text-white/50">Image preview appears here.</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-violet-300 text-black px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create Banner"}
          </button>
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold text-lg mb-4 text-white">Existing Banners</h2>
          {loading && <p className="text-sm text-white/60">Loading banners...</p>}
          {!loading && !sortedRows.length && <p className="text-sm text-white/60">No banners found.</p>}
          <div className="space-y-4">
            {sortedRows.map((banner) => (
              <div key={banner.id} className="border border-white/10 rounded-lg p-3 grid md:grid-cols-4 gap-3 items-center">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-20 object-cover rounded"
                />
                <div className="md:col-span-2">
                  <p className="font-medium text-white">{banner.title}</p>
                  <p className="text-sm text-white/60">{banner.subtitle}</p>
                  <p className="text-xs text-white/40 mt-1">
                    order: {banner.display_order} | {banner.is_active ? "active" : "inactive"}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-start md:justify-end">
                  <button
                    className="px-3 py-1 rounded border border-white/10 text-sm text-white/70 hover:bg-white/5"
                    onClick={() => onShiftOrder(banner, -1)}
                  >
                    Up
                  </button>
                  <button
                    className="px-3 py-1 rounded border border-white/10 text-sm text-white/70 hover:bg-white/5"
                    onClick={() => onShiftOrder(banner, 1)}
                  >
                    Down
                  </button>
                  <button
                    className="px-3 py-1 rounded border border-white/10 text-sm text-white/70 hover:bg-white/5"
                    onClick={() => onToggleActive(banner)}
                  >
                    {banner.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-red-500/20 text-red-200 text-sm"
                    onClick={() => onDelete(banner.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleDashboardLayout>
  );
}
