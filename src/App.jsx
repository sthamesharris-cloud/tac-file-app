import { useState, createContext, useContext } from "react";
import { USERS } from "./data";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import HCPDirectory from "./pages/HCPDirectory";
import HCPDetail from "./pages/HCPDetail";
import KnowledgeLibrary from "./pages/KnowledgeLibrary";
import RolePlay from "./pages/RolePlay";
import ManagerDashboard from "./pages/ManagerDashboard";

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// ─── NAV CONFIG ──────────────────────────────────────────────────────────────
const TAC_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "hcps", label: "HCP Directory", icon: "👥" },
  { id: "knowledge", label: "Knowledge Library", icon: "📖" },
  { id: "roleplay", label: "Role-Play Practice", icon: "🎭" },
];

const MGR_NAV = [
  { id: "manager", label: "Manager Dashboard", icon: "📊" },
  { id: "hcps", label: "HCP Directory", icon: "👥" },
  { id: "knowledge", label: "Knowledge Library", icon: "📖" },
];

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onLogout, mobileOpen, setMobileOpen }) {
  const nav = user.role === "manager" ? MGR_NAV : TAC_NAV;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#0D1322] border-r border-slate-800 flex flex-col transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-1 rounded">
            TAC Field App
          </span>
          <p className="text-base font-bold text-white mt-2 leading-tight font-sans">
            Medtronic<br />Neuromodulation
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">FY26 · Win with Podiatry</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-600 px-3 py-2">
            {user.role === "manager" ? "Manager Tools" : "My Tools"}
          </p>
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${(page === item.id || (page === "hcp-detail" && item.id === "hcps"))
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* MRL Compliance indicator */}
        <div className="mx-3 mb-3 p-3 bg-emerald-400/5 border border-emerald-400/20 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <p className="text-[11px] text-emerald-400 font-semibold">MRL-Approved Content</p>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">All assets verified. Content boundaries active.</p>
        </div>

        {/* User card */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role} · {user.territory}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────
function Topbar({ page, selectedHcp, setMobileOpen }) {
  const titles = {
    dashboard: "Command Center",
    hcps: "HCP Directory",
    "hcp-detail": selectedHcp?.name || "HCP Profile",
    knowledge: "Knowledge Library",
    roleplay: "Role-Play Practice",
    manager: "Manager Dashboard",
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#0D1322] border-b border-slate-800 flex items-center px-5 gap-4">
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden text-slate-400 hover:text-white text-xl"
      >
        ☰
      </button>
      <h1 className="font-bold text-white flex-1 text-base">{titles[page] || "TAC App"}</h1>
      <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Content Compliant
      </div>
    </header>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [selectedHcp, setSelectedHcp] = useState(null);
  const [hcps, setHcps] = useState(null); // will be initialized from data
  const [mobileOpen, setMobileOpen] = useState(false);
  const [knowledgeProgress, setKnowledgeProgress] = useState({});
  const [rolePlayHistory, setRolePlayHistory] = useState([]);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setPage(loggedInUser.role === "manager" ? "manager" : "dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("dashboard");
    setSelectedHcp(null);
  };

  const navigateTo = (p, hcp = null) => {
    if (hcp) setSelectedHcp(hcp);
    setPage(p);
    setMobileOpen(false);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const ctx = {
    user,
    page,
    setPage,
    selectedHcp,
    setSelectedHcp,
    hcps,
    setHcps,
    knowledgeProgress,
    setKnowledgeProgress,
    rolePlayHistory,
    setRolePlayHistory,
    navigateTo,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar
          page={page}
          setPage={setPage}
          user={user}
          onLogout={handleLogout}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
          <Topbar page={page} selectedHcp={selectedHcp} setMobileOpen={setMobileOpen} />
          <main className="flex-1 overflow-auto">
            {page === "dashboard" && <Dashboard />}
            {page === "hcps" && <HCPDirectory />}
            {page === "hcp-detail" && selectedHcp && <HCPDetail />}
            {page === "knowledge" && <KnowledgeLibrary />}
            {page === "roleplay" && <RolePlay />}
            {page === "manager" && <ManagerDashboard />}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
