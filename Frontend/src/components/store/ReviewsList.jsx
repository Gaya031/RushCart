export default function ReviewsList({ reviews = [], loading = false, emptyText = "No reviews yet." }) {
  if (loading) return <p className="text-sm text-white/60">Loading reviews...</p>;
  if (!reviews.length) return <p className="text-sm text-white/60">{emptyText}</p>;

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm text-white">Rating: {review.rating}/5</p>
            {review.created_at && (
              <p className="text-xs text-white/50">{new Date(review.created_at).toLocaleDateString()}</p>
            )}
          </div>
          <p className="text-sm text-white/70 mt-1">{review.comment || "No comment provided."}</p>
        </div>
      ))}
    </div>
  );
}
