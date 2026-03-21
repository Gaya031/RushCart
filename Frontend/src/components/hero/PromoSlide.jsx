import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "@/utils/media";

export default function PromoSlide({ banner }) {
  const navigate = useNavigate();
  const title = banner?.title || "Fresh Groceries in 20 mins";
  const subtitle = banner?.subtitle || "Daily essentials from nearby stores";
  const imageUrl = resolveMediaUrl(banner?.image_url, "/hero.png");
  const primaryLabel = banner?.cta_primary_label || "Shop Now";
  const primaryLink = banner?.cta_primary_link || "/products";
  const secondaryLabel = banner?.cta_secondary_label || "View Offers";
  const secondaryLink = banner?.cta_secondary_link || "/products?offers=1";
  const showSecondary = Boolean(secondaryLabel);

  return (
    <div className="relative min-h-[70vh] md:min-h-[78vh] w-full overflow-hidden">
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover animate-hero-pan"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 min-h-[70vh] md:min-h-[78vh] flex items-center">
        <div className="max-w-xl text-white space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200 animate-hero-fade">
            RushCart Hyperlocal
          </p>
          <h2 className="font-display text-4xl md:text-6xl leading-tight animate-hero-rise">
            {title}
          </h2>
          <p className="text-base md:text-lg text-white/75 animate-hero-rise">
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-3 animate-hero-rise">
            <Button
              className="bg-amber-300 text-black hover:bg-amber-200"
              onClick={() => navigate(primaryLink)}
            >
              {primaryLabel}
            </Button>
            {showSecondary && (
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate(secondaryLink)}
              >
                {secondaryLabel}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-white/60">
            <span>Delivery in 20-35 min</span>
            <span>Local stores, daily essentials</span>
            <span>Live tracking enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
