import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.data?.message || "Reset instructions generated.");
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Failed to generate reset token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2400&auto=format&fit=crop')] bg-cover bg-center animate-hero-pan" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between text-sm text-white/70">
          <span className="font-display text-xl tracking-[0.18em] text-white">
            RushCart
          </span>
          <span className="uppercase tracking-[0.3em]">Reset Access</span>
        </header>

        <main className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300/80 animate-hero-fade">
              Password Recovery
            </p>
            <h1
              className="font-display text-4xl leading-tight md:text-5xl animate-hero-rise"
              style={{ animationDelay: "80ms" }}
            >
              Regain access in minutes.
            </h1>
            <p
              className="max-w-md text-base text-white/75 animate-hero-rise"
              style={{ animationDelay: "160ms" }}
            >
              Enter the email linked to your RushCart account. We will send a secure reset token.
            </p>
            <div
              className="grid gap-3 text-sm text-white/70 animate-hero-rise"
              style={{ animationDelay: "240ms" }}
            >
              <span>Tokens expire quickly for safety.</span>
              <span>Use the same device for faster reset.</span>
            </div>
          </section>

          <section className="w-full max-w-md space-y-6">
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm uppercase tracking-[0.2em] text-white/60">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@rushcart.com"
                  autoComplete="email"
                  className="w-full border-b border-white/30 bg-transparent px-1 py-3 text-lg text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-between rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-300/60"
              >
                <span>{loading ? "Sending" : "Send Reset Link"}</span>
                <span className="text-base">→</span>
              </button>
            </form>
            {message && <p className="text-sm text-white/70">{message}</p>}
            <div className="text-sm text-white/70">
              Already have a token?{" "}
              <Link to="/reset-confirmation" className="text-amber-200 hover:text-amber-100">
                Reset now
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
