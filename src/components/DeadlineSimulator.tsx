import React, { useState, useMemo } from "react";
import { DeadlineGoal, Task } from "../types";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, ChevronRight, Zap, RefreshCw, BarChart, HelpCircle, AlertCircle, Info, X, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface DeadlineSimulatorProps {
  goals: DeadlineGoal[];
  isDemoMode?: boolean;
}

type SimulationStatus = "scheduled" | "delayed" | "skipped";

export default function DeadlineSimulator({ goals, isDemoMode = false }: DeadlineSimulatorProps) {
  // Select first goal as default
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || "");
  
  // Track status override for each task id: { [taskId]: SimulationStatus }
  const [simStatuses, setSimStatuses] = useState<{ [taskId: string]: SimulationStatus }>({});

  const selectedGoal = useMemo(() => {
    return goals.find(g => g.id === selectedGoalId) || goals[0] || null;
  }, [goals, selectedGoalId]);

  // Reset override statuses when goal changes or demo mode is active
  React.useEffect(() => {
    if (isDemoMode && selectedGoal) {
      const activeTasks = selectedGoal.isPanicModeActive && selectedGoal.panicModeTasks 
        ? selectedGoal.panicModeTasks 
        : selectedGoal.tasks;
      if (activeTasks && activeTasks.length >= 2) {
        setSimStatuses({
          [activeTasks[0].id]: "delayed",
          [activeTasks[1].id]: "skipped"
        });
      } else {
        setSimStatuses({});
      }
    } else {
      setSimStatuses({});
    }
  }, [selectedGoalId, isDemoMode, selectedGoal]);

  // Handle setting overrides
  const handleSetStatus = (taskId: string, status: SimulationStatus) => {
    setSimStatuses(prev => ({
      ...prev,
      [taskId]: status
    }));
  };

  // Perform Simulation Calculus
  const simulationResults = useMemo(() => {
    if (!selectedGoal) return null;

    const tasks = selectedGoal.isPanicModeActive && selectedGoal.panicModeTasks 
      ? selectedGoal.panicModeTasks 
      : selectedGoal.tasks;

    let baseProbability = selectedGoal.completionProbability;
    let backlogMinutes = 0;
    let criticalPathSkippedCount = 0;
    let highPrioritySkippedCount = 0;
    let totalSkippedCount = 0;
    let totalDelayedCount = 0;

    const simulatedTasks = tasks.map(t => {
      const simStatus = simStatuses[t.id] || "scheduled";
      let statusLabel = "On Schedule";
      let statusColor = "text-slate-400";
      
      if (t.completed) {
        statusLabel = "Completed";
        statusColor = "text-emerald-400";
      } else if (simStatus === "delayed") {
        statusLabel = "Simulated: Delayed";
        statusColor = "text-amber-400";
        totalDelayedCount++;
        // Delayed tasks add minutes of delay
        let multiplier = t.priority === "high" ? 1.5 : 1.0;
        backlogMinutes += Math.round(t.estimatedMinutes * multiplier);
      } else if (simStatus === "skipped") {
        statusLabel = "Simulated: Skipped";
        statusColor = "text-rose-500 font-bold";
        totalSkippedCount++;
        if (t.isCriticalPath) criticalPathSkippedCount++;
        if (t.priority === "high") highPrioritySkippedCount++;
        // Skipped tasks transfer hours of overhead to downstream integration
        backlogMinutes += Math.round(t.estimatedMinutes * 2.0);
      }

      return {
        ...t,
        simStatus,
        statusLabel,
        statusColor
      };
    });

    // Compute direct probability drop
    // Critical path skipped causes heavy drops
    let probPenalty = 0;
    probPenalty += criticalPathSkippedCount * 25;
    probPenalty += highPrioritySkippedCount * 15;
    probPenalty += (totalSkippedCount - criticalPathSkippedCount - highPrioritySkippedCount) * 8;
    probPenalty += totalDelayedCount * 6;

    const simulatedProbability = Math.max(10, baseProbability - probPenalty);

    // Compute simulated risk level
    let simulatedRisk: 'Safe' | 'Moderate Risk' | 'High Risk' = 'Safe';
    if (simulatedProbability < 40) {
      simulatedRisk = 'High Risk';
    } else if (simulatedProbability < 70) {
      simulatedRisk = 'Moderate Risk';
    }

    const backlogHours = Number((backlogMinutes / 60).toFixed(1));

    // Dynamic Assessment Paragraph
    let assessment = "";
    if (totalSkippedCount === 0 && totalDelayedCount === 0) {
      assessment = `All tasks are currently simulation-safe. No cascade delays predicted. Maintain this execution pace to secure the ${selectedGoal.category} deadline with maximum efficiency.`;
    } else {
      let delayTriggers: string[] = [];
      if (criticalPathSkippedCount > 0) {
        delayTriggers.push(`skipping ${criticalPathSkippedCount} Critical Path milestone(s)`);
      }
      if (highPrioritySkippedCount > 0) {
        delayTriggers.push(`dropping ${highPrioritySkippedCount} high-priority sprint task(s)`);
      }
      if (totalDelayedCount > 0) {
        delayTriggers.push(`postponing ${totalDelayedCount} task(s) past their scheduled focus blocks`);
      }

      const triggerStr = delayTriggers.join(" and ");
      
      let impactConclusion = "";
      if (simulatedRisk === "High Risk") {
        impactConclusion = `This triggers a terminal cascade delay! Downstream integration blocks are starved of dependencies, adding a massive ${backlogHours} hours of backlog overhead. Your success probability has collapsed to ${simulatedProbability}%. Immediate AI Replanning or Panic Mode intervention is advised.`;
      } else {
        impactConclusion = `This introduces moderate friction, adding ${backlogHours} hours of extra cognitive load. Your success probability is compromised at ${simulatedProbability}%. We recommend shifting low-priority tasks to tomorrow morning to protect the critical path.`;
      }

      assessment = `Warning: Your current simulation of ${triggerStr} creates a negative bottleneck ripple effect. ${impactConclusion}`;
    }

    return {
      simulatedTasks,
      simulatedProbability,
      simulatedRisk,
      backlogHours,
      assessment,
      totalSkippedCount,
      totalDelayedCount
    };
  }, [selectedGoal, simStatuses]);

  if (!selectedGoal) {
    return (
      <div className="py-12 text-center glass border-dashed border-slate-800">
        <AlertTriangle className="mx-auto h-8 w-8 text-cyan-400 mb-3" />
        <h3 className="text-sm font-mono text-slate-300">No Goals Identified</h3>
        <p className="text-xs text-slate-500 mt-1">Please configure or decompose a goal in the AI Planner to use the simulator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="h-4 w-4 text-violet-400 animate-pulse" />
            <span>Operational Sandbox v1.2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white">
            AI Deadline Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Simulate the exact butterfly effect of skipping or delaying subtasks. Predict downstream bottlenecks before they trigger panic.
          </p>
        </div>

        {/* Goal Selector */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-lg shrink-0">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Target Goal:</span>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none cursor-pointer pr-4"
          >
            {goals.map(g => (
              <option key={g.id} value={g.id} className="bg-slate-950 text-slate-300">
                {g.title.length > 40 ? g.title.substring(0, 40) + "..." : g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {simulationResults && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Sandbox subtask toggling */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-transparent" />
              
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <h3 className="text-sm font-sans font-bold text-slate-200 uppercase tracking-wide">
                    Simulated Task Registry
                  </h3>
                </div>
                <button
                  onClick={() => setSimStatuses({})}
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>RESET SANDBOX</span>
                </button>
              </div>

              <div className="space-y-3">
                {simulationResults.simulatedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-lg border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.completed 
                        ? "bg-slate-950/20 border-slate-900/60 opacity-65" 
                        : task.simStatus === "skipped"
                        ? "bg-rose-950/5 border-rose-900/30"
                        : task.simStatus === "delayed"
                        ? "bg-amber-950/5 border-amber-900/30"
                        : "bg-slate-900/20 border-slate-800/40 hover:border-slate-700/40"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Order badge */}
                        <span className="font-mono text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          STEP {task.order}
                        </span>
                        
                        {/* Priority Badge */}
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          task.priority === "high" 
                            ? "bg-red-950/40 text-red-400 border border-red-900/20" 
                            : task.priority === "medium"
                            ? "bg-amber-950/40 text-amber-400 border border-amber-900/20"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}>
                          {task.priority}
                        </span>

                        {/* Critical path badge */}
                        {task.isCriticalPath && (
                          <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-violet-950/40 text-violet-400 border border-violet-900/20 flex items-center gap-1">
                            <Zap className="h-2 w-2 text-violet-400 animate-pulse" />
                            CRITICAL PATH
                          </span>
                        )}
                        
                        {/* Status Label */}
                        <span className={`text-[9px] font-mono ${task.statusColor}`}>
                          {task.statusLabel}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-sans font-medium text-slate-200">
                        {task.title}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>EST: {task.estimatedMinutes} MINS</span>
                        {task.assignedSession && (
                          <>
                            <span className="text-slate-700">•</span>
                            <span className="uppercase">{task.assignedSession} block</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Controller Buttons */}
                    {!task.completed ? (
                      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-900 shrink-0 self-start sm:self-center">
                        <button
                          onClick={() => handleSetStatus(task.id, "scheduled")}
                          className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all duration-200 ${
                            task.simStatus === "scheduled" || !simStatuses[task.id]
                              ? "bg-slate-800 text-cyan-400 border border-cyan-800/20"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Scheduled
                        </button>
                        <button
                          onClick={() => handleSetStatus(task.id, "delayed")}
                          className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all duration-200 ${
                            task.simStatus === "delayed"
                              ? "bg-amber-950/60 text-amber-400 border border-amber-900/20"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Delay
                        </button>
                        <button
                          onClick={() => handleSetStatus(task.id, "skipped")}
                          className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all duration-200 ${
                            task.simStatus === "skipped"
                              ? "bg-rose-950/60 text-rose-400 border border-rose-900/20"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Skip
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-500 shrink-0 self-start sm:self-center bg-emerald-950/10 px-2 py-1 border border-emerald-900/20 rounded">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-[10px] font-mono uppercase font-bold">LOCKED</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Telemetry Gauges and Assessment */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Telemetry Card */}
            <div className="glass p-5 relative overflow-hidden space-y-5">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-2">
                <BarChart className="h-3.5 w-3.5 text-cyan-400" />
                SIMULATED METRICS TELEMETRY
              </h3>

              {/* Progress probabilities & counters */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Simulated Probability Gauge */}
                <div className="bg-slate-950/40 border border-slate-900/80 p-4 rounded-xl text-center flex flex-col justify-between h-[120px]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Completion Prob.
                  </span>
                  <div>
                    <span className={`text-3xl sm:text-4xl font-sans font-black tracking-tight ${
                      simulationResults.simulatedProbability > 75 
                        ? "text-emerald-400" 
                        : simulationResults.simulatedProbability > 45 
                        ? "text-amber-400" 
                        : "text-rose-500 animate-pulse"
                    }`}>
                      {simulationResults.simulatedProbability}%
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">
                    RECALCULATED LIVE
                  </span>
                </div>

                {/* Overhead Delay Gauge */}
                <div className="bg-slate-950/40 border border-slate-900/80 p-4 rounded-xl text-center flex flex-col justify-between h-[120px]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Delay Overhead
                  </span>
                  <div>
                    <span className={`text-3xl sm:text-4xl font-sans font-black tracking-tight ${
                      simulationResults.backlogHours > 0 ? "text-rose-400" : "text-emerald-400"
                    }`}>
                      +{simulationResults.backlogHours}H
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">
                    CUMULATIVE BACKLOG
                  </span>
                </div>

              </div>

              {/* Risk Alert Meter */}
              <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
                simulationResults.simulatedRisk === "High Risk"
                  ? "bg-rose-950/10 border-rose-900/30 text-rose-300"
                  : simulationResults.simulatedRisk === "Moderate Risk"
                  ? "bg-amber-950/10 border-amber-900/30 text-amber-300"
                  : "bg-emerald-950/10 border-emerald-900/30 text-emerald-300"
              }`}>
                {simulationResults.simulatedRisk === "High Risk" ? (
                  <ShieldAlert className="h-8 w-8 shrink-0 text-rose-500 animate-bounce" />
                ) : simulationResults.simulatedRisk === "Moderate Risk" ? (
                  <AlertCircle className="h-8 w-8 shrink-0 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
                )}
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
                    SIMULATED COGNITIVE RISK STATE
                  </div>
                  <div className="text-sm font-sans font-extrabold uppercase">
                    {simulationResults.simulatedRisk}
                  </div>
                </div>
              </div>

            </div>

            {/* AI Cascade Impact Diagnosis */}
            <div className="glass p-5 relative overflow-hidden bg-[#0a0c10]/40">
              <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-violet-500/10 via-transparent to-transparent" />
              
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-violet-400" />
                AI BOTTLENECK DIAGNOSIS
              </h3>

              <div className="mt-4 space-y-4">
                <div className="p-3 bg-slate-950/80 border border-slate-900/80 rounded-lg text-xs leading-relaxed font-mono text-slate-300">
                  {simulationResults.assessment}
                </div>

                {/* Helpful Tip */}
                {(simulationResults.totalSkippedCount > 0 || simulationResults.totalDelayedCount > 0) && (
                  <div className="flex gap-2 text-xs text-slate-400">
                    <HelpCircle className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      How to fix this? Go back to the <strong className="text-slate-200">Schedule</strong> tab and activate <strong className="text-slate-200">AI Autonomous Replanning</strong> to calculate a real, permanent schedule shuffle that bypasses this simulated crash.
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* NEW CASCADE FAILURE MAP SECTION */}
          <div className="glass p-6 relative overflow-hidden space-y-6 mt-6">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-violet-500/30 via-indigo-500/30 to-transparent" />
            
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Zap className="h-5 w-5 text-violet-400 animate-pulse" />
              <h3 className="text-sm font-sans font-black text-white uppercase tracking-wide">
                CASCADE FAILURE MAP
              </h3>
            </div>

            {!simulationResults.simulatedTasks.some(t => t.simStatus !== "scheduled") ? (
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                ⚡ Adjust task statuses above to reveal cascade impact map
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Visual Chain of all tasks */}
                <div className="text-[10px] font-mono text-slate-500 text-center sm:hidden mb-2">
                  ← Scroll to see full cascade →
                </div>
                <div className="overflow-x-auto w-full pb-2">
                  <div className="flex flex-nowrap items-center gap-4 p-4 bg-slate-950/40 rounded-xl border border-slate-900 min-w-[750px]">
                    {simulationResults.simulatedTasks.map((task, idx) => {
                      const isSkipped = task.simStatus === "skipped";
                      const isDelayed = task.simStatus === "delayed";
                      const isCompleted = task.completed;
                      const isCritical = task.isCriticalPath;

                      let nodeBg = "bg-slate-900 border-slate-800 text-slate-300";
                      let nodeIcon = null;
                      let pulseClass = "";

                      if (isSkipped) {
                        nodeBg = "bg-rose-950/40 border-rose-500 text-rose-200";
                        nodeIcon = <X className="h-3 w-3 text-rose-400 animate-pulse" />;
                        pulseClass = "animate-pulse";
                      } else if (isDelayed) {
                        nodeBg = "bg-amber-950/40 border-amber-500 text-amber-200";
                        nodeIcon = <AlertTriangle className="h-3 w-3 text-amber-400" />;
                      } else if (isCompleted) {
                        nodeBg = "bg-emerald-950/40 border-emerald-500 text-emerald-200";
                        nodeIcon = <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
                      }

                      const glowBorder = isCritical ? "shadow-[0_0_12px_rgba(139,92,246,0.5)] border-violet-500" : "";

                      // Helper to truncate title to 4 words
                      const truncatedTitle = task.title.split(/\s+/).slice(0, 4).join(" ") + (task.title.split(/\s+/).length > 4 ? "..." : "");

                      return (
                        <React.Fragment key={task.id}>
                          <div className={`p-3 rounded-lg border flex items-center gap-2 min-w-[180px] max-w-[220px] transition-all duration-300 ${nodeBg} ${glowBorder} ${pulseClass}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[9px] font-mono font-bold text-slate-500">
                                  #{task.order}
                                </span>
                                {nodeIcon}
                              </div>
                              <h4 className="text-xs font-sans font-bold text-slate-200 truncate" title={task.title}>
                                {truncatedTitle}
                              </h4>
                              <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                                {(task.estimatedMinutes / 60).toFixed(1)}h
                              </p>
                            </div>
                          </div>
                          {idx < simulationResults.simulatedTasks.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Blast Radius Cards for Skipped or Delayed tasks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {simulationResults.simulatedTasks.map((task) => {
                    const isSkipped = task.simStatus === "skipped";
                    const isDelayed = task.simStatus === "delayed";
                    if (!isSkipped && !isDelayed) return null;

                    // Get downstream tasks (order > current order)
                    const downstreamTasks = simulationResults.simulatedTasks.filter(t => t.order > task.order);
                    const downstreamHours = (downstreamTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60).toFixed(1);

                    const cardColor = isSkipped ? "bg-rose-950/10 border-rose-900/30 text-rose-300" : "bg-amber-950/10 border-amber-900/30 text-amber-300";
                    const titleColor = isSkipped ? "text-rose-400" : "text-amber-400";

                    return (
                      <div key={`blast-${task.id}`} className={`p-4 rounded-xl border ${cardColor} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-mono font-black ${titleColor}`}>
                            💥 BLAST RADIUS: '{task.title.split(/\s+/).slice(0, 3).join(" ")}...'
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-400">
                            {downstreamHours}h at risk
                          </span>
                        </div>
                        
                        {downstreamTasks.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono uppercase text-slate-500">Downstream Blocked Tasks:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {downstreamTasks.map(dt => (
                                <li key={`downstream-${dt.id}`} className="text-xs font-sans text-slate-300 truncate">
                                  {dt.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-xs font-sans text-slate-500 italic">No further downstream tasks are affected.</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 3. Cascade Timeline bar at bottom */}
                <div className="space-y-2 bg-[#0a0c10]/40 p-4 rounded-xl border border-slate-900 overflow-x-auto w-full">
                  <div className="min-w-[600px] space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                      CASCADE TIMELINE
                    </span>

                    {/* Horizontal Bar */}
                    <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex">
                      {simulationResults.simulatedTasks.map((task) => {
                        const totalMinutes = simulationResults.simulatedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) || 1;
                        const percentage = (task.estimatedMinutes / totalMinutes) * 100;

                        let segmentBg = "bg-slate-700 border-r border-slate-950";
                        if (task.completed) {
                          segmentBg = "bg-emerald-500 border-r border-slate-950";
                        } else if (task.simStatus === "skipped") {
                          segmentBg = "bg-rose-500 border-r border-slate-950 animate-pulse";
                        } else if (task.simStatus === "delayed") {
                          segmentBg = "bg-amber-500 border-r border-slate-950";
                        } else if (task.simStatus === "scheduled") {
                          segmentBg = "bg-cyan-600 border-r border-slate-950";
                        }

                        return (
                          <div
                            key={`seg-${task.id}`}
                            className={`h-full ${segmentBg}`}
                            style={{ width: `${percentage}%` }}
                            title={`${task.title} (${task.estimatedMinutes}m)`}
                          />
                        );
                      })}
                    </div>

                    {/* Labels below bar */}
                    <div className="flex justify-between items-center flex-wrap gap-2 text-[9px] font-mono text-slate-500 pt-1">
                      {simulationResults.simulatedTasks.map((task) => (
                        <div key={`label-${task.id}`} className="flex items-center gap-1">
                          <span className="font-bold text-slate-400">#{task.order}</span>
                          {task.assignedSession && (
                            <span className="uppercase text-[8px]">({task.assignedSession})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
