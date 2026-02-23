import { useState } from "react";
import { useApp } from "../App";
import { INITIAL_HCPS, JOURNEY_STAGES } from "../data";

const stageColor = (stage) => ({
  Awareness: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Education: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  Consideration: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  Adoption: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
}[stage] || "text-slate-400 bg-slate-400/10 border-slate-700");

const specialtyColor = (s) => ({
  Podiatrist: "text-violet-400 bg-violet-400/10",
  PCP: "text-cyan-400 bg-cyan-400/10",
  Endocrinologist: "text-amber-400 bg-amber-400/10",
}[s] || "text-slate-400 bg-slate-400/10");

const SPECIALTIES = ["All", "Podiatrist", "PCP", "Endocrinologist"];
const STYLES = ["Evidence-Driven", "Relationship-Driven", "Efficiency-Focused", "Peer-Influenced"];

// ─── HCP LOOKUP MODAL ─────────────────────────────────────────────────────────
// Lets reps search for a real HCP on the web before adding them to the system.
// The AI does a web search and pre-fills known info (practice, address, specialty).
function HCPLookupModal({ onClose, onFoundHcp }) {
  const [searchName, setSearchName] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setSearching(true);
    setError("");
    setResult(null);

    const query = `${searchName.trim()} ${searchCity.trim()} physician doctor podiatrist NPI practice address specialty`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You are a medical directory research assistant. When given a physician name and location, 
search the web to find their practice name, address, phone, specialty, and any other publicly available 
professional information. Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "name": "Dr. Full Name",
  "specialty": "Podiatrist|PCP|Endocrinologist|Other",
  "practice": "Practice Name",
  "address": "Full address",
  "phone": "Phone number or empty string",
  "email": "",
  "yearsInPractice": 0,
  "groupPractice": false,
  "notes": "Any useful professional context found",
  "sourceUrl": "URL where info was found"
}
If you cannot find the physician, return: {"notFound": true}`,
          messages: [{
            role: "user",
            content: `Search for this physician: "${searchName.trim()}"${searchCity ? ` in ${searchCity.trim()}` : ""}. Find their practice details.`,
          }],
        }),
      });

      const data = await response.json();
      // Extract text from content blocks (web search may return multiple blocks)
      const textContent = data.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text)
        .join(" ") || "";

      // Try to parse JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.notFound) {
          setError("Physician not found in public directories. You can still add them manually below.");
          setResult({ name: `Dr. ${searchName}`, specialty: "Podiatrist", practice: "", address: "", phone: "", email: "", yearsInPractice: 0, groupPractice: false, notes: "" });
        } else {
          setResult(parsed);
        }
      } else {
        // Fallback: partial info
        setResult({ name: `Dr. ${searchName}`, specialty: "Podiatrist", practice: "", address: searchCity || "", phone: "", email: "", yearsInPractice: 0, groupPractice: false, notes: "Could not retrieve full profile — please complete manually." });
      }
    } catch {
      setError("Search unavailable. You can add this HCP manually.");
      setResult({ name: `Dr. ${searchName}`, specialty: "Podiatrist", practice: "", address: "", phone: "", email: "", yearsInPractice: 0, groupPractice: false, notes: "" });
    }
    setSearching(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Look Up HCP</h2>
            <p className="text-xs text-slate-400 mt-0.5">Search public directories to pre-fill their profile</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Search fields */}
          <div className="flex gap-3">
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Dr. First Last..."
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <input
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="City, State (optional)"
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={!searchName.trim() || searching}
            className="w-full py-2.5 bg-cyan-400 text-slate-900 font-bold rounded-xl hover:bg-cyan-300 disabled:opacity-40 transition-colors text-sm"
          >
            {searching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Searching public directories...
              </span>
            ) : "🔍 Search"}
          </button>

          {error && (
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-xs text-amber-400">
              {error}
            </div>
          )}

          {/* Search result preview */}
          {result && !searching && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Found Profile</p>
                  {result.sourceUrl && (
                    <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
                      View source ↗
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ["Name", result.name],
                    ["Specialty", result.specialty],
                    ["Practice", result.practice || "—"],
                    ["Address", result.address || "—"],
                    ["Phone", result.phone || "—"],
                    ["Group Practice", result.groupPractice ? "Yes" : "No"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-slate-500">{label}</p>
                      <p className="text-white font-medium">{val}</p>
                    </div>
                  ))}
                </div>
                {result.notes && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Public Profile Notes</p>
                    <p className="text-xs text-slate-300">{result.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onFoundHcp(result)}
                  className="flex-1 py-2.5 bg-emerald-400 text-slate-900 font-bold rounded-xl hover:bg-emerald-300 transition-colors text-sm"
                >
                  Use This Profile →
                </button>
                <button
                  onClick={() => onFoundHcp({})}
                  className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-xl hover:border-slate-500 transition-colors text-sm"
                >
                  Add Manually Instead
                </button>
              </div>
            </div>
          )}

          {/* First-time, no search yet */}
          {!result && !searching && !error && (
            <button
              onClick={() => onFoundHcp({})}
              className="w-full py-2.5 border border-slate-700 text-slate-400 rounded-xl hover:border-slate-500 hover:text-slate-300 transition-colors text-sm"
            >
              Skip search — add manually
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADD HCP FORM MODAL ───────────────────────────────────────────────────────
function AddHCPModal({ prefill, onClose, onAdd }) {
  const [form, setForm] = useState({
    name: prefill?.name || "",
    specialty: prefill?.specialty || "Podiatrist",
    practice: prefill?.practice || "",
    address: prefill?.address || "",
    phone: prefill?.phone || "",
    email: prefill?.email || "",
    style: "Evidence-Driven",
    patientVolume: "Medium",
    dpnCaseMix: "Medium",
    yearsInPractice: prefill?.yearsInPractice || "",
    groupPractice: prefill?.groupPractice || false,
    notes: prefill?.notes || "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...form,
      id: Date.now(),
      stage: "Awareness",
      currentlyReferring: false,
      yearsInPractice: parseInt(form.yearsInPractice) || 0,
      lastVisit: "—",
      nextVisit: "—",
      objections: [],
      visits: [],
      tacId: 1,
    });
  };

  const field = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors";
  const label = "block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1.5";

  // Highlight prefilled fields
  const preFilled = (key) => prefill?.[key] ? "border-cyan-400/40 bg-cyan-400/5" : "";

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="font-bold text-white text-lg">Add New HCP</h2>
            {Object.keys(prefill || {}).length > 0 && (
              <p className="text-xs text-cyan-400 mt-0.5">✓ Pre-filled from web search — review and confirm</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={label}>Full Name</label>
              <input className={`${field} ${preFilled("name")}`} placeholder="Dr. First Last" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div>
              <label className={label}>Specialty</label>
              <select className={`${field} ${preFilled("specialty")}`} value={form.specialty} onChange={(e) => set("specialty", e.target.value)}>
                {["Podiatrist", "PCP", "Endocrinologist"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Behavioral Style</label>
              <select className={field} value={form.style} onChange={(e) => set("style", e.target.value)}>
                {STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={label}>Practice Name</label>
              <input className={`${field} ${preFilled("practice")}`} placeholder="Practice name" value={form.practice} onChange={(e) => set("practice", e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className={label}>Address</label>
              <input className={`${field} ${preFilled("address")}`} placeholder="123 Main St, City, State ZIP" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input className={`${field} ${preFilled("phone")}`} placeholder="(xxx) xxx-xxxx" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input className={field} type="email" placeholder="dr@practice.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className={label}>Patient Volume</label>
              <select className={field} value={form.patientVolume} onChange={(e) => set("patientVolume", e.target.value)}>
                {["Low", "Medium", "High", "Very High"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>DPN Case Mix</label>
              <select className={field} value={form.dpnCaseMix} onChange={(e) => set("dpnCaseMix", e.target.value)}>
                {["Low", "Medium", "High", "Very High"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Years in Practice</label>
              <input className={`${field} ${preFilled("yearsInPractice")}`} type="number" min="0" placeholder="e.g. 12" value={form.yearsInPractice} onChange={(e) => set("yearsInPractice", e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="group" checked={form.groupPractice} onChange={(e) => set("groupPractice", e.target.checked)} className="w-4 h-4 accent-cyan-400" />
              <label htmlFor="group" className="text-sm text-slate-300">Group Practice</label>
            </div>
            <div className="col-span-2">
              <label className={label}>Notes</label>
              <textarea className={`${field} h-20 resize-none ${preFilled("notes")}`} placeholder="First impressions, context, opportunities..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-700 text-slate-300 rounded-xl hover:border-slate-500 transition-colors text-sm font-medium">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-cyan-400 text-slate-900 font-bold rounded-xl hover:bg-cyan-300 transition-colors text-sm">Add HCP →</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function HCPDirectory() {
  const { navigateTo } = useApp();
  const [allHcps, setAllHcps] = useState(INITIAL_HCPS);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  // Modal flow: lookup → prefill form
  const [showLookup, setShowLookup] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [prefillData, setPrefillData] = useState({});

  const handleFoundHcp = (data) => {
    setPrefillData(data || {});
    setShowLookup(false);
    setShowAddForm(true);
  };

  const handleAdd = (newHcp) => {
    setAllHcps((prev) => [...prev, newHcp]);
    setShowAddForm(false);
    setPrefillData({});
  };

  const hcps = allHcps.filter((h) => {
    const matchSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.practice.toLowerCase().includes(search.toLowerCase());
    const matchSpec = specFilter === "All" || h.specialty === specFilter;
    const matchStage = stageFilter === "All" || h.stage === stageFilter;
    return matchSearch && matchSpec && matchStage;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">HCP Directory</h1>
          <p className="text-sm text-slate-400 mt-0.5">{hcps.length} healthcare providers</p>
        </div>
        <button
          onClick={() => setShowLookup(true)}
          className="px-4 py-2.5 bg-cyan-400 text-slate-900 text-sm font-bold rounded-xl hover:bg-cyan-300 transition-colors flex items-center gap-2"
        >
          🔍 Find & Add HCP
        </button>
      </div>

      {/* Search tip */}
      <div className="flex items-start gap-2 p-3 bg-cyan-400/5 border border-cyan-400/15 rounded-xl">
        <span className="text-cyan-400 text-sm flex-shrink-0">💡</span>
        <p className="text-xs text-slate-400">
          Don't see an HCP? Use <span className="text-cyan-400 font-semibold">Find & Add HCP</span> to search public medical directories — we'll pre-fill their profile from the web.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or practice..."
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((f) => (
            <button key={f} onClick={() => setSpecFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                ${specFilter === f ? "border-cyan-400 text-cyan-400 bg-cyan-400/10" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
              {f}
            </button>
          ))}
          <div className="w-px bg-slate-700 mx-1" />
          {["All Stages", ...JOURNEY_STAGES].map((f) => (
            <button key={f} onClick={() => setStageFilter(f === "All Stages" ? "All" : f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                ${(f === "All Stages" ? "All" : f) === stageFilter ? "border-pink-400 text-pink-400 bg-pink-400/10" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* HCP Grid */}
      {hcps.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-3">No HCPs match your search.</p>
          <button onClick={() => setShowLookup(true)} className="px-5 py-2.5 bg-cyan-400 text-slate-900 text-sm font-bold rounded-xl hover:bg-cyan-300 transition-colors">
            🔍 Search for this HCP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {hcps.map((hcp) => (
            <button
              key={hcp.id}
              onClick={() => navigateTo("hcp-detail", hcp)}
              className="text-left p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-cyan-400/30 transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${specialtyColor(hcp.specialty)}`}>
                  {hcp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white group-hover:text-cyan-400 transition-colors text-sm truncate">{hcp.name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{hcp.practice}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${specialtyColor(hcp.specialty)}`}>{hcp.specialty}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stageColor(hcp.stage)}`}>{hcp.stage}</span>
                    {hcp.currentlyReferring && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Referring ✓</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-800 rounded-lg p-2">
                  <p className="text-xs text-slate-500">Volume</p>
                  <p className="text-xs font-semibold text-white">{hcp.patientVolume}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-2">
                  <p className="text-xs text-slate-500">DPN Mix</p>
                  <p className="text-xs font-semibold text-white">{hcp.dpnCaseMix}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{hcp.notes}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-600">Last: {hcp.lastVisit}</p>
                <p className="text-xs text-slate-500 italic">{hcp.style}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showLookup && (
        <HCPLookupModal
          onClose={() => setShowLookup(false)}
          onFoundHcp={handleFoundHcp}
        />
      )}

      {showAddForm && (
        <AddHCPModal
          prefill={prefillData}
          onClose={() => { setShowAddForm(false); setPrefillData({}); }}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
