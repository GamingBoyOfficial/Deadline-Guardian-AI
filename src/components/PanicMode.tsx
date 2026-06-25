import { Radio, AlertTriangle, Timer, ShieldAlert, CheckCircle2, Square, CheckSquare, Zap, Play, LogOut, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, FormEvent, useMemo } from "react";
import { DeadlineGoal, Task } from "../types";
import { apiPanicMode } from "../services/api";

interface PanicModeProps {
  goals: DeadlineGoal[];
  onToggleTask: (goalId: string, taskId: string) => void;
  onActivatePanicMode: (goalId: string, panicTasks: Task[], emergencyStrategy: string) => void;
  onExitPanicMode: (goalId: string) => void;
}

export default function PanicMode({
  goals,
  onToggleTask,
  onActivatePanicMode,
  onExitPanicMode
}: PanicModeProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || "");
  const [panicHours, setPanicHours] = useState<number>(8);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Time-ticking clock state for countdown simulation
  const [timeText, setTimeText] = useState("08:00:00");

  const activeGoal = goals.find((g) => g.id === selectedGoalId) || goals[0];

  const [emergencyStrategyText, setEmergencyStrategyText] = useState<string>("");

  useEffect(() => {
    setEmergencyStrategyText("");
  }, [selectedGoalId]);

  const planStartTime = useMemo(() => {
    return new Date();
  }, [activeGoal?.id, activeGoal?.isPanicModeActive]);

  const crisisMetrics = useMemo(() => {
    if (!activeGoal) return { tasksPruned: 0, timeSavedMinutes: 0, isCriticalPathProtected: false };
    
    const tasksPruned = activeGoal.tasks.length - (activeGoal.panicModeTasks?.length || activeGoal.tasks.length);
    
    let timeSavedMinutes = 0;
    if (activeGoal.panicModeTasks) {
      activeGoal.panicModeTasks.forEach(pt => {
        const original = activeGoal.tasks.find(t => t.id === pt.id || t.title === pt.title);
        if (original) {
          timeSavedMinutes += Math.max(0, original.estimatedMinutes - pt.estimatedMinutes);
        }
      });
    }

    const originalCriticalTasks = activeGoal.tasks.filter(t => t.isCriticalPath);
    const isCriticalPathProtected = originalCriticalTasks.length > 0 && originalCriticalTasks.every(oct => 
      activeGoal.panicModeTasks?.some(pmt => pmt.title === oct.title || pmt.id === oct.id)
    );

    return { tasksPruned, timeSavedMinutes, isCriticalPathProtected };
  }, [activeGoal]);

  // Rotate loading steps for emergency sequence
  const loadingSteps = [
    "FILTERING PERIPHERAL TASKS...",
    "ISOLATING HIGHEST-ROI TOPICS...",
    "COMPRESSING DURATION COEFFICIENTS...",
    "GENERATING SURVIVAL PLAYBOOK DIRECTIVES...",
    "LOCKING TERMINAL PROTOCOLS..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Real-time ticking clock simulation inside Panic Mode
  useEffect(() => {
    if (!activeGoal || !activeGoal.isPanicModeActive) return;

    let secondsLeft = panicHours * 3600;
    const timer = setInterval(() => {
      if (secondsLeft <= 0) {
        setTimeText("00:00:00");
        clearInterval(timer);
        return;
      }
      secondsLeft--;
      const h = Math.floor(secondsLeft / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;
      setTimeText(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGoal?.isPanicModeActive, panicHours, activeGoal]);

  async function handleEngagePanic(e: FormEvent) {
    e.preventDefault();
    if (!activeGoal) return;

    setIsLoading(true);
    try {
      const data = await apiPanicMode(activeGoal, panicHours);
      
      // Inject IDs into generated panic tasks
      const formattedPanicTasks: Task[] = data.panicTasks.map((pt, idx) => ({
        id: `${activeGoal.id}-panic-t-${idx + 1}`,
        title: pt.title,
        estimatedMinutes: pt.estimatedMinutes,
        priority: pt.priority as any,
        completed: false,
        isCriticalPath: pt.isCriticalPath,
        order: pt.order
      }));

      setEmergencyStrategyText(data.emergencyStrategy);
      onActivatePanicMode(activeGoal.id, formattedPanicTasks, data.emergencyStrategy);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-rose-950 pb-4">
        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/60 animate-pulse">
          <Radio className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-sans font-black tracking-tight text-white uppercase">Panic Mode Cockpit</h1>
          <p className="text-slate-400 text-xs">Activate emergency algorithms to bypass overwhelm, discard minor metrics, and prioritize pure outcomes.</p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center max-w-xl mx-auto">
          <AlertTriangle className="h-8 w-8 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 font-sans font-semibold mb-1">No crisis targets available</p>
          <p className="text-slate-500 text-xs mb-6">You must decompose a milestone deliverable in the Planner page before you can engage Panic protocols.</p>
        </div>
      ) : (
        <div className="relative">
          
          <AnimatePresence mode="wait">
            
            {/* STATE 1: PANIC MODE NOT ACTIVE -> SETUP SCREEN */}
            {activeGoal && !activeGoal.isPanicModeActive && !isLoading && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
              >
                {/* Configuration side card */}
                <div className="md:col-span-1 glass panic-glow p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
                    <h2 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider">Configure Emergency</h2>
                  </div>

                  <form onSubmit={handleEngagePanic} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Goal in Crisis</label>
                      <select
                        id="panic-goal-select"
                        value={selectedGoalId}
                        onChange={(e) => setSelectedGoalId(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors"
                      >
                        {goals.map((g) => (
                          <option key={g.id} value={g.id}>{g.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Hours Remaining</label>
                      <input
                        id="panic-hours-input"
                        type="number"
                        min={1}
                        max={72}
                        value={panicHours}
                        onChange={(e) => setPanicHours(parseInt(e.target.value) || 8)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors"
                      />
                    </div>

                    <button
                      id="panic-engage-btn"
                      type="submit"
                      className="w-full py-3 rounded-xl bg-rose-600 text-white hover:bg-rose-500 hover:scale-[1.01] active:scale-[0.99] text-xs font-mono font-black tracking-widest shadow-lg shadow-rose-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="h-4 w-4 text-white animate-bounce" />
                      <span>ENGAGE PANIC MODE</span>
                    </button>
                  </form>
                </div>

                {/* Information visual guidelines (2/3 width) */}
                <div className="md:col-span-2 glass panic-glow p-6 space-y-4">
                  <h3 className="font-sans font-black text-white text-base">What happens when you trigger Panic Mode?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Panic Mode is a mathematical execution model designed for high-stress final stretch situations. When triggered, our AI Coach runs a customized pruning pass over your project tasks:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 glass space-y-1.5">
                      <p className="font-sans font-bold text-xs text-rose-400">1. Pruning Low-ROI Tasks</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Secondary study sheets, mock reviews, and fine decorations are filtered out completely. We focus 100% on the core deliverables.</p>
                    </div>
                    <div className="p-4 glass space-y-1.5">
                      <p className="font-sans font-bold text-xs text-rose-400">2. Duration Compression</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Estimates for remaining tasks are compressed by up to 40% using highly focused fast-path execution rules to fit inside the remaining hours.</p>
                    </div>
                    <div className="p-4 glass space-y-1.5">
                      <p className="font-sans font-bold text-xs text-rose-400">3. Real-Time Ticking Clock</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">A high-visibility, persistent physical countdown clock is loaded on your workspace screen to stimulate immediate flow state.</p>
                    </div>
                    <div className="p-4 glass space-y-1.5">
                      <p className="font-sans font-bold text-xs text-rose-400">4. Ruthless Coaching Directive</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">The elite coach issues a direct, unedited tactical operational guide focusing exclusively on hitting the grading rubric markers.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATE 2: LOADING SCREEN */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass panic-glow p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[340px]"
              >
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="animate-ping absolute h-full w-full rounded-full bg-rose-500 opacity-20" />
                  <div className="animate-spin absolute h-12 w-12 rounded-full border-2 border-rose-950 border-t-rose-500" />
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-sans font-extrabold text-white text-sm uppercase tracking-widest">Compiling Rescue Plan</h3>
                  <p className="text-rose-400 font-mono text-xs font-bold uppercase tracking-wider animate-pulse h-5">
                    {loadingSteps[loadingStep]}
                  </p>
                </div>
              </motion.div>
            )}

            {/* STATE 3: PANIC MODE ACTIVE WORKSPACE */}
            {activeGoal && activeGoal.isPanicModeActive && !isLoading && (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Crisis Header with Countdown Clock */}
                <div className="glass panic-glow p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-rose-950/30">
                  {/* Crimson animated scanline overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(244,63,94,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none animate-[pulse_3s_infinite]" />
                  
                  <div className="space-y-2 text-center md:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-400 text-[9px] font-mono font-bold uppercase tracking-widest animate-pulse">
                        <Timer className="h-3.5 w-3.5" />
                        CRISIS EVENT TRIGGERED
                      </div>
                      {crisisMetrics.isCriticalPathProtected && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-widest">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          CRITICAL PATH PROTECTED
                        </div>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-sans font-black text-white">{activeGoal.title}</h2>
                    <p className="text-slate-400 text-xs font-mono">Pruning filter active. All peripheral milestones dropped.</p>
                    
                    {/* Pruned stats indicators */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1.5 text-[11px] font-mono">
                      <div className="bg-slate-950/60 border border-slate-900 px-2.5 py-1 rounded text-slate-300">
                        <span className="text-rose-400 font-bold">TASKS PRUNED:</span> {crisisMetrics.tasksPruned}
                      </div>
                      <div className="bg-slate-950/60 border border-slate-900 px-2.5 py-1 rounded text-slate-300">
                        <span className="text-amber-400 font-bold">TIME SAVED:</span> {crisisMetrics.timeSavedMinutes} MINS
                      </div>
                    </div>
                  </div>

                  {/* Gigantic Countdown Ticker */}
                  <div className="text-center bg-slate-950 border border-rose-900/60 rounded-2xl px-6 py-3 shrink-0 shadow shadow-rose-950/50">
                    <p className="text-[10px] font-mono text-rose-500 font-extrabold uppercase tracking-widest mb-1">Time Remaining</p>
                    <p className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white">{timeText}</p>
                  </div>
                </div>

                {/* Crisis Playbook Coach Quote */}
                <div className="glass panic-glow p-5 text-rose-300 relative">
                  <p className="absolute top-3 right-3 text-[9px] font-mono text-rose-500 font-bold uppercase tracking-widest">TACTICAL PROTOCOL DIRECTIVE</p>
                  <h3 className="text-xs font-sans font-extrabold text-white uppercase tracking-wider mb-2">Execution Strategy</h3>
                  <div className="text-xs space-y-1.5 whitespace-pre-line">
                    {(() => {
                      const strategyToDisplay = emergencyStrategyText || (activeGoal.recommendations[0] || "Execute high ROI nodes immediately. Ignore code decoration. Build minimally robust pathways and submit immediately.");
                      return strategyToDisplay.split("\n").map((line, idx) => {
                        let colorClass = "text-slate-200";
                        const trimmed = line.trim();
                        if (trimmed.startsWith("✂️")) {
                          colorClass = "text-rose-400";
                        } else if (trimmed.startsWith("✅")) {
                          colorClass = "text-emerald-400";
                        } else if (trimmed.startsWith("⚡")) {
                          colorClass = "text-amber-400";
                        } else if (trimmed.startsWith("→")) {
                          colorClass = "text-cyan-300";
                        }
                        return (
                          <div key={idx} className={`${colorClass} leading-relaxed font-sans`}>
                            {line || "\u00A0"}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Ruthless Checklist Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Core tasks column (2/3 width) */}
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider">High ROI Subtasks Checklist</h3>
                    
                    <div className="space-y-2">
                      {(activeGoal.panicModeTasks || activeGoal.tasks).map((task) => (
                        <div
                          key={task.id}
                          onClick={() => onToggleTask(activeGoal.id, task.id)}
                          className={`flex items-center justify-between p-3.5 glass cursor-pointer transition-all duration-300 ${
                            task.completed
                              ? "bg-slate-950/40 border-slate-800/50 text-slate-600 line-through"
                              : "panic-glow text-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {task.completed ? (
                              <CheckSquare className="h-5 w-5 text-rose-500" />
                            ) : (
                              <Square className="h-5 w-5 text-rose-800" />
                            )}
                            <div>
                              <p className="text-xs font-sans font-bold leading-tight">{task.title}</p>
                              <p className="text-[10px] font-mono text-rose-400 mt-1">Compressed Estimate: <span className="font-bold">{task.estimatedMinutes} mins</span></p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-900/50 text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                            HIGH ROI
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Minute-by-Minute Battle Plan */}
                    <div className="mt-6 space-y-3">
                      <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-rose-400 animate-pulse" />
                        MINUTE-BY-MINUTE BATTLE PLAN
                      </h3>

                      <div className="glass p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2.5">
                        {(() => {
                          let currentStart = new Date(planStartTime);
                          const tasksList = activeGoal.panicModeTasks || activeGoal.tasks;
                          
                          const formatTime = (d: Date) => {
                            const hours = String(d.getHours()).padStart(2, "0");
                            const minutes = String(d.getMinutes()).padStart(2, "0");
                            return `${hours}:${minutes}`;
                          };

                          return (
                            <div className="space-y-2 font-mono text-xs">
                              {tasksList.map((task) => {
                                const taskStart = new Date(currentStart);
                                const taskEnd = new Date(currentStart.getTime() + task.estimatedMinutes * 60 * 1000);
                                currentStart = taskEnd;

                                const timeRange = `${formatTime(taskStart)} → ${formatTime(taskEnd)}`;
                                const textColor = task.isCriticalPath ? "text-violet-400 font-bold" : "text-slate-300";
                                const borderColor = task.isCriticalPath ? "border-violet-900/40 bg-violet-950/10" : "border-slate-900 bg-slate-950/20";

                                return (
                                  <div key={`plan-${task.id}`} className={`p-2.5 rounded-lg border ${borderColor} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-500 font-bold">[{timeRange}]</span>
                                      <span className={`${textColor} truncate max-w-md`}>{task.title}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 shrink-0 uppercase">
                                      {task.estimatedMinutes} min
                                    </span>
                                  </div>
                                );
                              })}

                              {/* Submit By Section */}
                              <div className="border-t border-slate-900 pt-3 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                                <span className="font-bold text-rose-500 uppercase tracking-widest">
                                  🚨 SUBMIT BY:
                                </span>
                                <span className="bg-rose-950/30 border border-rose-900/40 text-rose-300 px-2.5 py-0.5 rounded uppercase font-bold">
                                  {(() => {
                                    try {
                                      const d = new Date(activeGoal.targetDateTime);
                                      return d.toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      });
                                    } catch (e) {
                                      return activeGoal.targetDateTime;
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Status tracker column (1/3 width) */}
                  <div className="glass panic-glow p-5 space-y-4 h-fit">
                    <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider">Survival Probability</h3>
                    
                    {/* Simplified progress bar */}
                    {(() => {
                      const tasksList = activeGoal.panicModeTasks || activeGoal.tasks;
                      const completedCount = tasksList.filter(t => t.completed).length;
                      const totalCount = tasksList.length;
                      const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                      // Dynamic survival percentage
                      const survivalProbability = Math.min(100, 35 + Math.round(percent * 0.65));

                      return (
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="text-3xl font-sans font-black text-rose-500">{survivalProbability}%</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-1">Efficacy survival multiplier</p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-slate-400">
                              <span>Pruned subtasks finished:</span>
                              <span className="text-rose-400 font-bold">{completedCount}/{totalCount}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Exit trigger button */}
                    <button
                      id="panic-exit-btn"
                      onClick={() => onExitPanicMode(activeGoal.id)}
                      className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-mono text-xs hover:bg-slate-900 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>STAND DOWN PROTOCOLS</span>
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
