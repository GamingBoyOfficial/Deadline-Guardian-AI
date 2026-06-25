import { Flame, LayoutDashboard, BrainCircuit, Calendar, BarChart3, Radio, Activity } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  streakDays: number;
  survivalProbability: number;
  onGoHome: () => void;
}

export default function Header({ activeTab, setActiveTab, streakDays, survivalProbability, onGoHome }: HeaderProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Overview & master telemetry" },
    { id: "planner", label: "AI Planner", icon: BrainCircuit, desc: "Timeline mapping & tasks" },
    { id: "schedule", label: "Schedule", icon: Calendar, desc: "Visual timeline execution blocks" },
    { id: "analytics", label: "Analytics", icon: BarChart3, desc: "Focus score & chronotype trend" },
    { id: "simulator", label: "AI Deadline Simulator", icon: Activity, desc: "Predict deadline slips & delays" },
    { id: "panic", label: "Panic Mode", icon: Radio, isSpecial: true, desc: "Emergency priority pruning" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050505]/95 backdrop-blur-md border-b border-slate-900/80 px-4 py-3 md:py-4 transition-all duration-300 overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-6">
        
        {/* Left Side: Clickable Logo/Home Button */}
        <div 
          onClick={onGoHome}
          className="flex flex-col select-none shrink-0"
        >
          <span className="font-mono font-black text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors">
            🛡️ DEADLINE GUARDIAN
          </span>
          <span className="text-[9px] text-slate-500 font-mono">
            ← Home
          </span>
        </div>

        {/* Center: Primary KPI: Survival Probability (Hidden on mobile to save space) */}
        <div className="hidden sm:flex items-center gap-2 select-none shrink-0">
          <div className={`flex items-center gap-1.5 md:gap-2 border px-2.5 py-1.5 md:px-3.5 md:py-1.5 rounded-lg md:rounded-xl shadow-lg transition-all duration-300 ${
            survivalProbability >= 70
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 shadow-emerald-950/10"
              : survivalProbability >= 40
                ? "border-amber-500/30 bg-amber-500/5 text-amber-400 shadow-amber-950/10"
                : "border-rose-500/40 bg-rose-500/5 text-rose-400 shadow-rose-950/15 animate-pulse"
          }`}>
            <Activity className={`h-3.5 w-3.5 md:h-4.5 md:w-4.5 ${survivalProbability < 40 ? "animate-bounce" : ""}`} />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest opacity-60 hidden xs:inline">
                STATUS rating
              </span>
              <span className="text-[10px] sm:text-xs md:text-sm font-black font-sans tracking-tight">
                {survivalProbability}% {survivalProbability >= 70 ? "SAFE" : survivalProbability >= 40 ? "AT RISK" : "CRITICAL"}
              </span>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-1 border border-amber-500/20 bg-amber-500/5 px-2 py-1 md:px-2.5 md:py-1.5 text-amber-400 font-mono text-[9px] md:text-xs font-bold rounded-lg shadow-sm">
            <Flame className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-500 fill-amber-500" />
            <span>{streakDays}D</span>
          </div>
        </div>

        {/* Right Side: Horizontal Navigation Tab Container */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide w-full pb-1" style={{ scrollbarWidth: "none" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 min-w-fit min-h-[40px] flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-sans font-extrabold transition-all duration-200 cursor-pointer select-none focus:outline-none ${
                  isActive
                    ? tab.isSpecial
                      ? "border-rose-500 bg-rose-950/20 text-rose-400 shadow-md shadow-rose-950/10"
                      : "border-cyan-500 bg-cyan-950/25 text-cyan-400 shadow-md shadow-cyan-950/10"
                    : tab.isSpecial
                      ? "border-rose-950/40 bg-rose-950/10 text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${tab.isSpecial && isActive ? "animate-pulse text-rose-500" : "text-current"}`} />
                <span className="hidden sm:inline">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
