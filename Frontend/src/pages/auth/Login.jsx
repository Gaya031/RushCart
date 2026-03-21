import { useState } from 'react';
import { login, getMe } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { useNavigate } from 'react-router-dom';
import { pushToast } from '../../store/toast.store';
import { getRoleHomePath } from '../../utils/rolePaths';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore(state => state.setAuth);
    const syncGuestCartToServer = useCartStore((s) => s.syncGuestCartToServer);

    const submit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login({ email, password });
            const access_token = res.data?.access_token || res.data?.accessToken || res.access_token;
            const refresh_token = res.data?.refresh_token || res.data?.refreshToken || res.refresh_token;
            
            if (!access_token) {
                pushToast({ type: "error", message: "Login failed: no access token in response." });
                setLoading(false);
                return;
            }
            
            setAuth(null, access_token, refresh_token);
            
            // Try to get user profile
            try {
                const me = await getMe();
                setAuth(me.data, access_token, refresh_token);
                if (me.data?.role === "buyer") {
                  await syncGuestCartToServer();
                }
                navigate(getRoleHomePath(me.data?.role), { replace: true });
            } catch (meErr) {
                console.error("GetMe error:", meErr);
                pushToast({
                  type: "warning",
                  message: "Login succeeded but profile fetch failed. Please refresh.",
                });
                navigate("/");
            }
        } catch (err) {
            pushToast({ type: "error", message: err.response?.data?.detail || "Invalid credentials." });
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=2400&auto=format&fit=crop')] bg-cover bg-center animate-hero-pan" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-900/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%)]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
          <header className="flex items-center justify-between text-sm text-white/70">
            <span className="font-display text-xl tracking-[0.18em] text-white">
              RushCart
            </span>
            <span className="uppercase tracking-[0.3em]">Hyperlocal Commerce</span>
          </header>

          <main className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <p className="text-xs uppercase tracking-[0.4em] text-amber-300/80 animate-hero-fade">
                Sign In
              </p>
              <h1 className="font-display text-4xl leading-tight md:text-5xl animate-hero-rise" style={{ animationDelay: "80ms" }}>
                Move faster across orders, stores, and deliveries.
              </h1>
              <p className="max-w-md text-base text-white/75 animate-hero-rise" style={{ animationDelay: "160ms" }}>
                One workspace for buyers, sellers, and partners powering same-day fulfillment.
              </p>
              <div className="grid gap-3 text-sm text-white/70 animate-hero-rise" style={{ animationDelay: "240ms" }}>
                <span>Instant order status updates and tracking.</span>
                <span>Seller dashboards with earnings and inventory control.</span>
                <span>Delivery routes optimized for local drops.</span>
              </div>
            </section>

            <section className="w-full max-w-md space-y-6">
              <form className="space-y-6" onSubmit={submit}>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.2em] text-white/60">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@rushcart.com"
                    autoComplete="email"
                    required
                    className="w-full border-b border-white/30 bg-transparent px-1 py-3 text-lg text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                    <span>Password</span>
                    <a href="/forgot-password" className="text-amber-200 hover:text-amber-100">
                      Forgot?
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full border-b border-white/30 bg-transparent px-1 py-3 text-lg text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-300/60"
                >
                  <span>{loading ? "Signing in" : "Enter RushCart"}</span>
                  <span className="text-base">→</span>
                </button>
              </form>

              <div className="text-sm text-white/70">
                No account yet?{" "}
                <a href="/register" className="text-amber-200 hover:text-amber-100">
                  Create one
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
}

export default Login
