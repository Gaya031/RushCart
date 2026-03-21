import { useEffect, useState } from "react";

import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";
import { getSellerProfile, updateMySellerKYC, uploadSellerKycDocument } from "../../api/seller.api";

const DOC_FIELDS = [
  { key: "aadhar", label: "Aadhar" },
  { key: "pan", label: "PAN" },
  { key: "gst", label: "GST" },
  { key: "business_proof", label: "Business Proof" },
];

export default function SellerKYCUpload() {
  const [hasProfile, setHasProfile] = useState(false);
  const [docs, setDocs] = useState({ aadhar: "", pan: "", gst: "", business_proof: "" });
  const [files, setFiles] = useState({ aadhar: null, pan: null, gst: null, business_proof: null });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSellerProfile()
      .then((res) => {
        setHasProfile(true);
        const docs = res.data?.kyc_docs || {};
        setDocs({
          aadhar: docs.aadhar || "",
          pan: docs.pan || "",
          gst: docs.gst || "",
          business_proof: docs.business_proof || "",
        });
      })
      .catch(() => setHasProfile(false))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const nextDocs = { ...docs };

      for (const field of DOC_FIELDS) {
        const file = files[field.key];
        if (!file) continue;
        const uploadRes = await uploadSellerKycDocument(file, field.key);
        nextDocs[field.key] = uploadRes?.data?.url || nextDocs[field.key] || "";
      }

      await updateMySellerKYC(nextDocs);
      setDocs(nextDocs);
      setFiles({ aadhar: null, pan: null, gst: null, business_proof: null });
      setMessage("KYC documents uploaded successfully.");
    } catch (err) {
      setMessage(err?.response?.data?.detail || "KYC upload failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleDashboardLayout role="seller" title="Seller KYC Upload">
      <div className="max-w-xl">
        {loading ? (
          <p className="text-white/60">Loading...</p>
        ) : !hasProfile ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/70">Create your seller profile first from onboarding page.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            {DOC_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2 border border-white/10 rounded-lg p-3">
                <label className="block text-sm font-medium text-white">{field.label}</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white"
                  onChange={(e) =>
                    setFiles((prev) => ({ ...prev, [field.key]: e.target.files?.[0] || null }))
                  }
                />
                {files[field.key] && (
                  <p className="text-xs text-white/60">Selected: {files[field.key].name}</p>
                )}
                {docs[field.key] && (
                  <a
                    href={docs[field.key]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-200 hover:underline"
                  >
                    View current {field.label} document
                  </a>
                )}
              </div>
            ))}
            <button disabled={saving} className="w-full bg-emerald-300 text-black py-2 rounded disabled:opacity-70">
              {saving ? "Uploading..." : "Upload KYC Documents"}
            </button>
            {message && <p className="text-sm text-white/70">{message}</p>}
          </form>
        )}
      </div>
    </RoleDashboardLayout>
  );
}
