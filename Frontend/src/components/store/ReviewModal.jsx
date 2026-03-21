import { useState } from "react";

import { createReview } from "../../api/review.api";
import { pushToast } from "../../store/toast.store";

export default function ReviewModal({ open, onClose, productId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!productId) return;
    setLoading(true);
    try {
      await createReview({
        product_id: Number(productId),
        rating: Number(rating),
        comment: comment.trim() || null,
      });
      pushToast({ type: "success", message: "Review submitted successfully." });
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      pushToast({
        type: "error",
        message:
          err?.response?.data?.detail ||
          err?.response?.data?.error?.message ||
          "Failed to submit review.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md p-5 text-white">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} / 5
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-white/10 rounded-lg px-3 py-2 min-h-[110px] bg-white/5 text-white"
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 border border-white/10 rounded-lg py-2 hover:bg-white/5"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-300 text-black rounded-lg py-2 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
