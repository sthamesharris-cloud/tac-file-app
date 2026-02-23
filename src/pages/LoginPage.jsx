import { useState } from "react";
import { USERS } from "../data";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = USERS.find(
        (u) => u.email === email && u.password === password
      );
      if (user) {
        onLogin(user);
      } else {
        setError("Invalid email or password. Try tac123 or mgr123.");
      }
      setLoading(false);
    }, 600);
  };

  const quickLogin = (role) => {
    const user = USERS.find((u) => u.role === role);
    if (user) onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/20 px-4 py-2 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
              Medtronic Neuromodulation
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TAC Field App</h1>
          <p className="text-slate-400 text-sm">Win with Podiatry · FY26</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@medtronic.com"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center mb-4">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin("tac")}
                className="py-2.5 border border-slate-700 text-slate-300 text-sm font-medium rounded-xl hover:border-cyan-400/50 hover:text-cyan-400 transition-all"
              >
                👤 TAC Demo
              </button>
              <button
                onClick={() => quickLogin("manager")}
                className="py-2.5 border border-slate-700 text-slate-300 text-sm font-medium rounded-xl hover:border-amber-400/50 hover:text-amber-400 transition-all"
              >
                📊 Manager Demo
              </button>
            </div>
          </div>
        </div>

        {/* Credentials hint */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-xs text-slate-600">TAC: jordan.mills@medtronic.com / tac123</p>
          <p className="text-xs text-slate-600">Manager: sarah.thompson@medtronic.com / mgr123</p>
        </div>
      </div>
    </div>
  );
}
