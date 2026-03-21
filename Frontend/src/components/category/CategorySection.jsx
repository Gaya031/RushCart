import { useEffect, useState } from "react";
import {
  Baby,
  BatteryCharging,
  Beef,
  Box,
  Cookie,
  Droplets,
  HeartPulse,
  Home,
  Milk,
  PawPrint,
  ShoppingBasket,
} from "lucide-react";
import CategoryCard from "./CategoryCard";
import { getAllCategories } from "@/api/category.api";
import { getAllProducts } from "@/api/product.api";

const slugify = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const iconBySlug = {
    groceries: ShoppingBasket,
    "dairy-eggs": Milk,
    snacks: Cookie,
    beverages: Droplets,
    household: Home,
    "personal-care": HeartPulse,
    "baby-care": Baby,
    pharmacy: HeartPulse,
    "meat-seafood": Beef,
    "pet-supplies": PawPrint,
    electronics: BatteryCharging,
    stationery: Box,
  };
  const blockedSlugs = new Set([
    "fruits",
    "fruit",
    "fruits-vegetables",
    "fruits-veg",
    "chocolate",
    "chocolates",
    "choclate",
    "choclates",
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAllCategories();
        const rows = Array.isArray(res?.data) ? res.data : [];
        let normalized = rows
          .filter((row) => Boolean(row?.name))
          .map((row) => {
            const slug = row.slug || slugify(row.name);
            return {
              ...row,
              slug,
              icon: iconBySlug[slug] || null,
            };
          })
          .filter((row) => !blockedSlugs.has(row.slug));

        if (normalized.length === 0) {
          const productsRes = await getAllProducts({ size: 200 });
          const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
          const seen = new Set();
          normalized = products
            .map((p) => String(p?.category || "").trim())
            .filter(Boolean)
            .map((name) => {
              const slug = slugify(name);
              return {
                name,
                slug,
                icon: iconBySlug[slug] || null,
              };
            })
            .filter((row) => row.slug && !blockedSlugs.has(row.slug))
            .filter((row) => {
              if (seen.has(row.slug)) return false;
              seen.add(row.slug);
              return true;
            });
        }

        setCategories(normalized);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
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
            key={c.id || c.slug || c.name}
            title={c.name || c}
            slug={c.slug || slugify(c.name || c)}
            image={c.image_url || c.image}
            icon={c.icon || null}
          />
        ))}
      </div>
    </section>
  );
}
