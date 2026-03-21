import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ReviewsList from "../../components/store/ReviewsList";
import StoreReviewsSummary from "../../components/store/StoreReviewsSummary";
import { getStoreReviewSummary, getStoreReviews } from "../../api/review.api";

const PAGE_SIZE = 10;

export default function Review() {
  const { storeId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const loadPage = async (nextPage, replace = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await getStoreReviews(storeId, { page: nextPage, size: PAGE_SIZE });
      const rows = Array.isArray(res.data) ? res.data : [];
      setReviews((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      setPage(nextPage);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1, true);
  }, [storeId]);

  useEffect(() => {
    setSummaryLoading(true);
    getStoreReviewSummary(storeId)
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [storeId]);

  return (
    <div className="space-y-4">
      <StoreReviewsSummary summary={summary} loading={summaryLoading} title="Store Ratings" />
      {error && <p className="text-sm text-red-300 mb-3">{error}</p>}
      <ReviewsList reviews={reviews} loading={loading && page === 1} emptyText="No reviews yet." />
      {hasMore && (
        <button
          type="button"
          onClick={() => loadPage(page + 1)}
          disabled={loading}
          className="mt-4 px-4 py-2 border border-white/10 rounded-lg text-white/70 hover:bg-white/5 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
