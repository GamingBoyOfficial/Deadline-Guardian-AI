import React, { useState, useEffect } from "react";
import { ShieldAlert, BrainCircuit, Calendar, Radio, TrendingUp, Sparkles, ArrowRight, Zap, Target, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onStart: () => void;
  onTriggerDemo?: () => void;
}

const SCAN_LINES = [
  "> Scanning active milestones...",
  "> ML Assignment: 38% survival probability ⚠",
  "> Coding Contest: CRITICAL — 6h workload, 5h remaining",
  "> Cascade failure detected: 3 downstream tasks at risk",
  "> Initiating emergency replan protocol...",
  "> Panic Mode available. Estimated time saved: 2.4 hours"
];

export default function LandingPage({ onStart, onTriggerDemo }: LandingPageProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let resetTimeout: NodeJS.Timeout;

    const startScanning = () => {
      setVisibleLines(0);
      let count = 0;
      interval = setInterval(() => {
        count++;
        setVisibleLines(count);
        if (count >= SCAN_LINES.length) {
          clearInterval(interval);
          resetTimeout = setTimeout(() => {
            startScanning();
          }, 8000);
        }
      }, 600);
    };

    startScanning();

    return () => {
      clearInterval(interval);
      clearTimeout(resetTimeout);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    {
      icon: BrainCircuit,
      title: "AI Task Decomposition",
      description: "Break complex, overwhelming assignments or test prep goals down into microscopic actionable subtasks automatically. The system estimates realistic durations and identifies the critical execution path.",
      color: "from-cyan-400 to-blue-500",
      glowColor: "cyan"
    },
    {
      icon: Zap,
      title: "Autonomous Replanning",
      description: "The core differentiator. Mark a task as missed or delayed, and the AI immediately shuffles remaining workload, compresses lower-ROI tasks, protects the critical path, and issues an optimized recovery plan.",
      color: "from-violet-400 to-indigo-600",
      glowColor: "indigo"
    },
    {
      icon: TrendingUp,
      title: "Deadline Risk Prediction",
      description: "Continuously monitors completion velocity and outputs safety scores. Receive precise mathematical probabilities (e.g., '62% safe') alongside tailored psychological insights to avoid crunch stress.",
      color: "from-emerald-400 to-teal-500",
      glowColor: "emerald"
    },
    {
      icon: Radio,
      title: "Panic Mode (Signature)",
      description: "When hours grow dangerously low, trigger Panic Mode. It strips away all secondary tasks, compresses remaining items by 40%, and issues a tactical, high-intensity survival playbook.",
      color: "from-rose-500 to-red-600",
      glowColor: "rose"
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-65px)] w-full overflow-hidden bg-slate-950 text-slate-100 py-16 px-4">
      <div style={{color:'lime', fontSize:'10px', position:'fixed', top:0, left:0, zIndex:9999}}>
        KEY: {(import.meta as any).env?.VITE_GEMINI_API_KEY ? "LOADED" : "MISSING"}
      </div>
      {/* Decorative background grid and ambient gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
      
      {/* Top ambient color glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[30%] h-[600px] w-[600px] rounded-full bg-rose-500/5 blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HERO SECTION */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Tagline Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-xs font-mono font-semibold tracking-wider uppercase mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Strategic Task Execution System
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-sans font-black tracking-tight leading-none mb-6 text-white"
          >
            Your Deadlines Are Already at Risk.
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={itemVariants}
            className="text-slate-400 text-base sm:text-lg md:text-xl font-normal leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            Deadline Guardian AI predicts failure before it happens — then fixes it automatically.
          </motion.p>

          {/* Stat Pills in a row */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-400 text-xs font-mono font-semibold">
              🔴 38% survival rate detected
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-400 text-xs font-mono font-semibold">
              ⚡ Panic Mode compresses 40% of workload
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-xs font-mono font-semibold">
              🧠 AI replanning in under 3 seconds
            </span>
          </motion.div>

          {/* Primary Call to Action Button */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <button
              id="landing-cta-primary"
              onClick={onStart}
              className="w-full sm:w-auto relative group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-black tracking-wide shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden border border-cyan-400/30"
            >
              <span>Activate Deadline Guardian →</span>
            </button>

            {onTriggerDemo && (
              <button
                id="landing-cta-demo"
                onClick={onTriggerDemo}
                className="w-full sm:w-auto relative group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-sans font-black tracking-wide shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden border border-indigo-400/30"
              >
                <Sparkles className="h-4.5 w-4.5 text-violet-200 animate-spin" />
                <span>LOAD JUDGE DEMO MODE</span>
              </button>
            )}
          </motion.div>

          {/* LIVE DEMO PREVIEW SECTION */}
          <motion.div 
            variants={itemVariants}
            className="w-full max-w-2xl mx-auto mb-16 text-left"
          >
            <h4 className="text-center text-xs font-sans font-extrabold text-cyan-400 uppercase tracking-widest mb-4">
              Watch it predict deadline failure in real time
            </h4>
            
            <div className="relative rounded-2xl border border-slate-900 bg-[#020617]/90 p-5 font-mono text-xs sm:text-sm shadow-2xl overflow-hidden shadow-cyan-950/20">
              {/* Scanline pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              
              {/* Top controls header */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  COGNITIVE SHIELD TELEMETRY
                </span>
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              </div>

              {/* Terminal scan content */}
              <div className="space-y-2 min-h-[140px] flex flex-col justify-start">
                {SCAN_LINES.slice(0, visibleLines).map((line, idx) => {
                  const isLast = idx === visibleLines - 1;
                  const isSpecial = line.startsWith("> Cascade") || line.startsWith("> Panic");
                  return (
                    <div 
                      key={idx} 
                      className={`${isSpecial ? "text-rose-400 font-bold" : "text-slate-300"} flex items-center`}
                    >
                      <span>{line}</span>
                      {isLast && (
                        <span className="ml-1 inline-block w-1.5 h-4 bg-cyan-400 animate-[pulse_1s_infinite] shrink-0" />
                      )}
                    </div>
                  );
                })}
                {visibleLines === 0 && (
                  <div className="text-slate-500 italic flex items-center">
                    <span>Initializing scan...</span>
                    <span className="ml-1 inline-block w-1.5 h-4 bg-cyan-400 animate-[pulse_1s_infinite] shrink-0" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* BOTTOM STRIP OF 4 FEATURE ICONS WITH LABELS */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 py-4 border-y border-slate-900 max-w-4xl mx-auto mb-12 text-xs text-slate-400 font-mono"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🎯</span>
              <span className="font-bold tracking-wider">Deadline Survival Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <span className="font-bold tracking-wider">Cascade Failure Simulation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">🚨</span>
              <span className="font-bold tracking-wider">Panic Mode Rescue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">🧠</span>
              <span className="font-bold tracking-wider">Autonomous Replanning</span>
            </div>
          </motion.div>

        </motion.div>

        {/* METRICS & FEATURE MATRIX SHOWCASE */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-white mb-2">
              Advanced Agentic Modules
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Engineered to replace chaotic workflows with rigorous mathematical schedule control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative group overflow-hidden p-6 glass hover:border-slate-500/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Subtle hover backlight glow */}
                  <div className={`absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-0 group-hover:opacity-10 blur-xl transition-all duration-500 bg-gradient-to-br ${feat.color}`} />
                  
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800/80 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-sans font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-200">
                        {feat.title}
                      </h3>
                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* TRUST / WHY CHOOSE BLOCK */}
        <div className="p-8 text-center max-w-4xl mx-auto relative overflow-hidden glass accent-glow">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
          <h3 className="text-xl sm:text-2xl font-sans font-extrabold text-white mb-4">
            Under Extreme Time Squeezes?
          </h3>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed mb-6">
            Whether you are studying for compiler design, preparing for machine learning models, or deploying a high-stakes codebase, the system leverages Gemini AI intelligence to identify bottleneck operations and dynamically clear hurdles.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-cyan-400" />
              <span>Optimized Workloads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
              <span>Emergency Recovery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
              <span>Zero Slippage Guarantee</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
