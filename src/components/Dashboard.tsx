import { Flame, Clock, Compass, AlertTriangle, CheckCircle2, ChevronRight, Brain, ShieldAlert, Sparkles, Plus, Trash2, Calendar, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DeadlineGoal, ProductivityStats, ProductivityInsight } from "../types";
import { useState, useEffect, useMemo } from "react";

interface DashboardProps {
  goals: DeadlineGoal[];
  stats: ProductivityStats;
  insights: ProductivityInsight[];
  onDeleteGoal: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  onSelectActiveGoal: (goal: DeadlineGoal) => void;
  survivalProbability: number;
  survivalReasoning: string;
  isDemoMode?: boolean;
}

export default function Dashboard({
  goals,
  stats,
  insights,
  onDeleteGoal,
  onNavigateToTab,
  onSelectActiveGoal,
  survivalProbability,
  survivalReasoning,
  isDemoMode = false
}: DashboardProps) {
  const [countdowns, setCountdowns] = useState<{ [id: string]: string }>({});
  const [displayedProbability, setDisplayedProbability] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const [hoveredGoal, setHoveredGoal] = useState<{
    x: number;
    y: number;
    title: string;
    probability: number;
    countdown: string;
    risk: string;
  } | null>(null);

  // Survival probability count-up animation
  useEffect(() => {
    setDisplayedProbability(0);
    const interval = setInterval(() => {
      setDisplayedProbability(prev => {
        if (prev >= survivalProbability) {
          clearInterval(interval);
          return survivalProbability;
        }
        const next = prev + 2;
        if (next >= survivalProbability) {
          clearInterval(interval);
          return survivalProbability;
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [survivalProbability]);

  // Current time clock updater
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setCurrentTimeStr(`${hh}:${mm}:${ss}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sort goals chronologically
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => new Date(a.targetDateTime).getTime() - new Date(b.targetDateTime).getTime());
  }, [goals]);

  // Generate dynamic chart points based on goals
  const chartPoints = useMemo(() => {
    if (sortedGoals.length === 0) {
      return [
        { x: 50, y: 110, title: "No goals loaded", prob: 0, id: "g-none-1" },
        { x: 200, y: 120, title: "No goals loaded", prob: 0, id: "g-none-2" },
        { x: 350, y: 100, title: "No goals loaded", prob: 0, id: "g-none-3" },
        { x: 500, y: 115, title: "No goals loaded", prob: 0, id: "g-none-4" },
        { x: 650, y: 130, title: "No goals loaded", prob: 0, id: "g-none-5" }
      ];
    }
    
    return sortedGoals.map((g, index) => {
      let x = 0;
      if (sortedGoals.length > 1) {
        x = (index / (sortedGoals.length - 1)) * 700;
      } else {
        x = 350;
      }
      const y = 130 - (g.completionProbability / 100 * 110);
      return {
        x,
        y,
        title: g.title,
        prob: g.completionProbability,
        id: g.id
      };
    });
  }, [sortedGoals]);

  // Generate stroke and fill paths using smooth curves
  const strokePathD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    if (chartPoints.length === 1) {
      return `M 10 130 Q 350 ${chartPoints[0].y} 690 130`;
    }
    
    let d = `M 10 130`;
    d += ` L ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const midX = (p0.x + p1.x) / 2;
      d += ` Q ${p0.x} ${p0.y} ${midX} ${(p0.y + p1.y) / 2}`;
    }
    const last = chartPoints[chartPoints.length - 1];
    d += ` Q ${last.x} ${last.y} 690 130`;
    return d;
  }, [chartPoints]);

  const fillPathD = useMemo(() => {
    return `${strokePathD} L 690 130 L 10 130 Z`;
  }, [strokePathD]);

  // Real-time countdown timer updater
  useEffect(() => {
    function updateCountdowns() {
      const updated: { [id: string]: string } = {};
      goals.forEach((goal) => {
        const target = new Date(goal.targetDateTime).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (diff <= 0) {
          updated[goal.id] = "EXPIRED";
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            updated[goal.id] = `${days}d ${hours}h ${minutes}m left`;
          } else if (hours > 0) {
            updated[goal.id] = `${hours}h ${minutes}m left`;
          } else {
            updated[goal.id] = `${minutes}m left`;
          }
        }
      });
      setCountdowns(updated);
    }

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000); // update every minute
    return () => clearInterval(interval);
  }, [goals]);

  // Helper to get category-specific styling
  function getCategoryColor(category: string) {
    switch (category) {
      case "Exam": return "text-amber-400 bg-amber-950/30 border-amber-800/50";
      case "Assignment": return "text-cyan-400 bg-cyan-950/30 border-cyan-800/50";
      case "Interview": return "text-emerald-400 bg-emerald-950/30 border-emerald-800/50";
      case "Project": return "text-violet-400 bg-violet-950/30 border-violet-800/50";
      case "Contest": return "text-rose-400 bg-rose-950/30 border-rose-800/50";
      default: return "text-slate-300 bg-slate-900/30 border-slate-800/50";
    }
  }

  // Helper to get risk badge styling
  function getRiskBadge(risk: 'Safe' | 'Moderate Risk' | 'High Risk') {
    switch (risk) {
      case 'Safe':
        return {
          text: "Safe",
          classes: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
          glow: "bg-emerald-500/20"
        };
      case 'Moderate Risk':
        return {
          text: "Moderate Risk",
          classes: "text-amber-400 bg-amber-950/40 border-amber-800/60",
          glow: "bg-amber-500/20"
        };
      case 'High Risk':
        return {
          text: "High Risk",
          classes: "text-rose-400 bg-rose-950/40 border-rose-800/60 animate-pulse",
          glow: "bg-rose-500/30"
        };
    }
  }

  return (
    <div className="space-y-8 py-4">
      
      {/* MASTER SYSTEM KPI: SURVIVAL ANALYTICS ENGINE */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden border rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0c0818] border-slate-800/80 shadow-2xl shadow-cyan-950/5"
      >
        {survivalProbability < 50 && (
          <div className="bg-rose-950/90 border-b border-rose-800/60 text-rose-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
            <span className="font-sans font-extrabold text-xs sm:text-sm tracking-wide">
              ⚠ CRITICAL ALERT: Deadline failure probability exceeds 50%. Autonomous rescue recommended.
            </span>
            <button
              onClick={() => onNavigateToTab("panic")}
              className="px-4 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-400 font-sans font-black text-xs transition-all duration-200 cursor-pointer shadow-md shadow-rose-950/50"
            >
              Engage Panic Mode →
            </button>
          </div>
        )}

        <div className="p-6">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-violet-500/5 blur-[80px] pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Circular Speed Gauge */}
            <div className="md:col-span-3 flex flex-col items-center justify-center text-center">
              <div className={`relative h-28 w-28 flex items-center justify-center rounded-full transition-all duration-300 ${
                isDemoMode ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950" : ""
              }`}>
                {/* SVG Background Ring */}
                <svg className="absolute transform -rotate-90 w-full h-full">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    strokeWidth="8"
                    stroke="#1e293b"
                    fill="transparent"
                    className="opacity-40"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    strokeWidth="8"
                    stroke={survivalProbability >= 70 ? "#10b981" : survivalProbability >= 40 ? "#f59e0b" : "#f43f5e"}
                    fill="transparent"
                    strokeDasharray="301.6"
                    strokeDashoffset={301.6 - (301.6 * displayedProbability) / 100}
                    className="transition-all duration-500 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black tracking-tight font-sans text-white">
                    {displayedProbability}%
                  </span>
                  <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${
                    survivalProbability >= 70 ? "text-emerald-400" : survivalProbability >= 40 ? "text-amber-400" : "text-rose-400"
                  }`}>
                    {survivalProbability >= 70 ? "SAFE" : survivalProbability >= 40 ? "AT RISK" : "CRITICAL"}
                  </span>
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-3 uppercase tracking-widest leading-none">Survival Probability</p>
              <p className="font-mono text-[9px] text-slate-600 mt-1 select-none leading-none">
                Recalculated at {currentTimeStr || "--:--:--"}
              </p>
            </div>

          {/* Under the Hood Telemetry Diagnostic */}
          <div className="md:col-span-5 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Timeline Diagnostic Telemetry
                </h3>
              </div>
              <p className="text-slate-200 text-sm font-sans font-medium leading-relaxed">
                {survivalReasoning}
              </p>
            </div>

            {/* Diagnostic metrics breakdown list */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 border-t border-slate-900 pt-3">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${goals.length > 0 ? "bg-cyan-500" : "bg-slate-700"}`} />
                <span>Active Milestones: <strong className="text-slate-200">{goals.length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${stats.overdueCount > 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
                <span>Overdue backlogs: <strong className="text-slate-200">{stats.overdueCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${goals.some(g => g.isPanicModeActive) ? "bg-rose-500" : "bg-slate-700"}`} />
                <span>Panic Shroud: <strong className="text-slate-200">{goals.some(g => g.isPanicModeActive) ? "ACTIVE" : "OFF"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <span>Task Density Rate: <strong className="text-slate-200">{stats.totalTasksCount} tasks</strong></span>
              </div>
            </div>
          </div>

          {/* Tactical Directive Advice Panel */}
          <div className="md:col-span-4 p-4 rounded-xl bg-slate-950/50 border border-slate-900 flex flex-col justify-between h-full space-y-3 max-h-48 sm:max-h-none overflow-y-auto sm:overflow-visible">
            <div className="flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-violet-400" />
              <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">Tactical Coach AI</span>
            </div>
            <p className="text-slate-300 text-xs italic leading-relaxed">
              {survivalProbability >= 85 
                ? "Your cognitive momentum is highly optimized. Protect your buffers by chunking upcoming modules early." 
                : survivalProbability >= 55 
                  ? "Cognitive friction is growing due to overlapping deadlines. Compress secondary items by 20% to regain time reserves." 
                  : "Critical fatigue path detected. Cease all low-ROI actions immediately, run autonomous replanning or engage Panic Mode."}
            </p>
            <button
              onClick={() => onNavigateToTab("schedule")}
              className="mt-2 text-left flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase font-black"
            >
              <span>Verify Schedule Blocks</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
        </div>
      </motion.div>

      {/* 1. AGGREGATED METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Completion Rate", value: `${stats.completionRate}%`, sub: "Global performance threshold", color: "from-cyan-500 to-blue-600", desc: "Completed tasks vs total", icon: CheckCircle2 },
          { label: "Focus Score", value: `${stats.focusScore}/100`, sub: "Calculated cognitive efficacy", color: "from-violet-500 to-indigo-600", desc: "Pace & deep session metrics", icon: Brain },
          { label: "Active Streak", value: `${stats.streakDays} Days`, sub: "Continuous target defense", color: "from-amber-500 to-orange-600", desc: "No missed critical-paths", icon: Flame },
          { label: "Overdue Tasks", value: stats.overdueCount, sub: "Requires immediate attention", color: "from-rose-500 to-red-600", desc: "Unfinished past sessions", icon: AlertTriangle, highlight: stats.overdueCount > 0 }
        ].map((met, idx) => {
          const Icon = met.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`relative overflow-hidden p-5 glass shadow-lg transition-all duration-300 hover:scale-[1.02] ${met.highlight ? "panic-glow border-rose-900/50 bg-rose-950/10 text-rose-300" : "accent-glow hover:border-slate-600/50"}`}
            >
              <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-slate-900/60 border border-slate-800/50 flex items-center justify-center">
                <Icon className={`h-4 w-4 ${met.highlight ? "text-rose-500 animate-bounce" : "text-slate-400"}`} />
              </div>
              <p className="text-slate-400 text-xs font-mono tracking-wider uppercase">{met.label}</p>
              <p className={`text-2xl md:text-3xl font-sans font-black tracking-tight mt-1 bg-clip-text text-transparent bg-gradient-to-r ${met.highlight ? "from-rose-400 to-red-500" : "from-white to-slate-300"}`}>
                {met.value}
              </p>
              <div className="flex flex-col mt-2 gap-0.5 text-slate-500 text-[10px] font-mono">
                <span>{met.sub}</span>
                <span>{met.desc}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. DYNAMIC WORKSPACE BODY: ACTIVE GOALS & RISKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Goals (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-cyan-400 animate-spin" />
              <h2 className="text-xl font-sans font-extrabold text-white">Active Milestone Deliverables</h2>
            </div>
            <button
              onClick={() => onNavigateToTab("planner")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-400 font-mono text-xs hover:bg-cyan-900/40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              DECOMPOSE NEW
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center">
              <Sparkles className="h-8 w-8 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-300 font-sans font-semibold mb-1">No active target milestones</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">Decompose your exams, homework, systems preparation, or goals using our Elite AI Engine to start secure tracking.</p>
              <button
                onClick={() => onNavigateToTab("planner")}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-sans font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                Launch AI Planner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => {
                const risk = getRiskBadge(goal.riskLevel);
                const completedCount = goal.tasks.filter(t => t.completed).length;
                const totalCount = goal.tasks.length;
                const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                
                return (
                  <motion.div
                    key={goal.id}
                    layoutId={`goal-card-${goal.id}`}
                    className={`relative overflow-hidden p-5 glass transition-all duration-300 hover:scale-[1.01] hover:border-cyan-500/40 hover:shadow-lg ${goal.riskLevel === 'High Risk' ? 'panic-glow border-rose-500/30' : 'hover:shadow-cyan-950/15'}`}
                  >
                    {/* Corner category badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-wider uppercase ${getCategoryColor(goal.category)}`}>
                        {goal.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${risk.classes}`}>
                          {risk.text}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteGoal(goal.id);
                          }}
                          className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                          title="Purge goal"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-sans font-bold text-white line-clamp-2 min-h-[40px]">
                      {goal.title}
                    </h3>

                    {/* Countdown and success tracker */}
                    <div className="flex items-center gap-1.5 mt-4 text-slate-400 font-mono text-xs">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-slate-300 font-semibold">{countdowns[goal.id] || "Calculating..."}</span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Task Efficacy: {completedCount}/{totalCount} subtasks</span>
                        <span className="text-cyan-400 font-bold">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0d0d0d] rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Completion Probability Dial */}
                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-violet-400" />
                        <span className="text-[10px] font-mono text-slate-400">Success Probability:</span>
                      </div>
                      <span className={`text-xs font-mono font-extrabold ${goal.completionProbability > 75 ? "text-emerald-400" : goal.completionProbability > 50 ? "text-amber-400" : "text-rose-400"}`}>
                        {goal.completionProbability}%
                      </span>
                    </div>

                    {/* Dynamic Causal Risk Reasoning Assessment */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`h-3.5 w-3.5 ${goal.riskLevel === 'High Risk' ? 'text-rose-500 animate-pulse' : goal.riskLevel === 'Moderate Risk' ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-wider">Causal Risk Diagnostic</span>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 space-y-2 text-[11px] leading-relaxed">
                        <div>
                          <strong className="text-white text-[9px] font-mono tracking-wider block">⚠️ WHAT IS AT RISK</strong>
                          <span className="text-slate-300 block mt-0.5">
                            Milestone delivery for "{goal.title}" and its pending critical tasks (e.g. {goal.tasks.filter(t => !t.completed).map(t => t.title.split(' ').slice(0, 3).join(' ')).slice(0, 1).join(', ') || "final verification"}).
                          </span>
                        </div>
                        <div className="border-t border-slate-900/50 pt-1.5">
                          <strong className="text-white text-[9px] font-mono tracking-wider block">🔍 WHY IT IS AT RISK</strong>
                          <span className="text-slate-300 block mt-0.5">
                            {goal.tasks.filter(t => !t.completed).length} incomplete task blocks with a combined workload of {((goal.tasks.filter(t => !t.completed).reduce((acc, t) => acc + t.estimatedMinutes, 0)) / 60).toFixed(1)} hours are pending before the target deadline.
                          </span>
                        </div>
                        <div className="border-t border-slate-900/50 pt-1.5">
                          <strong className="text-white text-[9px] font-mono tracking-wider block">📉 DOWNSTREAM IMPACT</strong>
                          <span className="text-slate-300 block mt-0.5">
                            {goal.category === "Exam" || goal.category === "Contest"
                              ? "Failing core computational checks will degrade final evaluation accuracy, breaking subsequent milestone sequences."
                              : "Prerequisite blocks will delay subsequent deployments, causing cascading sequence failures."}
                          </span>
                        </div>
                        <div className="border-t border-slate-900/50 pt-1.5">
                          <strong className="text-white text-[9px] font-mono tracking-wider block">🛡️ RECOVERY ACTION</strong>
                          <span className="text-cyan-400 font-semibold block mt-0.5">
                            {goal.isPanicModeActive 
                              ? "Prune peripheral tasks to lowest baseline overhead, and commit to a 20-minute uninterrupted sprint."
                              : "Execute an AI Restructure / Replan to compress tasks by 35% and clear the active critical path."}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action button to execute */}
                    <button
                      onClick={() => {
                        onSelectActiveGoal(goal);
                        onNavigateToTab("schedule");
                      }}
                      className="mt-4 w-full py-2 rounded-xl bg-slate-950/80 hover:bg-cyan-950/30 border border-slate-800 hover:border-cyan-800/50 text-slate-300 hover:text-cyan-400 text-xs font-mono tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>ENTER EXECUTION VIEW</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Insights & Quick Stats (1/3 width) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
            <h2 className="text-xl font-sans font-extrabold text-white">Execution Coach Insights</h2>
          </div>

          <div className="space-y-4">
            {insights.map((ins) => {
              let alertClass = "border-slate-800 bg-slate-900/20 text-slate-400";
              let dotClass = "bg-slate-400";
              
              if (ins.type === "warning") {
                alertClass = "border-rose-950/50 bg-rose-950/10 text-rose-300";
                dotClass = "bg-rose-500";
              } else if (ins.type === "success") {
                alertClass = "border-emerald-950/50 bg-emerald-950/10 text-emerald-300";
                dotClass = "bg-emerald-500";
              } else if (ins.type === "tip") {
                alertClass = "border-cyan-950/50 bg-cyan-950/10 text-cyan-300";
                dotClass = "bg-cyan-500";
              }

              return (
                <div 
                  key={ins.id}
                  className={`glass p-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-slate-500/30 ${alertClass}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${dotClass} animate-pulse`} />
                    <span className="font-sans font-extrabold text-xs tracking-wide text-white uppercase">{ins.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    {ins.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick-risk warning indicator */}
          <div className="p-5 glass panic-glow text-rose-300 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500 animate-bounce" />
              <span className="font-sans font-bold text-xs text-white uppercase">Critical Alert Channel</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              The AI engine anticipates performance depletion within 48 hours. If deadlines overlap or any priority tasks fail their windows, activate <span className="text-rose-400 font-bold">Panic Mode</span> immediately to trim peripheral overhead.
            </p>
            <button
              onClick={() => onNavigateToTab("panic")}
              className="w-full py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono font-bold hover:bg-rose-900 hover:text-white transition-all duration-300 cursor-pointer"
            >
              ENGAGE EMERGENCY PROTOCOLS
            </button>
          </div>
        </div>

      </div>

      {/* 3. DYNAMIC INTERACTIVE RISK PATH VISUALIZER (CUSTOM CHART) */}
      <div className="p-6 glass accent-glow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <h3 className="font-sans font-extrabold text-base text-white">Visual Risk Gradient Timeline</h3>
            </div>
            <p className="text-slate-500 text-xs">Simulated task frequency & schedule congestion curve over the week.</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Normal Capacity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Congested Spillover</span>
            </div>
          </div>
        </div>

        {/* CUSTOM RESPONSIVE SVG TIMELINE PATH */}
        <div className="w-full h-40 relative">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 150">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2="700" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="75" x2="700" y2="75" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="130" x2="700" y2="130" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Dynamic Filled area */}
            <path
              d={fillPathD}
              fill="url(#chartGradient)"
            />

            {/* Glowing dynamic path curve */}
            <path
              d={strokePathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3.5"
              className="filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)]"
            />

            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="80%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Dynamic scatter dots with interactive hover tooltips */}
            {chartPoints.map((pt, idx) => {
              const isHovered = hoveredPointId === pt.id;
              const isReal = pt.id && !pt.id.startsWith("g-none");
              return (
                <g key={pt.id || idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 7 : 5}
                    fill={pt.prob > 75 ? "#10b981" : pt.prob > 45 ? "#6366f1" : "#ef4444"}
                    className={isHovered || (isReal && pt.prob < 50) ? "animate-pulse" : ""}
                    onMouseEnter={(e) => {
                      if (isReal) {
                        setHoveredPointId(pt.id);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const goalObj = sortedGoals.find(g => g.id === pt.id);
                        
                        const tooltipWidth = 192; // w-48 = 192px
                        const tooltipHeight = 90;
                        const padding = 12;

                        // Horizontal: flip to left if too close to right edge
                        const rawX = rect.left + rect.width / 2 - tooltipWidth / 2;
                        const clampedX = Math.min(
                          Math.max(rawX, padding),
                          window.innerWidth - tooltipWidth - padding
                        );

                        // Vertical: flip to below dot if too close to top edge
                        const rawY = rect.top - tooltipHeight - 10;
                        const clampedY = rawY < padding 
                          ? rect.bottom + 10  // show below dot instead
                          : rawY;

                        setHoveredGoal({
                          x: clampedX,
                          y: clampedY,
                          title: pt.title,
                          probability: pt.prob,
                          countdown: countdowns[pt.id] || "Calculating...",
                          risk: goalObj?.riskLevel || "Safe"
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredPointId(null);
                      setHoveredGoal(null);
                    }}
                    style={{ cursor: isReal ? "pointer" : "default" }}
                  />
                </g>
              );
            })}
          </svg>

          <AnimatePresence>
            {hoveredGoal && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl shadow-black/50 w-48 z-50 pointer-events-none text-xs font-mono"
                style={{
                  left: `${hoveredGoal.x}px`,
                  top: `${hoveredGoal.y}px`,
                }}
              >
                <div className="text-white font-bold mb-1.5 truncate">
                  {hoveredGoal.title.split(" ").slice(0, 5).join(" ") + (hoveredGoal.title.split(" ").length > 5 ? "..." : "")}
                </div>
                <div className="space-y-1">
                  <div>
                    <span>Survival: </span>
                    <span className={
                      hoveredGoal.probability > 75 ? "text-emerald-400" : hoveredGoal.probability > 45 ? "text-amber-400" : "text-rose-400"
                    }>
                      {hoveredGoal.probability}%
                    </span>
                  </div>
                  <div>
                    <span>Risk: </span>
                    <span className={
                      hoveredGoal.risk === "High Risk" ? "text-rose-400" : hoveredGoal.risk === "Moderate Risk" ? "text-amber-400" : "text-emerald-400"
                    }>
                      {hoveredGoal.risk}
                    </span>
                  </div>
                  <div className="text-cyan-400">
                    Time left: {hoveredGoal.countdown}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* X axis labels */}
          <div className="flex justify-between mt-2 px-2 font-mono text-[10px] text-slate-500">
            <span>Mon</span>
            <span>Tue (Syllabus Audit)</span>
            <span>Wed (Coding block)</span>
            <span>Thu (Pre-submission pressure)</span>
            <span>Fri (ML submission)</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

    </div>
  );
}
