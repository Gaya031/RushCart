import { useEffect, useState } from "react";
import CategoryCard from "./CategoryCard";
import { getAllCategories } from "@/api/category.api";

const slugify = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCategories()
      .then(res => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        const normalized = rows.filter((row) => Boolean(row?.name));
        setCategories(normalized);
      })
      .catch(err => console.error("Error fetching categories:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 mt-14">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h3 className="font-display text-2xl text-white">Shop by Category</h3>
          <p className="text-sm text-white/60 mt-2">Curated aisles from trusted neighborhood stores.</p>
        </div>
      </div>
      {loading && <p className="text-sm text-white/60 mt-4">Loading categories...</p>}
      {!loading && categories.length === 0 && (
        <p className="text-sm text-white/60 mt-4">No categories available right now.</p>
      )}
      <div className="mt-6 flex gap-6 overflow-x-auto pb-2">
        {categories.map((c) => (
          <CategoryCard
            key={c.id || c}
            title={c.name || c}
            slug={c.slug || slugify(c.name || c)}
            image={c.image_url || c.image}
          />
        ))}
      </div>
    </section>
  );
}
