import { Calendar, Clock, AlertTriangle, ShieldCheck, CheckSquare, Square, RefreshCw, Sparkles, AlertCircle, Play, Sparkle, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, FormEvent } from "react";
import { DeadlineGoal, Task } from "../types";
import { apiReplan } from "../services/api";

interface ScheduleViewProps {
  goals: DeadlineGoal[];
  onToggleTask: (goalId: string, taskId: string) => void;
  onUpdateGoalAfterReplan: (goalId: string, updatedTasks: Task[], explanation: string, newProb: number, newRisk: 'Safe' | 'Moderate Risk' | 'High Risk') => void;
}

export default function ScheduleView({ goals, onToggleTask, onUpdateGoalAfterReplan }: ScheduleViewProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || "");
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanReason, setReplanReason] = useState("");
  const [coachBubble, setCoachBubble] = useState<string | null>(null);
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);

  // Fallback to update selected goal when goals list changes
  const activeGoal = goals.find((g) => g.id === selectedGoalId) || goals[0];

  async function handleTriggerReplan(e: FormEvent) {
    e.preventDefault();
    if (!activeGoal || !replanReason.trim()) return;

    setIsReplanning(true);
    setCoachBubble(null);

    try {
      const data = await apiReplan(activeGoal, replanReason);
      
      // Update global application state
      onUpdateGoalAfterReplan(
        activeGoal.id,
        data.tasks,
        data.explanation,
        data.completionProbability,
        data.riskLevel
      );

      setCoachBubble(data.explanation);
      setReplanReason("");
      setIsReplanModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplanning(false);
    }
  }

  // Segment tasks into sessions (Morning, Afternoon, Evening) for display
  function getTasksBySession(session: 'morning' | 'afternoon' | 'evening') {
    if (!activeGoal) return [];
    
    // Fallback if tasks don't have explicit sessions assigned: distribute them in order
    return activeGoal.tasks.filter((t, idx) => {
      if (t.assignedSession) return t.assignedSession === session;
      // Chronological distribution
      if (idx % 3 === 0) return session === 'morning';
      if (idx % 3 === 1) return session === 'afternoon';
      return session === 'evening';
    });
  }

  return (
    <div className="space-y-8 py-4">
      {/* Target Selector Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-black tracking-tight text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-400" />
            Active Schedule Terminal
          </h1>
          <p className="text-slate-400 text-xs">Execute subtasks chronologically and balance focus density to secure targets.</p>
        </div>

        {/* Milestone Switcher Dropdown */}
        {goals.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Target:</span>
            <select
              id="schedule-goal-select"
              value={selectedGoalId}
              onChange={(e) => {
                setSelectedGoalId(e.target.value);
                setCoachBubble(null);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center max-w-xl mx-auto">
          <AlertCircle className="h-8 w-8 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 font-sans font-semibold mb-1">Schedule is offline</p>
          <p className="text-slate-500 text-xs mb-6">Decompose an active deliverable target in the Planner page to activate focus sessions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Execution Timelines Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header info card */}
            <div className="p-5 glass accent-glow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                  {activeGoal.category} Timeline
                </span>
                <h2 className="text-base font-sans font-bold text-white mt-1.5">{activeGoal.title}</h2>
              </div>

              {/* Recovery trigger button */}
              <button
                id="schedule-trigger-replan-btn"
                onClick={() => setIsReplanModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 hover:text-white font-mono text-xs font-bold transition-all duration-300 cursor-pointer shadow shadow-indigo-950/50"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                AUTONOMOUS AI REPLAN
              </button>
            </div>

            {/* Coach Speech Bubble (If replan was just performed) */}
            <AnimatePresence>
              {coachBubble && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-5 glass panic-glow text-cyan-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 text-[10px] font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
                    AI COACH RECOVERY ENGINE
                  </div>
                  <h3 className="text-xs font-sans font-extrabold text-white uppercase tracking-wider mb-2">Tactical Restructure Implemented</h3>
                  <p className="text-xs leading-relaxed font-sans opacity-95 whitespace-pre-line pr-12">
                    {coachBubble}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chronological focus sessions display */}
            <div className="space-y-6 relative border-l border-slate-800/80 pl-6 ml-3">
              {[
                { id: 'morning', label: "Morning Session", desc: "08:00 - 12:00 (Peak logic recall)", glow: "border-cyan-500/20" },
                { id: 'afternoon', label: "Afternoon Session", desc: "13:00 - 17:00 (Execution & construction)", glow: "border-indigo-500/20" },
                { id: 'evening', label: "Evening Focus Session", desc: "18:00 - 22:30 (Deep study & iteration blocks)", glow: "border-violet-500/20" }
              ].map((sess) => {
                const sessionTasks = getTasksBySession(sess.id as any);
                return (
                  <div key={sess.id} className="relative space-y-3">
                    {/* Bullet marker node on line */}
                    <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    </div>

                    <div>
                      <h3 className="font-sans font-extrabold text-sm text-white">{sess.label}</h3>
                      <p className="text-slate-500 text-[10px] font-mono">{sess.desc}</p>
                    </div>

                    {sessionTasks.length === 0 ? (
                      <div className="p-4 glass border-dashed text-center text-xs text-slate-500">
                        No tasks allocated to this session block.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        {sessionTasks.map((task) => {
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
                              key={task.id}
                              className={`flex flex-col gap-2 p-4 glass transition-all duration-300 ${
                                task.completed
                                  ? "bg-slate-950/40 border-slate-800/50 text-slate-500 line-through"
                                  : task.isCriticalPath
                                    ? "panic-glow border-rose-500/30 text-slate-200 animate-pulse"
                                    : "hover:border-indigo-500/40 text-slate-200 hover:scale-[1.01]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div 
                                  onClick={() => onToggleTask(activeGoal.id, task.id)}
                                  className="flex items-center gap-3 cursor-pointer select-none flex-1"
                                >
                                  {task.completed ? (
                                    <CheckSquare className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
                                  ) : (
                                    <Square className="h-4.5 w-4.5 text-slate-600 shrink-0" />
                                  )}
                                  <p className="text-xs font-sans font-bold leading-tight">{task.title}</p>
                                </div>

                                {task.isCriticalPath && !task.completed && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-950/30 border border-rose-900/40 text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest shrink-0">
                                    CRITICAL PATH
                                  </span>
                                )}
                              </div>

                              {/* Upgraded Info Matrix Row */}
                              <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono mt-1">
                                <span className="px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/60 text-slate-400">
                                  Est: <strong>{durationText}</strong>
                                </span>
                                <span className={`px-1.5 py-0.5 rounded border ${riskStyle}`}>
                                  Risk: <strong>{taskRisk}</strong>
                                </span>
                                {task.dependencyTitle && (
                                  <span className="px-1.5 py-0.5 rounded border border-cyan-950/40 bg-cyan-950/10 text-cyan-400 max-w-xs truncate" title={task.dependencyTitle}>
                                    Depends: <strong>{task.dependencyTitle}</strong>
                                  </span>
                                )}
                              </div>

                              {/* Impact if skipped */}
                              {task.impactIfSkipped && !task.completed && (
                                <div className="text-[10px] leading-relaxed text-slate-400 mt-1 border-t border-slate-900/50 pt-1.5 italic">
                                  <span className="text-rose-500/70 font-bold font-mono text-[8px] uppercase tracking-wider block">Risk Impact:</span>
                                  "{task.impactIfSkipped}"
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Status Column (1/3) */}
          <div className="space-y-6">
            <div className="p-5 glass accent-glow space-y-4">
              <h3 className="font-sans font-extrabold text-sm text-white uppercase tracking-wider">Timeline Safety Dial</h3>
              
              <div className="text-center py-4 relative">
                {/* SVG Dial */}
                <svg className="w-32 h-32 mx-auto" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="6" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={activeGoal.completionProbability > 75 ? "#10b981" : activeGoal.completionProbability > 50 ? "#f59e0b" : "#f43f5e"}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * activeGoal.completionProbability) / 100}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="55" textAnchor="middle" className="font-sans font-black text-xl" fill="#fff">
                    {activeGoal.completionProbability}%
                  </text>
                </svg>

                <p className="text-[10px] font-mono text-slate-500 mt-2">Predicted completion likelihood score</p>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Threat Status:</span>
                  <span className={`font-bold ${activeGoal.riskLevel === 'Safe' ? 'text-emerald-400' : activeGoal.riskLevel === 'Moderate Risk' ? 'text-amber-400' : 'text-rose-400'}`}>
                    {activeGoal.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Critical Steps Remaining:</span>
                  <span className="text-white font-bold">
                    {activeGoal.tasks.filter(t => t.isCriticalPath && !t.completed).length} items
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed coach list recommendations */}
            <div className="p-5 glass accent-glow space-y-3">
              <h3 className="font-sans font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkle className="h-4 w-4 text-cyan-400" />
                Active Recommendation Matrix
              </h3>
              <div className="space-y-2.5">
                {activeGoal.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-2 text-xs text-slate-400">
                    <span className="text-cyan-400 font-mono font-bold">{idx + 1}.</span>
                    <p className="leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* AI AUTONOMOUS REPLAN MODAL (GLASSMORPHIC BACKDROP) */}
      <AnimatePresence>
        {isReplanModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg p-6 glass panic-glow shadow-2xl relative bg-[#050505]/95"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80">
                  <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-base text-white">AI Schedule Restructuring</h3>
                  <p className="text-slate-400 text-xs">Inform the Elite Coach what occurred. The AI will recalculate estimates and shuffle loads.</p>
                </div>
              </div>

              <form onSubmit={handleTriggerReplan} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Describe Setback / Issue</label>
                  <textarea
                    id="schedule-replan-reason-input"
                    rows={4}
                    placeholder="e.g. 'I oversleep and missed my morning coding session', or 'the debugging took 2 hours longer than planned, and I am exhausted.'"
                    value={replanReason}
                    onChange={(e) => setReplanReason(e.target.value)}
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 outline-none transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReplanModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    id="schedule-replan-submit-btn"
                    type="submit"
                    disabled={isReplanning || !replanReason.trim()}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-sans font-bold text-xs shadow-lg shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    {isReplanning ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        <span>RECALCULATING MATRIX...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>OPTIMIZE SHIFT ACTIONS</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
