import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Footer from "../../components/footer/Footer";
import Navbar from "../../components/navbar/Navbar";
import ProductCard from "../../components/product/ProductCard";
import { getCategoryBySlug } from "../../api/category.api";
import { getAllProducts } from "../../api/product.api";

const titleFromSlug = (value) =>
  String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        let categoryData = null;
        try {
          const categoryRes = await getCategoryBySlug(slug);
          categoryData = categoryRes.data;
        } catch (err) {
          const status = err?.response?.status;
          if (status !== 404) throw err;
          categoryData = { name: titleFromSlug(slug), description: null };
        }

        if (!mounted) return;
        setCategory(categoryData);

        const productsRes = await getAllProducts({ category: slug });
        if (!mounted) return;
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.detail || "Failed to load category");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen rc-shell">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <p className="text-white/60">Loading category...</p>
        ) : error ? (
          <p className="text-red-300 text-sm">{error}</p>
        ) : (
          <>
            <h1 className="font-display text-3xl text-white mb-2">{category?.name}</h1>
            {category?.description && <p className="text-white/60 mb-8">{category.description}</p>}
            {products.length === 0 ? (
              <p className="text-white/60">No products available in this category.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
