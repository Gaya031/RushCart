const BAR_COLORS = {
  5: "bg-amber-300",
  4: "bg-amber-300/80",
  3: "bg-amber-300/60",
  2: "bg-amber-300/40",
  1: "bg-amber-300/20",
};

export default function StoreReviewsSummary({ summary, loading = false, title = "Ratings Summary" }) {
  if (loading) return <p className="text-sm text-white/60">Loading summary...</p>;
  if (!summary) return null;

  const total = Number(summary.total_reviews || 0);
  const avg = Number(summary.average_rating || 0);
  const breakdown = summary.breakdown || {};

  return (
    <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
      <h4 className="font-semibold mb-3 text-white">{title}</h4>
      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-3xl font-bold text-white">{avg.toFixed(1)}</p>
          <p className="text-sm text-white/50">{total} reviews</p>
        </div>
      </div>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = Number(breakdown[rating] || 0);
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={rating} className="flex items-center gap-2 text-sm text-white/70">
              <span className="w-6">{rating}★</span>
              <div className="h-2 flex-1 bg-white/10 rounded">
                <div className={`h-2 rounded ${BAR_COLORS[rating]}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-16 text-right text-white/50">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
