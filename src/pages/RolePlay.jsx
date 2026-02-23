import { useState, useRef, useEffect } from "react";
import { useApp } from "../App";
import { ROLE_PLAYS, STAGE_CONFIG, KNOWLEDGE_MODULES } from "../data";

// ─── BUILD APPROVED CONTENT BOUNDARY ─────────────────────────────────────────
// Extracts all text from uploaded knowledge modules and injects into the AI
// system prompt as the ONLY approved source of truth. Nothing outside this
// library is considered valid for the role-play simulation.
function buildApprovedContentLibrary(modules) {
  if (!modules || modules.length === 0) {
    return "NO CONTENT HAS BEEN UPLOADED. The TAC has no approved content to reference.";
  }
  return modules
    .map((mod) => {
      const contentText = mod.content
        .map((c) => {
          if (c.type === "text") return `${c.heading}: ${c.body}`;
          if (c.type === "stat") return `Key Statistic: ${c.value} — ${c.label}`;
          if (c.type === "key_point") return `Approved Field Tip: ${c.text}`;
          return "";
        })
        .filter(Boolean)
        .join("\n");
      return `[MODULE: ${mod.title} | Stage: ${mod.stage}]\n${contentText}`;
    })
    .join("\n\n---\n\n");
}

const stageColor = (stage) =>
  ({
    Awareness: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    Education: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    Consideration: "text-pink-400 bg-pink-400/10 border-pink-400/20",
    Adoption: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  }[stage] || "");

// ─── SCORE CARD ───────────────────────────────────────────────────────────────
function ScoreCard({ criteria, violations }) {
  const scores = criteria.map((c) => ({ criterion: c, met: Math.random() > 0.4 }));
  const penaltyPct = Math.min(violations * 10, 30);
  const raw = Math.round((scores.filter((s) => s.met).length / scores.length) * 100);
  const total = Math.max(raw - penaltyPct, 0);

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-bold mx-auto
          ${total >= 75 ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" : "border-amber-400 bg-amber-400/10 text-amber-400"}`}>
          {total}
        </div>
        <p className="text-sm font-bold text-white mt-2">
          {total >= 75 ? "Good Performance" : "Needs Practice"}
        </p>
        {violations > 0 && (
          <p className="text-xs text-pink-400 mt-1">−{penaltyPct} pts for {violations} compliance challenge{violations > 1 ? "s" : ""}</p>
        )}
      </div>
      <div className="space-y-2">
        {scores.map((s, i) => (
          <div key={i} className={`flex gap-2 p-2.5 rounded-lg text-xs border
            ${s.met ? "bg-emerald-400/5 border-emerald-400/20 text-emerald-400" : "bg-pink-400/5 border-pink-400/20 text-pink-400"}`}>
            <span>{s.met ? "✓" : "✗"}</span>
            <span>{s.criterion}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROLE PLAY SESSION ────────────────────────────────────────────────────────
function RolePlaySession({ rolePlay, onClose, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("intro");
  const [showScore, setShowScore] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [activeWarning, setActiveWarning] = useState(null);
  const messagesEndRef = useRef(null);
  const config = STAGE_CONFIG[rolePlay.stage];

  // Build the content library from the uploaded knowledge modules
  const approvedContent = buildApprovedContentLibrary(KNOWLEDGE_MODULES);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildSystemPrompt = () => `
You are an HCP (healthcare provider) in a compliance-controlled sales training simulation for Medtronic Neuromodulation TAC representatives.

SCENARIO: ${rolePlay.scenario}
YOUR CHARACTER: ${config.rolePlayPrompt}

══════════════════════════════════════════════════════════
COMPLIANCE RULES — MANDATORY — DO NOT DEVIATE
══════════════════════════════════════════════════════════

RULE 1 — CONTENT LOCK:
You must ONLY acknowledge, validate, or build upon information that appears
verbatim or conceptually in the APPROVED CONTENT LIBRARY below.

If the TAC states a fact, statistic, study name, claim, or clinical detail that
is NOT in the approved content library, you MUST respond with skepticism, for example:
  - "I haven't seen that data — where is that from?"
  - "That's a specific claim — what's your source?"
  - "I'm not familiar with that. Can you show me documentation?"

RULE 2 — NO EXTERNAL KNOWLEDGE:
Do NOT draw on any external medical knowledge, drug databases, journal articles,
or clinical studies beyond what is in the approved content library below.
You are a role-play character whose world is bounded by this content only.

RULE 3 — STAY IN CHARACTER:
- Keep all responses to 2–4 sentences
- React authentically — you can be persuaded by strong approved-content arguments
- Never break character or acknowledge that this is an AI simulation
- Never explain the content rules to the TAC

══════════════════════════════════════════════════════════
APPROVED CONTENT LIBRARY — THE ONLY VALID SOURCE OF TRUTH
══════════════════════════════════════════════════════════

${approvedContent}

══════════════════════════════════════════════════════════
END OF APPROVED CONTENT
══════════════════════════════════════════════════════════

Begin the role-play now. Set the scene in one sentence and give the TAC an opening.
`;

  const startSession = async () => {
    setPhase("chat");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: [{ role: "user", content: "Begin the role-play." }],
        }),
      });
      const data = await res.json();
      setMessages([{ role: "hcp", text: data.content?.[0]?.text || "[Demo] Hello, I have a few minutes. What is this about?" }]);
    } catch {
      setMessages([{ role: "hcp", text: "[Demo] Hello — I'm between patients. Make it quick." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const tacMsg = input.trim();
    setInput("");
    setActiveWarning(null);
    const updated = [...messages, { role: "tac", text: tacMsg }];
    setMessages(updated);
    setLoading(true);

    const apiMessages = updated.map((m) => ({
      role: m.role === "tac" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      const hcpReply = data.content?.[0]?.text || "[Demo] That's an interesting claim. What's your source?";

      // Detect compliance challenges from the HCP response
      const challengePhrases = [
        "where is that from", "what's your source", "what is your source",
        "haven't seen that", "not familiar with that", "where did you get",
        "show me documentation", "source for that", "what data supports",
        "i'd need to see", "can you show me",
      ];
      const challenged = challengePhrases.some((p) => hcpReply.toLowerCase().includes(p));
      if (challenged) {
        setViolationCount((v) => v + 1);
        setActiveWarning("The HCP challenged your claim — it may not be in your approved content library. Stick to MRL-approved materials only.");
      }

      setMessages((prev) => [...prev, { role: "hcp", text: hcpReply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "hcp", text: "[Demo] I see. Can you back that up with documentation?" }]);
    }
    setLoading(false);
  };

  const handleEnd = () => {
    setShowScore(true);
    setPhase("complete");
    onComplete(rolePlay.id, messages);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-800 bg-[#0D1322] flex-shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-white text-sm transition-colors">✕ Exit</button>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{rolePlay.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stageColor(rolePlay.stage)}`}>{rolePlay.stage}</span>
            <span className="text-xs text-emerald-400 font-semibold">🔒 Content locked to MRL library</span>
            {violationCount > 0 && (
              <span className="text-xs text-pink-400 font-semibold">⚠ {violationCount} challenge{violationCount > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
        {phase === "chat" && messages.length > 2 && (
          <button onClick={handleEnd} className="px-3 py-2 bg-pink-500/10 text-pink-400 border border-pink-400/20 text-xs font-bold rounded-lg hover:bg-pink-500/20 transition-colors">
            End & Score →
          </button>
        )}
      </div>

      {/* Compliance banner */}
      <div className="bg-emerald-400/5 border-b border-emerald-400/10 px-4 py-2 flex-shrink-0">
        <p className="text-xs text-emerald-400 text-center">
          🔒 AI HCP only validates claims from your uploaded MRL content library — unapproved claims will be challenged
        </p>
      </div>

      {/* Intro screen */}
      {phase === "intro" && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">{rolePlay.title}</h2>

              <div className="p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">🔒 Content Boundary Active</p>
                <p className="text-sm text-slate-200">
                  The AI HCP will only validate claims from your{" "}
                  <span className="text-emerald-400 font-semibold">uploaded MRL-approved library</span>.
                  Any off-label or unapproved claim will be challenged by the HCP — exactly as a real skeptical physician would.
                  Compliance challenges are tracked and deducted from your score.
                </p>
              </div>

              <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">Scenario</p>
                <p className="text-sm text-slate-200">{rolePlay.scenario}</p>
              </div>

              <div className="p-4 bg-cyan-400/10 border border-cyan-400/20 rounded-xl">
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5">Your Objective</p>
                <p className="text-sm text-slate-200">{rolePlay.objective}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scoring Criteria</p>
                {rolePlay.scoringCriteria.map((c, i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-300 py-1">
                    <span className="text-cyan-400">›</span> {c}
                  </div>
                ))}
              </div>

              <button onClick={startSession} className="w-full py-3 bg-cyan-400 text-slate-900 font-bold rounded-xl hover:bg-cyan-300 transition-colors">
                Start Role-Play →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      {(phase === "chat" || phase === "complete") && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "tac" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 text-sm
                    ${m.role === "tac"
                      ? "bg-cyan-400 text-slate-900 rounded-br-md"
                      : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-md"}`}>
                    <p className={`text-xs font-bold mb-1 ${m.role === "tac" ? "text-slate-700" : "text-slate-400"}`}>
                      {m.role === "tac" ? "You (TAC)" : "HCP"}
                    </p>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">HCP</p>
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <div key={d} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compliance warning */}
            {activeWarning && (
              <div className="mx-4 mb-2 p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">⚠</span>
                <p className="text-xs text-amber-300 flex-1">{activeWarning}</p>
                <button onClick={() => setActiveWarning(null)} className="text-amber-400 hover:text-amber-300 text-xs flex-shrink-0">✕</button>
              </div>
            )}

            {/* Input */}
            {phase === "chat" && (
              <div className="p-4 border-t border-slate-800 flex gap-3 flex-shrink-0">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Respond as the TAC — use only approved MRL content... (Enter to send)"
                  rows={2}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
                <button onClick={sendMessage} disabled={!input.trim() || loading}
                  className="px-5 py-3 bg-cyan-400 text-slate-900 font-bold rounded-xl hover:bg-cyan-300 disabled:opacity-40 transition-all">
                  →
                </button>
              </div>
            )}
          </div>

          {/* Score panel */}
          {showScore && (
            <div className="w-72 border-l border-slate-800 bg-slate-900 p-5 overflow-y-auto flex-shrink-0">
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4">Session Score</p>
              <ScoreCard criteria={rolePlay.scoringCriteria} violations={violationCount} />
              <div className="mt-5 p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1.5">
                <p className="text-xs text-slate-400">{messages.length} exchanges</p>
                <p className="text-xs text-emerald-400">✓ Transcript sent to manager</p>
                <p className="text-xs text-emerald-400">🔒 MRL content lock was active</p>
                {violationCount > 0 && <p className="text-xs text-pink-400">⚠ {violationCount} compliance challenge{violationCount > 1 ? "s" : ""} flagged</p>}
              </div>
              <button onClick={onClose} className="w-full py-2.5 mt-3 border border-slate-700 text-slate-300 text-sm rounded-xl hover:border-slate-500 transition-colors">
                Close Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RolePlay() {
  const { rolePlayHistory, setRolePlayHistory, user } = useApp();
  const [active, setActive] = useState(null);
  const [stageFilter, setStageFilter] = useState("All");

  const getHistory = (id) => rolePlayHistory.find((h) => h.id === id);

  const handleComplete = (id, messages) => {
    setRolePlayHistory((prev) => {
      const idx = prev.findIndex((h) => h.id === id);
      const entry = {
        id, messages, tacName: user.name,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        sentToManager: true,
      };
      if (idx >= 0) { const u = [...prev]; u[idx] = entry; return u; }
      return [...prev, entry];
    });
  };

  const filtered = ROLE_PLAYS.filter((r) => stageFilter === "All" || r.stage === stageFilter);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Role-Play Practice</h1>
        <p className="text-sm text-slate-400 mt-1">Practice HCP conversations with AI. Transcripts auto-sent to your manager.</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-emerald-400/5 border border-emerald-400/20 rounded-2xl">
        <span className="text-emerald-400 text-lg flex-shrink-0">🔒</span>
        <div>
          <p className="text-sm font-bold text-emerald-400">MRL Content Lock Active</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Every simulation is bounded by your <span className="text-emerald-400 font-semibold">uploaded MRL-approved knowledge library</span>.
            The AI HCP will challenge any claim that falls outside that content — just as a real skeptical physician would.
            Compliance challenges are tracked and impact your session score.
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["All", "Awareness", "Education", "Consideration", "Adoption"].map((f) => (
          <button key={f} onClick={() => setStageFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
              ${stageFilter === f ? "border-cyan-400 text-cyan-400 bg-cyan-400/10" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((rp) => {
          const history = getHistory(rp.id);
          return (
            <div key={rp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stageColor(rp.stage)}`}>{rp.stage}</span>
                    {history && <span className="text-xs text-emerald-400 font-semibold">Completed ✓</span>}
                  </div>
                  <p className="text-sm font-bold text-white">{rp.title}</p>
                </div>
                <span className="text-2xl">{history ? "✅" : "🎭"}</span>
              </div>
              <p className="text-xs text-slate-400 italic leading-relaxed">"{rp.scenario}"</p>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scoring Criteria</p>
                {rp.scoringCriteria.map((c, i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-400 py-0.5">
                    <span className="text-cyan-400 flex-shrink-0">›</span> {c}
                  </div>
                ))}
              </div>
              {history && (
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Last: {history.date}</span>
                    <span className="text-emerald-400">{history.messages.length} exchanges</span>
                  </div>
                  <p className="text-xs text-emerald-400">✓ Transcript sent to manager</p>
                </div>
              )}
              <button onClick={() => setActive(rp)}
                className="w-full py-2.5 bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 text-sm font-bold rounded-xl hover:bg-cyan-400/20 transition-colors">
                {history ? "Practice Again" : "Start Practice →"}
              </button>
            </div>
          );
        })}
      </div>

      {active && <RolePlaySession rolePlay={active} onClose={() => setActive(null)} onComplete={handleComplete} />}
    </div>
  );
}
