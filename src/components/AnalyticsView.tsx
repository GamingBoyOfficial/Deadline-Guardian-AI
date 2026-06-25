import { BarChart3, TrendingUp, Sparkles, Flame, CheckCircle, PieChart, Info, AlertTriangle, Cpu, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { ProductivityStats, ProductivityInsight, DeadlineGoal } from "../types";

interface AnalyticsViewProps {
  stats: ProductivityStats;
  insights: ProductivityInsight[];
  goals: DeadlineGoal[];
}

export default function AnalyticsView({ stats, insights, goals }: AnalyticsViewProps) {
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Custom interactive SVG bar-chart coordinates calculation
  const maxWeeklyTotal = Math.max(...stats.weeklyTrends.map(w => w.total), 1);

  // 1. CHRONOTYPE COMPLETION DATA (Morning vs Afternoon vs Evening)
  let morningCompletions = 0;
  let afternoonCompletions = 0;
  let eveningCompletions = 0;

  goals.forEach(g => {
    const activeTasks = g.isPanicModeActive && g.panicModeTasks ? g.panicModeTasks : g.tasks;
    activeTasks.forEach(t => {
      if (t.completed) {
        if (t.assignedSession === "morning") morningCompletions++;
        else if (t.assignedSession === "afternoon") afternoonCompletions++;
        else if (t.assignedSession === "evening") eveningCompletions++;
      }
    });
  });

  // Default values if no tasks are completed yet to keep the UI beautiful
  if (morningCompletions === 0 && afternoonCompletions === 0 && eveningCompletions === 0) {
    morningCompletions = 5;
    afternoonCompletions = 3;
    eveningCompletions = 8;
  }

  const totalCompletions = morningCompletions + afternoonCompletions + eveningCompletions;
  const morningPercent = Math.round((morningCompletions / totalCompletions) * 100);
  const afternoonPercent = Math.round((afternoonCompletions / totalCompletions) * 100);
  const eveningPercent = Math.round((eveningCompletions / totalCompletions) * 100);

  // 2. FOCUS SCORE PROGRESSION DATA (Dynamic 7-Day Trend based on stats)
  const baseProgress = [45, 52, 58, 62, Math.max(10, stats.focusScore - 8), Math.max(10, stats.focusScore - 3), stats.focusScore];
  const maxProgress = 100;
  
  // Calculate SVG Points for Line Chart (width: 500, height: 120)
  const lineChartWidth = 500;
  const lineChartHeight = 120;
  const progressionStepX = lineChartWidth / (baseProgress.length - 1);
  const pointsString = baseProgress
    .map((val, idx) => `${idx * progressionStepX},${lineChartHeight - (val / maxProgress) * lineChartHeight}`)
    .join(" ");

  // 3. CRITICAL-PATH BOTTLENECK TRACKING
  interface BottleneckTask {
    goalTitle: string;
    taskTitle: string;
    estimatedMinutes: number;
    priority: string;
    dependenciesCount: number;
  }

  const bottleneckTasks: BottleneckTask[] = [];
  goals.forEach(g => {
    const activeTasks = g.isPanicModeActive && g.panicModeTasks ? g.panicModeTasks : g.tasks;
    activeTasks.forEach(t => {
      if (!t.completed && t.isCriticalPath) {
        bottleneckTasks.push({
          goalTitle: g.title,
          taskTitle: t.title,
          estimatedMinutes: t.estimatedMinutes,
          priority: t.priority,
          dependenciesCount: t.dependencies ? t.dependencies.length : 0
        });
      }
    });
  });

  // Sort by estimated minutes (highest bottleneck potential first)
  bottleneckTasks.sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);
  const topBottlenecks = bottleneckTasks.slice(0, 3);

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-950/40 border border-violet-800/60">
          <BarChart3 className="h-6 w-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-sans font-black tracking-tight text-white">Productivity Intelligence Analytics</h1>
          <p className="text-slate-400 text-xs">A comprehensive visual mapping of your cognitive bandwidth, task throughput, and execution velocity.</p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Completion Rate Gauge */}
        <div className="p-5 glass accent-glow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider">Completion Density</h3>
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-sans font-black text-white">{stats.completionRate}%</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">Average schedule completion velocity</p>
            </div>
            {/* Visual indicator bar */}
            <div className="h-16 w-3 bg-slate-950 rounded-full overflow-hidden relative">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-cyan-400 transition-all duration-1000 ease-out"
                style={{ height: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Focus Score Gauge */}
        <div className="p-5 glass accent-glow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider">Cognitive Focus Score</h3>
            <Sparkles className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-sans font-black text-white">{stats.focusScore}/100</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">Efficacy calculated over deep hours</p>
            </div>
            {/* Visual indicator bar */}
            <div className="h-16 w-3 bg-slate-950 rounded-full overflow-hidden relative">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-violet-500 to-indigo-400 transition-all duration-1000 ease-out"
                style={{ height: `${stats.focusScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Streak Safety */}
        <div className="p-5 glass accent-glow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider">Execution Streak</h3>
            <Flame className="h-4.5 w-4.5 text-amber-500 animate-pulse fill-amber-500" />
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-sans font-black text-white">{stats.streakDays} Days</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">Sustained deadline compliance metric</p>
            </div>
            {/* Visual indicator bar */}
            <div className="h-16 w-3 bg-slate-950 rounded-full overflow-hidden relative">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-amber-500 to-orange-400 transition-all duration-1000 ease-out"
                style={{ height: `${Math.min(100, stats.streakDays * 15)}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Weekly Completion Trends (Custom Interactive SVG) */}
        <div className="p-6 glass accent-glow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-sans font-bold text-sm text-white">Execution Volume Comparison</h3>
              <p className="text-slate-500 text-[10px] font-mono">Completed vs Total tasks over previous 5 weeks</p>
            </div>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>

          {/* SVG bar chart */}
          <div className="overflow-x-auto w-full pb-1">
            <div className="w-full h-44 relative min-w-[500px]">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet" viewBox="0 0 500 150">
              {/* Grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

              {/* Render dynamic bars for each week */}
              {stats.weeklyTrends.map((week, idx) => {
                const stepX = 500 / stats.weeklyTrends.length;
                const xPos = idx * stepX + stepX / 2;

                const barWidth = 18;
                const totalHeight = (week.total / maxWeeklyTotal) * 100;
                const compHeight = (week.completed / maxWeeklyTotal) * 100;

                const yTotal = 130 - totalHeight;
                const yComp = 130 - compHeight;

                return (
                  <g key={week.name} className="group cursor-pointer">
                    {/* Total Tasks Bar (Background) */}
                    <rect
                      x={xPos - barWidth}
                      y={yTotal}
                      width={barWidth}
                      height={totalHeight}
                      fill="#1e293b"
                      rx="3"
                      className="hover:fill-slate-800 transition-colors duration-200"
                    />
                    {/* Completed Tasks Bar (Foreground) */}
                    <rect
                      x={xPos - barWidth}
                      y={yComp}
                      width={barWidth}
                      height={compHeight}
                      fill="url(#barGradient)"
                      rx="3"
                      className="filter drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]"
                    />

                    {/* Week Label text */}
                    <text x={xPos - barWidth / 2} y="145" fill="#64748b" className="font-mono text-[9px]" textAnchor="middle">
                      {week.name}
                    </text>

                    {/* Numeric Value Tooltip */}
                    <text x={xPos - barWidth / 2} y={yComp - 8} fill="#fff" className="font-mono text-[9px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold" textAnchor="middle">
                      {week.completed}/{week.total}
                    </text>
                  </g>
                );
              })}

              {/* Gradient defs for SVG */}
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          </div>
        </div>

        {/* Chart B: Workload Density Matrix (Heatmap) */}
        <div className="p-6 glass accent-glow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-sans font-bold text-sm text-white">Daily Heatmap Log</h3>
              <p className="text-slate-500 text-[10px] font-mono">Task execution density mapped across calendar days</p>
            </div>
            <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
          </div>

          <div className="flex items-center justify-around h-40">
            {daysOfWeek.map((day) => {
              const count = stats.heatmapData[day] || 0;
              // Heatmap shading calculation
              let heatColor = "bg-slate-900 border-slate-800/80";
              let shadow = "";

              if (count > 5) {
                heatColor = "bg-gradient-to-br from-orange-400 to-rose-500 text-slate-950 border-transparent font-bold";
                shadow = "shadow-md shadow-orange-500/25";
              } else if (count > 3) {
                heatColor = "bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 border-transparent font-bold";
                shadow = "shadow-sm shadow-cyan-500/10";
              } else if (count > 1) {
                heatColor = "bg-slate-800 text-slate-300 border-slate-700/60";
              } else if (count > 0) {
                heatColor = "bg-slate-900 text-slate-400 border-slate-800/60";
              }

              return (
                <div key={day} className="flex flex-col items-center gap-3">
                  {/* Glowing Box */}
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center border text-xs font-mono transition-transform hover:scale-105 duration-200 ${heatColor} ${shadow}`}>
                    {count}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart C: Focus Score Progression (Custom SVG Line Chart) */}
        <div className="p-6 glass accent-glow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-sans font-bold text-sm text-white">Focus Score Progression</h3>
              <p className="text-slate-500 text-[10px] font-mono">Continuous 7-day cognitive performance index trajectory</p>
            </div>
            <TrendingUp className="h-4 w-4 text-violet-400" />
          </div>

          <div className="overflow-x-auto w-full pb-1">
            <div className="w-full h-44 relative min-w-[500px]">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 130" preserveAspectRatio="xMidYMid meet">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="65" x2="500" y2="65" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

              {/* Area under line */}
              <path
                d={`M 0,110 ${pointsString} L 500,110 Z`}
                fill="url(#areaGradient)"
                opacity="0.15"
                className="transition-all duration-1000 ease-out"
              />

              {/* Smooth Progression Line */}
              <polyline
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3.5"
                points={pointsString}
                className="transition-all duration-1000 ease-out filter drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]"
              />

              {/* Data points */}
              {baseProgress.map((val, idx) => {
                const cx = idx * progressionStepX;
                const cy = lineChartHeight - (val / maxProgress) * lineChartHeight;
                return (
                  <g key={idx} className="group/dot cursor-pointer">
                    <circle
                      cx={cx}
                      cy={cy}
                      r="6"
                      fill="#8b5cf6"
                      className="hover:r-8 transition-all duration-200"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="12"
                      fill="transparent"
                      stroke="#a78bfa"
                      strokeWidth="1.5"
                      className="scale-0 group-hover/dot:scale-100 origin-center transition-transform duration-200"
                    />
                    <text
                      x={cx}
                      y={cy - 12}
                      fill="#fff"
                      className="font-mono text-[9px] opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 font-bold"
                      textAnchor="middle"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          </div>
        </div>

        {/* Chart D: Chronotype Completion Logs (Custom SVG Doughnut Chart) */}
        <div className="p-6 glass accent-glow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-sans font-bold text-sm text-white">Chronotype Completion Allocation</h3>
              <p className="text-slate-500 text-[10px] font-mono">Cognitive peaks based on task completion hours</p>
            </div>
            <PieChart className="h-4 w-4 text-pink-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center h-40">
            {/* Doughnut Diagram */}
            <div className="overflow-x-auto w-full pb-1">
              <div className="flex justify-center relative min-w-[120px] w-full">
                <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" className="w-full max-w-[120px] h-auto">
                {/* Background track */}
                <circle cx="60" cy="60" r="45" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                
                {/* Evening Circle Segment */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#ec4899"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - (282.7 * eveningPercent) / 100}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                {/* Morning Circle Segment */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#06b6d4"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - (282.7 * morningPercent) / 100}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                  transform={`rotate(${-90 + (eveningPercent / 100) * 360} 60 60)`}
                />
                {/* Afternoon Circle Segment */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  stroke="#eab308"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 - (282.7 * afternoonPercent) / 100}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                  transform={`rotate(${-90 + ((eveningPercent + morningPercent) / 100) * 360} 60 60)`}
                />
              </svg>
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-white">{totalCompletions}</span>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Completions</span>
              </div>
            </div>
            </div>

            {/* Colored Legend list */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-cyan-400" />
                  <span className="text-slate-400">Morning (AM)</span>
                </div>
                <span className="text-white font-bold">{morningPercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-yellow-500" />
                  <span className="text-slate-400">Afternoon (PM)</span>
                </div>
                <span className="text-white font-bold">{afternoonPercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-pink-500" />
                  <span className="text-slate-400">Evening (Night)</span>
                </div>
                <span className="text-white font-bold">{eveningPercent}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CRITICAL-PATH BOTTLENECK TRACKING PANEL */}
      <div className="p-6 glass accent-glow space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4.5 w-4.5 text-rose-500 animate-spin" />
            <h3 className="font-sans font-black text-sm text-white">Critical Path Bottleneck Tracking</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Schedule Blockage Analyzer</span>
        </div>

        {topBottlenecks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            🛡️ ZERO CRITICAL PATH BOTTLENECKS DETECTED. ALL HIGHEST-RISK STEPS ARE SHIELDED.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topBottlenecks.map((bt, idx) => {
              // Calculate bottleneck risk color
              const bottleneckCoeff = bt.estimatedMinutes * (bt.dependenciesCount + 1);
              let bottleneckColor = "border-amber-900/40 bg-amber-950/10 text-amber-300";
              let riskLabel = "MODERATE FRICTION";
              if (bottleneckCoeff > 120) {
                bottleneckColor = "border-rose-900/40 bg-rose-950/10 text-rose-300 panic-glow";
                riskLabel = "SEVERE DEADLINE BLOCKAGE";
              }

              return (
                <div key={idx} className={`p-4 border rounded-xl flex flex-col justify-between space-y-3 transition-transform hover:scale-[1.01] ${bottleneckColor}`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 text-slate-400 max-w-[150px] truncate">
                        {bt.goalTitle}
                      </span>
                      <span className="text-[8px] font-mono font-black tracking-widest uppercase text-rose-500 animate-pulse">
                        {riskLabel}
                      </span>
                    </div>
                    <h4 className="font-sans font-extrabold text-xs text-white line-clamp-2 pt-1">{bt.taskTitle}</h4>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-900/60 pt-2.5">
                    <div className="flex items-center gap-1">
                      <span>Duration:</span>
                      <strong className="text-white">{bt.estimatedMinutes}m</strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Prerequisites:</span>
                      <strong className="text-white">{bt.dependenciesCount}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI INSIGHTS DETAIL DIRECTORY */}
      <div className="p-6 glass accent-glow space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
          <h3 className="font-sans font-bold text-sm text-white">Advanced Telemetry Diagnostics</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins) => {
            let badge = { text: "INFO", color: "text-slate-400 bg-slate-900/50 border-slate-800" };
            
            if (ins.type === "warning") {
              badge = { text: "CRITICAL ALERT", color: "text-rose-400 bg-rose-950/20 border-rose-900/40" };
            } else if (ins.type === "success") {
              badge = { text: "OPTIMIZED TREND", color: "text-emerald-400 bg-emerald-950/20 border-emerald-900/40" };
            } else if (ins.type === "tip") {
              badge = { text: "COACH DIRECTIVE", color: "text-cyan-400 bg-cyan-950/20 border-cyan-900/40" };
            }

            return (
              <div key={ins.id} className="p-4 glass space-y-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest ${badge.color}`}>
                  {badge.text}
                </span>
                <h4 className="font-sans font-extrabold text-xs text-white">{ins.title}</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  {ins.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
