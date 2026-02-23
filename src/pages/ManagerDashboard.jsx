import { useApp } from "../App";
import { INITIAL_HCPS, JOURNEY_STAGES, KNOWLEDGE_MODULES, ROLE_PLAYS } from "../data";

function StatCard({ label, value, change, accent, icon }) {
  const accents = {
    cyan: "from-cyan-400",
    pink: "from-pink-400",
    amber: "from-amber-400",
    emerald: "from-emerald-400",
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accents[accent]} to-transparent`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-500">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
      {change && <p className="text-xs text-emerald-400 mt-1.5 font-medium">{change}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { navigateTo, user, knowledgeProgress } = useApp();
  const hcps = INITIAL_HCPS.filter(h => h.tacId === user.id);
  const completedModules = Object.values(knowledgeProgress).filter(v => v?.completed).length;
  const referrals = hcps.filter(h => h.currentlyReferring).length;

  const stageCount = (stage) => hcps.filter(h => h.stage === stage).length;

  const stageColors = {
    Awareness: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    Education: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    Consideration: "text-pink-400 bg-pink-400/10 border-pink-400/20",
    Adoption: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };

  const specialtyColor = (s) => ({
    Podiatrist: "text-violet-400 bg-violet-400/10",
    PCP: "text-cyan-400 bg-cyan-400/10",
    Endocrinologist: "text-amber-400 bg-amber-400/10",
  }[s] || "text-slate-400 bg-slate-400/10");

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-white">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {" · "}{user.territory} Territory
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active HCPs" value={hcps.length} change={`${stageCount("Adoption")} referring`} accent="cyan" icon="👥" />
        <StatCard label="Referrals" value={referrals} change="This month" accent="emerald" icon="📋" />
        <StatCard label="In Pipeline" value={stageCount("Consideration")} change="Consideration stage" accent="amber" icon="🎯" />
        <StatCard label="Modules Done" value={`${completedModules}/${KNOWLEDGE_MODULES.length}`} accent="pink" icon="📖" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Priority HCPs */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">
              Priority HCPs This Week
            </h2>
            <button
              onClick={() => navigateTo("hcps")}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {hcps.slice(0, 4).map((hcp) => (
              <button
                key={hcp.id}
                onClick={() => navigateTo("hcp-detail", hcp)}
                className="w-full text-left flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-400/30 hover:bg-slate-800/50 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${specialtyColor(hcp.specialty)}`}>
                  {hcp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">{hcp.name}</p>
                  <p className="text-xs text-slate-500 truncate">{hcp.practice}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stageColors[hcp.stage]}`}>
                    {hcp.stage}
                  </span>
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Pipeline summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4">Pipeline by Stage</p>
            <div className="space-y-3">
              {JOURNEY_STAGES.map((stage) => {
                const count = stageCount(stage);
                const pct = hcps.length ? Math.round((count / hcps.length) * 100) : 0;
                const barColors = {
                  Awareness: "bg-yellow-400",
                  Education: "bg-cyan-400",
                  Consideration: "bg-pink-400",
                  Adoption: "bg-emerald-400",
                };
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{stage}</span>
                      <span className="font-bold text-white">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${barColors[stage]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[
                { label: "Add New HCP", icon: "＋", action: () => navigateTo("hcps") },
                { label: "Start Role-Play", icon: "🎭", action: () => navigateTo("roleplay") },
                { label: "Open Knowledge Library", icon: "📖", action: () => navigateTo("knowledge") },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-all text-left"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-medium text-slate-300">{item.label}</span>
                  <span className="ml-auto text-slate-600">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Next Visit */}
          <div className="bg-gradient-to-br from-cyan-400/10 to-pink-400/5 border border-cyan-400/20 rounded-2xl p-5">
            <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2">Next Scheduled Visit</p>
            {hcps[0] && (
              <>
                <p className="text-sm font-bold text-white">{hcps[0].name}</p>
                <p className="text-xs text-slate-400">{hcps[0].nextVisit}</p>
                <button
                  onClick={() => navigateTo("hcp-detail", hcps[0])}
                  className="mt-3 w-full py-2 bg-cyan-400 text-slate-900 text-xs font-bold rounded-lg hover:bg-cyan-300 transition-colors"
                >
                  View Visit Plan
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
