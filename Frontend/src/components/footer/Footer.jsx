export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#090909] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-display text-2xl">RushCart</h4>
          <p className="text-sm text-white/60 mt-3">
            Hyperlocal delivery from trusted neighborhood stores, fast and reliable.
          </p>
        </div>

        <div>
          <h5 className="text-sm font-semibold uppercase tracking-widest text-white/60">Explore</h5>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>Stores</p>
            <p>Offers</p>
            <p>Categories</p>
          </div>
        </div>

        <div>
          <h5 className="text-sm font-semibold uppercase tracking-widest text-white/60">Company</h5>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>About</p>
            <p>Careers</p>
            <p>Contact</p>
          </div>
        </div>

        <div>
          <h5 className="text-sm font-semibold uppercase tracking-widest text-white/60">Support</h5>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>help@rushcart.com</p>
            <p>Support hours: 8am - 10pm</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
