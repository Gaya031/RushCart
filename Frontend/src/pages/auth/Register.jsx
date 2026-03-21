import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { register, googleLogin, getMe } from "../../api/auth.api";
import { pushToast } from "../../store/toast.store";
import { useAuthStore } from "../../store/auth.store";
import { useCartStore } from "../../store/cart.store";
import { getRoleHomePath } from "../../utils/rolePaths";

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const syncGuestCartToServer = useCartStore((s) => s.syncGuestCartToServer);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [googleReady, setGoogleReady] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleChange = e => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async e => {
    e.preventDefault();
    setError("");

    if (form.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await register(form);
      pushToast({ type: "success", message: "Registration successful. Please login to continue." });
      navigate("/");
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Registration failed"
      );
    }
  };

  const handleAuthSuccess = async (accessToken, refreshToken) => {
    setAuth(null, accessToken, refreshToken);
    try {
      const me = await getMe();
      setAuth(me.data, accessToken, refreshToken);
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
  };

  useEffect(() => {
    console.log(googleClientId);
    if (!googleClientId) return;
    let cancelled = false;

    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve(true);
        const existing = document.getElementById("google-identity");
        if (existing) {
          existing.addEventListener("load", () => resolve(true), { once: true });
          existing.addEventListener("error", reject, { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.id = "google-identity";
        script.onload = () => resolve(true);
        script.onerror = reject;
        document.body.appendChild(script);
      });

    loadScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const res = await googleLogin({
                id_token: response.credential,
                role: form.role,
              });
              console.log("googleLogin: ", res);
              const access = res.data?.access_token;
              const refresh = res.data?.refresh_token;
              if (!access) {
                pushToast({ type: "error", message: "Google login failed." });
                return;
              }
              await handleAuthSuccess(access, refresh);
            } catch (err) {
              const detail =
                err?.response?.data?.detail ||
                err?.response?.data?.error?.message ||
                "Google login failed.";
              pushToast({ type: "error", message: detail });
            }
          },
        });
        setGoogleReady(true);
      })
      .catch(() => {
        if (!cancelled) setGoogleReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, form.role]);

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2400&auto=format&fit=crop')] bg-cover bg-center animate-hero-pan" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-900/30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%)]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
          <header className="flex items-center justify-between text-sm text-white/70">
            <span className="font-display text-xl tracking-[0.18em] text-white">
              RushCart
            </span>
            <span className="uppercase tracking-[0.3em]">Create Account</span>
          </header>

          <main className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <p className="text-xs uppercase tracking-[0.4em] text-amber-300/80 animate-hero-fade">
                Join the Network
              </p>
              <h1 className="font-display text-4xl leading-tight md:text-5xl animate-hero-rise" style={{ animationDelay: "80ms" }}>
                Bring your store, orders, or delivery route online.
              </h1>
              <p className="max-w-md text-base text-white/75 animate-hero-rise" style={{ animationDelay: "160ms" }}>
                RushCart connects local commerce in minutes. Pick your role and start moving.
              </p>
            </section>

            <section className="w-full max-w-md space-y-8">
              <div className="space-y-3 text-xs uppercase tracking-[0.25em] text-white/60">
                <span>Choose your role</span>
                <div className="flex flex-wrap gap-3 text-sm font-medium normal-case">
                  {["buyer", "seller", "delivery"].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm({ ...form, role })}
                      className={`border-b-2 px-2 py-1 transition ${
                        form.role === role
                          ? "border-amber-300 text-amber-200"
                          : "border-transparent text-white/70 hover:text-white"
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <form className="space-y-6" onSubmit={submit}>
                <Input label="Full Name" name="name" value={form.name} onChange={handleChange} />
                <Input label="Email Address" name="email" value={form.email} onChange={handleChange} />
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />

                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.2em] text-white/60">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full border-b bg-transparent px-1 py-3 text-lg text-white placeholder:text-white/40 focus:outline-none ${
                      error
                        ? "border-red-400 focus:border-red-400"
                        : "border-white/30 focus:border-amber-300"
                    }`}
                  />
                  {error && (
                    <p className="text-xs uppercase tracking-[0.2em] text-red-300">
                      {error}
                    </p>
                  )}
                </div>

                <button className="flex w-full items-center justify-between rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-amber-200">
                  <span>Create Account</span>
                  <span className="text-base">→</span>
                </button>
              </form>

              {googleClientId && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
                    <span className="h-px flex-1 bg-white/10" />
                    <span>Or</span>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                <button
                  type="button"
                  onClick={() => window.google?.accounts?.id?.prompt?.()}
                  disabled={!googleReady}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-amber-300/60 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.751 32.667 29.23 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.199 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691 12.87 19.51C14.547 15.367 18.91 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.199 4 24 4 16.318 4 9.656 8.322 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.145 0 9.91-1.973 13.488-5.197l-6.228-5.272C29.211 35.091 26.715 36 24 36c-5.208 0-9.71-3.318-11.285-7.946l-6.518 5.02C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.743 2.02-2.078 3.734-3.043 4.757l.001-.001 6.228 5.272C36.132 40.177 40 36 40 36c2.5-2.273 4-5.727 4-12 0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  Continue with Google
                </button>
                </div>
              )}

              <div className="text-sm text-white/70">
                Already have an account?{" "}
                <a href="/login" className="text-amber-200 hover:text-amber-100">
                  Log in
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}

/* Reusable input – UI unchanged */
function Input({ label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-sm uppercase tracking-[0.2em] text-white/60">{label}</label>
      <input
        {...props}
        required
        className="w-full border-b border-white/30 bg-transparent px-1 py-3 text-lg text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
      />
    </div>
  );
}
