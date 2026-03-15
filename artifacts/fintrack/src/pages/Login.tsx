import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { Wallet, Eye, EyeOff, Mail, Lock, User, ArrowRight, ShieldCheck, Loader2, Chrome } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "login" | "signup";

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
}

function Field({ label, type = "text", value, onChange, placeholder, icon, autoComplete }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
            {icon}
          </div>
        )}
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all ${icon ? "pl-10" : ""} ${isPassword ? "pr-10" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!loginEmail || !loginPassword) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/local-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!signupUsername || !signupEmail || !signupPassword || !signupConfirm) {
      setError("Please fill in all required fields."); return;
    }
    if (signupPassword !== signupConfirm) { setError("Passwords do not match."); return; }
    if (signupPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: signupUsername,
          email: signupEmail,
          password: signupPassword,
          firstName: signupFirstName,
          lastName: signupLastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      setSuccess("Account created! Signing you in...");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${BASE}/api/auth/google`;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "login", label: "Sign In" },
    { id: "signup", label: "Create Account" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="hidden lg:flex flex-col"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-8 w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered Finance Tracker
          </div>
          <h1 className="text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
            Master your <br />wealth with{" "}
            <span className="text-gradient">FinTrack AI</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-md">
            Track expenses, get personalized investment advice, and chat with your AI financial advisor — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { emoji: "📊", title: "Smart Analytics", desc: "Beautiful charts & spending insights" },
              { emoji: "🤖", title: "AI Advisor", desc: "Personalized Indian market advice" },
              { emoji: "💼", title: "Wallet Linking", desc: "Groww & Binance integration" },
              { emoji: "🔒", title: "Secure", desc: "Bank-grade data protection" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/8">
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-glass rounded-[2rem] shadow-2xl overflow-hidden border border-white/10">

            <div className="px-8 pt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">FinTrack AI</h2>
                  <p className="text-xs text-muted-foreground">Your financial co-pilot</p>
                </div>
              </div>

              <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setError(""); setSuccess(""); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      tab === t.id
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-8 pb-8">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium text-foreground transition-all mb-5 group"
              >
                <Chrome className="w-4 h-4 text-[#4285F4] group-hover:scale-110 transition-transform" />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <AnimatePresence mode="wait">
                {tab === "login" ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleLogin}
                    className="flex flex-col gap-4"
                  >
                    <Field
                      label="Email"
                      type="email"
                      value={loginEmail}
                      onChange={setLoginEmail}
                      placeholder="you@example.com"
                      icon={<Mail className="w-4 h-4" />}
                      autoComplete="email"
                    />
                    <Field
                      label="Password"
                      type="password"
                      value={loginPassword}
                      onChange={setLoginPassword}
                      placeholder="••••••••"
                      icon={<Lock className="w-4 h-4" />}
                      autoComplete="current-password"
                    />

                    {error && (
                      <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><ArrowRight className="w-4 h-4" /> Sign In</>
                      )}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                      Don't have an account?{" "}
                      <button type="button" onClick={() => { setTab("signup"); setError(""); }} className="text-primary hover:underline font-medium">
                        Create one
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSignup}
                    className="flex flex-col gap-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="First Name" value={signupFirstName} onChange={setSignupFirstName} placeholder="Kiran" autoComplete="given-name" />
                      <Field label="Last Name" value={signupLastName} onChange={setSignupLastName} placeholder="M" autoComplete="family-name" />
                    </div>
                    <Field
                      label="Username *"
                      value={signupUsername}
                      onChange={setSignupUsername}
                      placeholder="kiran1911"
                      icon={<User className="w-4 h-4" />}
                      autoComplete="username"
                    />
                    <Field
                      label="Email *"
                      type="email"
                      value={signupEmail}
                      onChange={setSignupEmail}
                      placeholder="you@example.com"
                      icon={<Mail className="w-4 h-4" />}
                      autoComplete="email"
                    />
                    <Field
                      label="Password * (min 6 chars)"
                      type="password"
                      value={signupPassword}
                      onChange={setSignupPassword}
                      placeholder="••••••••"
                      icon={<Lock className="w-4 h-4" />}
                      autoComplete="new-password"
                    />
                    <Field
                      label="Confirm Password *"
                      type="password"
                      value={signupConfirm}
                      onChange={setSignupConfirm}
                      placeholder="••••••••"
                      icon={<Lock className="w-4 h-4" />}
                      autoComplete="new-password"
                    />

                    {error && (
                      <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                    )}
                    {success && (
                      <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{success}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><User className="w-4 h-4" /> Create Account</>
                      )}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                      Already have an account?{" "}
                      <button type="button" onClick={() => { setTab("login"); setError(""); }} className="text-primary hover:underline font-medium">
                        Sign in
                      </button>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="mt-6 pt-5 border-t border-white/8">
                <p className="text-xs text-muted-foreground text-center mb-3">Or continue with</p>
                <button
                  onClick={() => login()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/3 hover:bg-white/8 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Continue with Replit Auth
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4 opacity-60">
            By continuing, you agree to our Terms of Service
          </p>
        </motion.div>
      </div>
    </div>
  );
}
