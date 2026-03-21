import { Link } from "react-router-dom";

export default function CategoryCard({ title, slug, image, icon: Icon }) {
  return (
    <Link to={`/category/${slug}`} className="group cursor-pointer block min-w-[130px]">
      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            {Icon && <Icon className="w-6 h-6 text-amber-200" />}
          </div>
        )}
        {Icon && image && (
          <div className="absolute left-2 top-2 w-7 h-7 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-amber-200" />
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-white/70 group-hover:text-white">{title}</p>
    </Link>
  );
}
