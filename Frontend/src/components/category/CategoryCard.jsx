import { Link } from "react-router-dom";

export default function CategoryCard({ title, slug, image }) {
  return (
    <Link to={`/category/${slug}`} className="group cursor-pointer block min-w-[120px]">
      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
        )}
      </div>
      <p className="mt-3 text-sm text-white/70 group-hover:text-white">{title}</p>
    </Link>
  );
}
