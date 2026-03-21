import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/auth.api";
import { pushToast } from "../../store/toast.store";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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

  return (
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
              <Input label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />
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
