import { useState } from "react";
import { useApp } from "../App";
import { JOURNEY_STAGES, STAGE_CONFIG } from "../data";

const stageColor = (stage) => ({
  Awareness: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Education: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  Consideration: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  Adoption: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
}[stage] || "");

const specialtyColor = (s) => ({
  Podiatrist: "text-violet-400 bg-violet-400/10",
  PCP: "text-cyan-400 bg-cyan-400/10",
  Endocrinologist: "text-amber-400 bg-amber-400/10",
}[s] || "text-slate-400 bg-slate-400/10");

function JourneyTracker({ currentStage, onStageChange }) {
  const idx = JOURNEY_STAGES.indexOf(currentStage);
  return (
    <div className="flex items-center w-full">
      {JOURNEY_STAGES.map((stage, i) => {
        const isCompleted = i < idx;
        const isActive = i === idx;
        return (
          <div key={stage} className="flex items-center flex-1">
            <button onClick={() => onStageChange(stage)} className="flex flex-col items-center gap-1.5 group flex-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${isCompleted ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" : ""}
                ${isActive ? "border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_16px_rgba(0,212,255,0.35)]" : ""}
                ${!isCompleted && !isActive ? "border-slate-700 bg-slate-900 text-slate-600" : ""}`}>
                {isCompleted ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap
                ${isActive ? "text-cyan-400" : isCompleted ? "text-emerald-400" : "text-slate-600"}`}>
                {stage}
              </span>
            </button>
            {i < JOURNEY_STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${i < idx ? "bg-emerald-400/40" : "bg-slate-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LogVisitModal({ hcp, onClose, onLog }) {
  const [outcome, setOutcome] = useState("");
  const [commitment, setCommitment] = useState("");
  const [newStage, setNewStage] = useState(hcp.stage);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLog({
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      stage: newStage,
      outcome,
      commitment,
    });
  };

  const field = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors";

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white">Log Visit – {hcp.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1.5">Visit Outcome</label>
            <textarea className={`${field} h-24 resize-none`} placeholder="What happened? What was discussed?" value={outcome} onChange={e => setOutcome(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1.5">Micro-Commitment Secured</label>
            <input className={field} placeholder="What did the HCP agree to?" value={commitment} onChange={e => setCommitment(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1.5">Update Journey Stage</label>
            <select className={field} value={newStage} onChange={e => setNewStage(e.target.value)}>
              {JOURNEY_STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:border-slate-500 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-cyan-400 text-slate-900 font-bold rounded-xl text-sm hover:bg-cyan-300 transition-colors">Log Visit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HCPDetail() {
  const { selectedHcp, setSelectedHcp, navigateTo } = useApp();
  const [hcp, setHcp] = useState(selectedHcp);
  const [stage, setStage] = useState(hcp.stage);
  const [activeTab, setActiveTab] = useState("plan");
  const [showLog, setShowLog] = useState(false);
  const [showAddObjection, setShowAddObjection] = useState(false);
  const [newObjection, setNewObjection] = useState("");

  const config = STAGE_CONFIG[stage];

  const handleLogVisit = (visitData) => {
    const updated = {
      ...hcp,
      stage: visitData.stage,
      lastVisit: visitData.date,
      visits: [visitData, ...hcp.visits],
    };
    setHcp(updated);
    setSelectedHcp(updated);
    setStage(visitData.stage);
    setShowLog(false);
  };

  const handleAddObjection = () => {
    if (!newObjection.trim()) return;
    setHcp(h => ({ ...h, objections: [...h.objections, newObjection.trim()] }));
    setNewObjection("");
    setShowAddObjection(false);
  };

  const tabs = [
    { id: "plan", label: "Visit Plan" },
    { id: "profile", label: "HCP Profile" },
    { id: "history", label: `Visit History (${hcp.visits.length})` },
  ];

  const accentMap = {
    cyan: "text-cyan-400",
    yellow: "text-yellow-400",
    pink: "text-pink-400",
    green: "text-emerald-400",
  };
  const accentText = accentMap[config.color] || "text-cyan-400";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigateTo("hcps")} className="text-slate-400 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex-1" />
        <button onClick={() => setShowLog(true)} className="px-4 py-2 bg-cyan-400 text-slate-900 text-sm font-bold rounded-xl hover:bg-cyan-300 transition-colors">
          + Log Visit
        </button>
      </div>

      {/* HCP Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${specialtyColor(hcp.specialty)}`}>
            {hcp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{hcp.name}</h1>
            <p className="text-slate-400 text-sm">{hcp.practice}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${specialtyColor(hcp.specialty)}`}>{hcp.specialty}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700 text-slate-300">{hcp.style}</span>
              {hcp.currentlyReferring && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">✓ Referring</span>
              )}
            </div>
          </div>
        </div>
        <JourneyTracker currentStage={stage} onStageChange={setStage} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
              ${activeTab === t.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* VISIT PLAN TAB */}
      {activeTab === "plan" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            {/* Behavior & Goal */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className={`text-xs font-bold tracking-widest uppercase mb-1 ${accentText}`}>Primary Behavior</p>
              <p className="text-lg font-bold text-white">{config.behavior}</p>
              <p className="text-sm text-slate-400 mt-1">{config.goal}</p>
            </div>

            {/* TAC Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className={`text-xs font-bold tracking-widest uppercase mb-3 ${accentText}`}>TAC Actions</p>
              <div className="space-y-2">
                {config.tacActions.map((a, i) => (
                  <div key={i} className="flex gap-2.5 text-sm text-slate-300">
                    <span className={`mt-0.5 flex-shrink-0 ${accentText}`}>›</span>
                    {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Starters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className={`text-xs font-bold tracking-widest uppercase mb-3 ${accentText}`}>Conversation Starters</p>
              <div className="space-y-2">
                {config.conversationStarters.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-800 rounded-xl text-xs text-slate-300 italic border border-slate-700">
                    "{c}"
                  </div>
                ))}
              </div>
            </div>

            {/* Micro-Commitment */}
            <div className="bg-gradient-to-r from-cyan-400/10 to-transparent border border-cyan-400/20 rounded-2xl p-5">
              <p className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2">Micro-Commitment to Secure</p>
              <p className="text-sm text-slate-200">{config.microCommitment}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* HCP Mindset */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-bold tracking-widest uppercase text-amber-400 mb-3">HCP Mindset at This Stage</p>
              <div className="space-y-2">
                {config.hcpMindset.map((m, i) => (
                  <div key={i} className="flex gap-2 text-sm text-slate-300 p-2 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                    <span className="text-amber-400 flex-shrink-0">"</span>
                    {m}
                    <span className="text-amber-400">"</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Known Objections */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest uppercase text-pink-400">Known Objections</p>
                <button onClick={() => setShowAddObjection(!showAddObjection)} className="text-xs text-pink-400 hover:text-pink-300">+ Add</button>
              </div>
              {hcp.objections.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No objections logged yet</p>
              ) : (
                <div className="space-y-2">
                  {hcp.objections.map((o, i) => (
                    <div key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-pink-400 flex-shrink-0">⚠</span> {o}
                    </div>
                  ))}
                </div>
              )}
              {showAddObjection && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={newObjection}
                    onChange={e => setNewObjection(e.target.value)}
                    placeholder="Describe objection..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-pink-400"
                    onKeyDown={e => e.key === "Enter" && handleAddObjection()}
                  />
                  <button onClick={handleAddObjection} className="px-3 py-2 bg-pink-500 text-white text-xs font-bold rounded-lg hover:bg-pink-400">Add</button>
                </div>
              )}
            </div>

            {/* MRL-Approved Assets */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-bold tracking-widest uppercase text-violet-400 mb-3">MRL-Approved Assets</p>
              <div className="space-y-2">
                {config.assets.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-violet-400/5 border border-violet-400/10 rounded-xl">
                    <span className="text-violet-400 text-sm flex-shrink-0">📄</span>
                    <div>
                      <p className="text-xs font-semibold text-white">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Practice Information</p>
            {[
              { label: "Address", value: hcp.address },
              { label: "Phone", value: hcp.phone },
              { label: "Email", value: hcp.email },
              { label: "Practice Type", value: hcp.groupPractice ? "Group Practice" : "Solo Practice" },
              { label: "Years in Practice", value: `${hcp.yearsInPractice} years` },
            ].map(row => (
              <div key={row.label}>
                <p className="text-xs text-slate-500">{row.label}</p>
                <p className="text-sm text-white font-medium mt-0.5">{row.value || "—"}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Segmentation Profile</p>
            {[
              { label: "Specialty", value: hcp.specialty },
              { label: "Behavioral Style", value: hcp.style },
              { label: "Patient Volume", value: hcp.patientVolume },
              { label: "DPN Case Mix", value: hcp.dpnCaseMix },
              { label: "Next Visit", value: hcp.nextVisit },
              { label: "Last Visit", value: hcp.lastVisit },
            ].map(row => (
              <div key={row.label}>
                <p className="text-xs text-slate-500">{row.label}</p>
                <p className="text-sm text-white font-medium mt-0.5">{row.value || "—"}</p>
              </div>
            ))}
            <div>
              <p className="text-xs text-slate-500 mb-1">Field Notes</p>
              <p className="text-sm text-slate-300">{hcp.notes || "No notes yet."}</p>
            </div>
          </div>
        </div>
      )}

      {/* VISIT HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {hcp.visits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No visits logged yet.</p>
              <button onClick={() => setShowLog(true)} className="mt-3 px-4 py-2 bg-cyan-400 text-slate-900 text-sm font-bold rounded-xl hover:bg-cyan-300 transition-colors">
                Log First Visit
              </button>
            </div>
          ) : (
            hcp.visits.map((v, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold text-white text-sm">{v.date}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${stageColor(v.stage)}`}>{v.stage}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Visit Outcome</p>
                    <p className="text-sm text-slate-300">{v.outcome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Commitment Secured</p>
                    <p className="text-sm text-emerald-400 font-medium">{v.commitment}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showLog && <LogVisitModal hcp={hcp} onClose={() => setShowLog(false)} onLog={handleLogVisit} />}
    </div>
  );
}
