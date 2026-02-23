import { useState } from "react";
import { useApp } from "../App";
import { KNOWLEDGE_MODULES } from "../data";

const stageColor = (stage) => ({
  Awareness: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Education: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  Consideration: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  Adoption: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
}[stage] || "");

function QuizModal({ module, onClose, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const q = module.quiz[current];
  const isLast = current === module.quiz.length - 1;

  const handleAnswer = (idx) => {
    if (submitted) return;
    setAnswers(a => ({ ...a, [current]: idx }));
  };

  const handleNext = () => {
    if (!isLast) setCurrent(c => c + 1);
    else setSubmitted(true);
  };

  const score = submitted
    ? Math.round((module.quiz.filter((q, i) => answers[i] === q.correct).length / module.quiz.length) * 100)
    : 0;

  const passed = score >= 70;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white">{module.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {!submitted ? (
          <div className="p-5 space-y-5">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${((current + 1) / module.quiz.length) * 100}%` }} />
              </div>
              <span className="text-xs text-slate-400">{current + 1}/{module.quiz.length}</span>
            </div>

            <p className="text-sm font-semibold text-white leading-relaxed">{q.q}</p>

            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all
                    ${answers[current] === i
                      ? "border-cyan-400 bg-cyan-400/10 text-white"
                      : "border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-800"}`}
                >
                  <span className="font-bold text-slate-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={answers[current] === undefined}
              className="w-full py-3 bg-cyan-400 text-slate-900 font-bold rounded-xl hover:bg-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {isLast ? "Submit Quiz" : "Next Question"}
            </button>
          </div>
        ) : (
          <div className="p-5 text-center space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto border-4
              ${passed ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" : "border-amber-400 bg-amber-400/10 text-amber-400"}`}>
              {score}%
            </div>
            <div>
              <p className="text-lg font-bold text-white">{passed ? "Well Done!" : "Keep Practicing"}</p>
              <p className="text-sm text-slate-400 mt-1">
                {passed ? "You passed this module assessment." : "Review the module and try again. 70% required to pass."}
              </p>
            </div>
            <div className="space-y-2 text-left">
              {module.quiz.map((q, i) => (
                <div key={i} className={`flex gap-2 p-3 rounded-xl text-xs border
                  ${answers[i] === q.correct ? "bg-emerald-400/5 border-emerald-400/20 text-emerald-400" : "bg-pink-400/5 border-pink-400/20 text-pink-400"}`}>
                  <span>{answers[i] === q.correct ? "✓" : "✗"}</span>
                  <span>{q.q}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {passed ? (
                <button onClick={() => onComplete(module.id, score)} className="flex-1 py-3 bg-emerald-400 text-slate-900 font-bold rounded-xl hover:bg-emerald-300 transition-colors text-sm">
                  Mark Complete
                </button>
              ) : (
                <button onClick={() => { setCurrent(0); setAnswers({}); setSubmitted(false); }} className="flex-1 py-3 bg-amber-400 text-slate-900 font-bold rounded-xl hover:bg-amber-300 transition-colors text-sm">
                  Retry Quiz
                </button>
              )}
              <button onClick={onClose} className="flex-1 py-3 border border-slate-700 text-slate-300 rounded-xl hover:border-slate-500 transition-colors text-sm">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleReader({ module, onClose, onQuiz }) {
  const [page, setPage] = useState(0);
  const content = module.content;
  const isLast = page === content.length - 1;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <span className={`text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${stageColor(module.stage)}`}>{module.stage}</span>
            <h2 className="font-bold text-white text-sm mt-1">{module.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Progress */}
          <div className="flex gap-1">
            {content.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= page ? "bg-cyan-400" : "bg-slate-800"}`} />
            ))}
          </div>

          {/* Content */}
          {content[page].type === "text" && (
            <div>
              <h3 className="text-base font-bold text-white mb-2">{content[page].heading}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{content[page].body}</p>
            </div>
          )}
          {content[page].type === "stat" && (
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-cyan-400">{content[page].value}</p>
              <p className="text-sm text-slate-400 mt-2">{content[page].label}</p>
            </div>
          )}
          {content[page].type === "key_point" && (
            <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">💡 Field Tip</p>
              <p className="text-sm text-slate-200 leading-relaxed">{content[page].text}</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 flex gap-3 flex-shrink-0">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm hover:border-slate-500 disabled:opacity-30 transition-all">
            ← Back
          </button>
          {isLast ? (
            <button onClick={onQuiz} className="flex-1 py-2.5 bg-cyan-400 text-slate-900 font-bold rounded-xl hover:bg-cyan-300 transition-colors text-sm">
              Take Knowledge Check →
            </button>
          ) : (
            <button onClick={() => setPage(p => p + 1)} className="flex-1 py-2.5 bg-cyan-400 text-slate-900 font-bold rounded-xl hover:bg-cyan-300 transition-colors text-sm">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeLibrary() {
  const { knowledgeProgress, setKnowledgeProgress } = useApp();
  const [activeModule, setActiveModule] = useState(null);
  const [quizModule, setQuizModule] = useState(null);
  const [stageFilter, setStageFilter] = useState("All");

  const getStatus = (id) => knowledgeProgress[id] || { completed: false, score: null };

  const handleComplete = (id, score) => {
    setKnowledgeProgress(p => ({ ...p, [id]: { completed: true, score } }));
    setQuizModule(null);
  };

  const completed = Object.values(knowledgeProgress).filter(v => v?.completed).length;
  const avgScore = Object.values(knowledgeProgress)
    .filter(v => v?.score)
    .reduce((acc, v, _, arr) => acc + v.score / arr.length, 0);

  const filtered = KNOWLEDGE_MODULES.filter(m =>
    stageFilter === "All" || m.stage === stageFilter
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Knowledge Library</h1>
          <p className="text-sm text-slate-400 mt-1">MRL-approved learning resources. Available anytime — use when you need them.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{completed}<span className="text-slate-600 text-base">/{KNOWLEDGE_MODULES.length}</span></p>
          <p className="text-xs text-slate-400">completed</p>
          {avgScore > 0 && <p className="text-xs text-emerald-400 mt-0.5">Avg score: {Math.round(avgScore)}%</p>}
        </div>
      </div>

      {/* Overall progress */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all"
          style={{ width: `${(completed / KNOWLEDGE_MODULES.length) * 100}%` }} />
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap">
        {["All", "Awareness", "Education", "Consideration", "Adoption"].map(f => (
          <button key={f} onClick={() => setStageFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
              ${stageFilter === f ? "border-cyan-400 text-cyan-400 bg-cyan-400/10" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(mod => {
          const status = getStatus(mod.id);
          return (
            <div key={mod.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${status.completed ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                  {status.completed ? "✓" : mod.id}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white leading-snug">{mod.title}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${stageColor(mod.stage)}`}>{mod.stage}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{mod.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500">⏱ {mod.duration}</span>
                    {status.score && <span className="text-xs text-emerald-400 font-semibold">Score: {status.score}%</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveModule(mod)}
                  className="flex-1 py-2 bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 text-xs font-bold rounded-xl hover:bg-cyan-400/20 transition-colors"
                >
                  {status.completed ? "Review Module" : "Start Module"}
                </button>
                <button
                  onClick={() => setQuizModule(mod)}
                  className="flex-1 py-2 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl hover:border-slate-500 transition-colors"
                >
                  {status.completed ? "Retake Quiz" : "Take Quiz"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeModule && (
        <ModuleReader
          module={activeModule}
          onClose={() => setActiveModule(null)}
          onQuiz={() => { setQuizModule(activeModule); setActiveModule(null); }}
        />
      )}
      {quizModule && (
        <QuizModal
          module={quizModule}
          onClose={() => setQuizModule(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
