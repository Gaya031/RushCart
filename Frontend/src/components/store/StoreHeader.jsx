import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const StoreHeader = ({ store }) => {
  return (
    <div className="border-b border-white/10 bg-[#0b0b0b]">
      <div className="relative h-64 md:h-72">
        <img
          src={store.cover_image || "/store-banner.jpg"}
          alt={store.store_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-20 h-20 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center">
          <img src={store.logo || "/store-logo.png"} alt="logo" className="w-12 h-12" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-white">{store.store_name}</h1>
            {store.approved && <Badge className="bg-amber-300 text-black">Open Now</Badge>}
          </div>

          <p className="text-sm text-white/60 mt-2">
            {Number(store.average_rating || 0).toFixed(1)} rating • {store.total_reviews || 0} reviews
          </p>

          <p className="text-sm text-white/60 mt-2">
            {store.description}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Follow
          </Button>
          <Button className="bg-amber-300 text-black hover:bg-amber-200">Contact Seller</Button>
        </div>
      </div>
    </div>
  )
}

export default StoreHeader
