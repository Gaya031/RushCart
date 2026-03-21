import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import { createReview } from "../../api/review.api";

export default function SubmitReview() {
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createReview({ product_id: Number(productId), rating: Number(rating), comment });
      setMessage("Review submitted");
      setTimeout(() => navigate("/"), 700);
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
          err?.response?.data?.error?.message ||
          "Failed to submit review"
      );
    }
  };

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-white mb-4">Submit Review</h1>
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <input
            type="number"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
            placeholder="Product ID"
            required
          />
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-white"
            placeholder="Rating 1-5"
            required
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-white/10 rounded-lg px-3 py-2 min-h-[110px] bg-white/5 text-white"
            placeholder="Comment"
          />
          <button className="w-full bg-amber-300 text-black py-2 rounded-lg hover:bg-amber-200">Submit</button>
          {message && <p className="text-sm text-white/70">{message}</p>}
        </form>
      </div>
      <Footer />
    </div>
  );
}
