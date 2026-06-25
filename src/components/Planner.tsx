import { Brain, Sparkles, AlertTriangle, ShieldCheck, Plus, Trash2, Calendar, ListTodo, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, FormEvent } from "react";
import { DeadlineGoal, Task } from "../types";
import { apiDecompose } from "../services/api";
import VoicePlanner from "./VoicePlanner";

interface PlannerProps {
  onAddGoal: (goal: DeadlineGoal) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function Planner({ onAddGoal, onNavigateToTab }: PlannerProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<'Exam' | 'Assignment' | 'Interview' | 'Project' | 'Contest' | 'Meeting' | 'Personal'>("Assignment");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Decomposed draft state
  const [decomposedDraft, setDecomposedDraft] = useState<{
    title: string;
    category: typeof category;
    targetDateTime: string;
    tasks: Omit<Task, "id" | "completed">[];
    completionProbability: number;
    riskLevel: 'Safe' | 'Moderate Risk' | 'High Risk';
    recommendations: string[];
  } | null>(null);

  // Rotating status message inside loading sequence
  const loadingSteps = [
    "Establishing neural telemetry...",
    "Estimating mathematical task weights...",
    "Formulating strategic critical execution path...",
    "Calibrating cognitive strain benchmarks...",
    "Polishing tactical survival playbook..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Set default due date to 2 days from now at midnight
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDueDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  async function handleDecompose(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setIsLoading(true);
    setDecomposedDraft(null);

    const targetDateTime = `${dueDate}T${dueTime}:00`;

    try {
      const data = await apiDecompose(title, category, targetDateTime);
      setDecomposedDraft({
        title,
        category,
        targetDateTime,
        tasks: data.tasks,
        completionProbability: data.completionProbability,
        riskLevel: data.riskLevel,
        recommendations: data.recommendations
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSaveDecomposed() {
    if (!decomposedDraft) return;

    const goalId = `${decomposedDraft.category.toLowerCase()}-${Date.now()}`;
    const formattedTasks: Task[] = decomposedDraft.tasks.map((task, index) => ({
      ...task,
      id: `${goalId}-t-${index + 1}`,
      completed: false
    }));

    const finalGoal: DeadlineGoal = {
      id: goalId,
      title: decomposedDraft.title,
      category: decomposedDraft.category,
      targetDateTime: decomposedDraft.targetDateTime,
      tasks: formattedTasks,
      riskLevel: decomposedDraft.riskLevel,
      completionProbability: decomposedDraft.completionProbability,
      recommendations: decomposedDraft.recommendations,
      isPanicModeActive: false
    };

    onAddGoal(finalGoal);
    setDecomposedDraft(null);
    setTitle("");
    onNavigateToTab("dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/60">
          <Brain className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-sans font-black tracking-tight text-white">AI Milestone Decomposition</h1>
          <p className="text-slate-400 text-xs">Transform high-pressure deadlines into highly precise, sequential execution plans.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Input Form Column (1/3) */}
        <div className="md:col-span-1 glass accent-glow p-5 space-y-4">
          <h2 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider">Configure Milestone</h2>
          
          <VoicePlanner onGoalParsed={(parsed) => {
            if (parsed.title) setTitle(parsed.title);
            if (parsed.category) setCategory(parsed.category);
            if (parsed.targetDateTime) {
              const parts = parsed.targetDateTime.split("T");
              if (parts[0]) setDueDate(parts[0]);
              if (parts[1]) setDueTime(parts[1].substring(0, 5));
            }
          }} />

          <form onSubmit={handleDecompose} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Milestone Title</label>
              <input
                id="planner-title-input"
                type="text"
                placeholder="e.g. Machine Learning homework, Compiler Exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
              <select
                id="planner-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-colors"
              >
                {["Assignment", "Exam", "Interview", "Project", "Contest", "Meeting", "Personal"].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Target Date</label>
                <input
                  id="planner-date-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-2 py-2.5 text-[11px] text-slate-200 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Time (24h)</label>
                <input
                  id="planner-time-input"
                  type="text"
                  placeholder="23:59"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-2 py-2.5 text-[11px] text-slate-200 outline-none transition-colors text-center"
                />
              </div>
            </div>

            <button
              id="planner-submit-btn"
              type="submit"
              disabled={isLoading || !title.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:scale-[1.01] text-white text-xs font-sans font-bold tracking-wide shadow-lg shadow-cyan-500/15 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>DECOMPOSE TARGET</span>
            </button>
          </form>
        </div>

        {/* Right Output Dashboard (2/3) */}
        <div className="md:col-span-2 min-h-[380px] glass accent-glow relative overflow-hidden p-6 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* STATE 1: LOADING */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-10 space-y-6"
              >
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="animate-spin absolute h-full w-full rounded-full border-4 border-slate-800 border-t-cyan-500" />
                  <Brain className="h-7 w-7 text-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-white text-sm">Drafting Micro-Milestones</h3>
                  <p className="text-cyan-400 font-mono text-[11px] uppercase tracking-wider h-5 transition-all duration-500">
                    {loadingSteps[loadingStep]}
                  </p>
                </div>
              </motion.div>
            )}

            {/* STATE 2: EMPTY STATE */}
            {!isLoading && !decomposedDraft && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="my-auto text-center py-12 space-y-4"
              >
                <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <ListTodo className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-slate-300 font-sans font-bold">Execution Plan Generator</p>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1">Configure your deadline details on the left and trigger decomposition to see the AI compile strategic task segments.</p>
                </div>
              </motion.div>
            )}

            {/* STATE 3: REVEAL DECOMPOSED DRAFT */}
            {!isLoading && decomposedDraft && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 w-full"
              >
                {/* Decompose header summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="px-2 py-0.5 rounded border border-cyan-800 text-[9px] font-mono text-cyan-400 uppercase tracking-widest">
                      {decomposedDraft.category}
                    </span>
                    <h3 className="text-base font-sans font-bold text-white mt-1.5">{decomposedDraft.title}</h3>
                  </div>
                  <div className="flex gap-3 text-right">
                    <div className="glass px-3 py-1.5">
                      <p className="text-[10px] font-mono text-slate-500">RISK</p>
                      <p className={`text-xs font-sans font-black ${decomposedDraft.riskLevel === 'Safe' ? 'text-emerald-400' : decomposedDraft.riskLevel === 'Moderate Risk' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {decomposedDraft.riskLevel}
                      </p>
                    </div>
                    <div className="glass px-3 py-1.5">
                      <p className="text-[10px] font-mono text-slate-500">PROBABILITY</p>
                      <p className="text-xs font-sans font-black text-cyan-400">{decomposedDraft.completionProbability}%</p>
                    </div>
                  </div>
                </div>

                {/* Subtasks checklist visualization */}
                <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Calculated Subtasks Queue</h4>
                  {decomposedDraft.tasks.map((task) => {
                    const durationText = task.estimatedHours ? `${task.estimatedHours}h` : `${(task.estimatedMinutes / 60).toFixed(1)}h`;
                    const riskColors = {
                      Low: "text-emerald-400 border-emerald-950 bg-emerald-950/20",
                      Medium: "text-amber-400 border-amber-950 bg-amber-950/20",
                      High: "text-orange-400 border-orange-950 bg-orange-950/20",
                      Critical: "text-rose-400 border-rose-950 bg-rose-950/20 animate-pulse"
                    };
                    const taskRisk = task.riskLevel || (task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low');
                    const riskStyle = riskColors[taskRisk] || riskColors.Low;

                    return (
                      <div
                        key={task.order}
                        className={`flex flex-col gap-2.5 glass p-4 text-xs hover:border-cyan-500/30 transition-all duration-300 ${task.isCriticalPath ? "border-rose-500/20 bg-rose-950/5 animate-pulse" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 items-center justify-center font-bold">
                              {task.order}
                            </span>
                            <p className="text-slate-100 font-sans font-extrabold text-[13px] leading-snug">{task.title}</p>
                          </div>
                          {task.isCriticalPath && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/50 text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                              Critical Path
                            </span>
                          )}
                        </div>

                        {/* Task Metadata row */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded border border-slate-800 bg-slate-900/60 text-slate-300">
                            Duration: <strong>{durationText}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded border ${riskStyle}`}>
                            Risk: <strong>{taskRisk}</strong>
                          </span>
                          {task.dependencyTitle && (
                            <span className="px-2 py-0.5 rounded border border-cyan-950/50 bg-cyan-950/10 text-cyan-400">
                              Depends on: <strong>{task.dependencyTitle}</strong>
                            </span>
                          )}
                        </div>

                        {/* Impact if skipped statement */}
                        {task.impactIfSkipped && (
                          <div className="border-t border-slate-900 pt-2 text-[11px] leading-relaxed text-slate-400">
                            <span className="text-rose-400/80 font-bold uppercase text-[9px] tracking-wider font-mono block">Impact if Skipped:</span>
                            <p className="italic text-slate-300 mt-0.5">"{task.impactIfSkipped}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                 {/* Tactical recommendations board / Strategic Causal Risk Diagnostic */}
                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    Strategic Causal Risk Diagnostic
                  </h4>
                  
                  <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2.5 text-xs leading-relaxed">
                    <div>
                      <strong className="text-white font-mono text-[9px] tracking-wider block mb-0.5">⚠️ WHAT IS AT RISK</strong>
                      <p className="text-slate-300">
                        Milestone completion for "{decomposedDraft.title}" and the critical execution path of its {decomposedDraft.tasks.filter(t => t.isCriticalPath).length} critical steps.
                      </p>
                    </div>
                    <div className="border-t border-slate-900/50 pt-2">
                      <strong className="text-white font-mono text-[9px] tracking-wider block mb-0.5">🔍 WHY IT IS AT RISK</strong>
                      <p className="text-slate-300">
                        Decomposed draft requires {((decomposedDraft.tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0)) / 60).toFixed(1)} hours of concentrated workload. A prediction probability rating of {decomposedDraft.completionProbability}% indicates tight schedule friction.
                      </p>
                    </div>
                    <div className="border-t border-slate-900/50 pt-2">
                      <strong className="text-white font-mono text-[9px] tracking-wider block mb-0.5">📉 DOWNSTREAM CONSEQUENCE</strong>
                      <p className="text-slate-300">
                        {decomposedDraft.category === "Exam" || decomposedDraft.category === "Contest"
                          ? "Failure to solve and verify recursive formula boundaries on paper will trigger fatal logic compile errors on live tests."
                          : "Skipping JWT validation or DB schemas will block frontend routes, halting the integration flow."}
                      </p>
                    </div>
                    <div className="border-t border-slate-900/50 pt-2">
                      <strong className="text-white font-mono text-[9px] tracking-wider block mb-0.5">🛡️ RECOVERY ACTION</strong>
                      <p className="text-cyan-400 font-semibold">
                        Lock in focus sessions early, isolate "{decomposedDraft.tasks[0]?.title || "the first phase"}", and ensure zero multi-tasking during active sprint blocks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Saving action button */}
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setDecomposedDraft(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition-colors"
                  >
                    RESET
                  </button>
                  <button
                    onClick={handleSaveDecomposed}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-sans font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    SECURE DELIVERABLE SHIELD
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
