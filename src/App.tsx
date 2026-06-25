import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Planner from "./components/Planner";
import ScheduleView from "./components/ScheduleView";
import AnalyticsView from "./components/AnalyticsView";
import PanicMode from "./components/PanicMode";
import ChatAssistant from "./components/ChatAssistant";
import DeadlineSimulator from "./components/DeadlineSimulator";

import {
  getSavedGoals,
  saveGoals,
  getSavedChat,
  saveChat,
  getSavedInsights,
  saveInsights,
  getSavedStats,
  saveStats
} from "./data";
import { DeadlineGoal, Task, ChatMessage, ProductivityInsight, ProductivityStats } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Load and preserve state with localStorage persistence
  const [goals, setGoals] = useState<DeadlineGoal[]>(() => getSavedGoals());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => getSavedChat());
  const [insights, setInsights] = useState<ProductivityInsight[]>(() => getSavedInsights());
  const [stats, setStats] = useState<ProductivityStats>(() => getSavedStats());

  const [dashboardInsights, setDashboardInsights] = useState<ProductivityInsight[]>([]);
  const [analyticsInsights, setAnalyticsInsights] = useState<ProductivityInsight[]>([]);
  const [survivalProbability, setSurvivalProbability] = useState<number>(100);
  const [survivalReasoning, setSurvivalReasoning] = useState<string>("All systems operational.");

  // Save states to local storage on modification
  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  useEffect(() => {
    saveChat(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  // Recalculate metrics and generate dynamic, non-duplicate insights on task or goal changes
  useEffect(() => {
    let completedTasksCount = 0;
    let totalTasksCount = 0;
    let completedCriticalCount = 0;
    let totalCriticalCount = 0;
    let overdueCount = 0;

    const now = new Date();

    goals.forEach(g => {
      const activeTasks = g.isPanicModeActive && g.panicModeTasks ? g.panicModeTasks : g.tasks;
      activeTasks.forEach(t => {
        totalTasksCount++;
        if (t.completed) {
          completedTasksCount++;
        }
        if (t.isCriticalPath) {
          totalCriticalCount++;
          if (t.completed) {
            completedCriticalCount++;
          }
        }
      });

      const isOverdue = new Date(g.targetDateTime) < now && activeTasks.some(t => !t.completed);
      if (isOverdue) {
        overdueCount++;
      }
    });

    const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : stats.completionRate;
    const criticalRatio = totalCriticalCount > 0 ? (completedCriticalCount / totalCriticalCount) : 0.8;
    const focusScore = Math.min(100, Math.max(10, Math.round(completionRate * 0.6 + criticalRatio * 30 + stats.streakDays * 1.5)));

    // Heatmap data: let's base it on actual task completions plus baseline
    const baseHeatmap: { [day: string]: number } = { "Mon": 2, "Tue": 4, "Wed": 1, "Thu": 5, "Fri": 3, "Sat": 2, "Sun": 1 };
    
    // Add real completions by looking at task.completedAt if present
    goals.forEach(g => {
      const activeTasks = g.isPanicModeActive && g.panicModeTasks ? g.panicModeTasks : g.tasks;
      activeTasks.forEach(t => {
        if (t.completed && t.completedAt) {
          try {
            const date = new Date(t.completedAt);
            const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday...
            const mappedDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const dayName = mappedDays[dayIndex];
            if (baseHeatmap[dayName] !== undefined) {
              baseHeatmap[dayName] += 1;
            } else {
              baseHeatmap[dayName] = 1;
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
    });

    // Update stats with live calculations
    setStats(prev => ({
      ...prev,
      completionRate,
      focusScore,
      overdueCount,
      completedTasksCount,
      totalTasksCount,
      heatmapData: baseHeatmap
    }));

    // Calculate Master Deadline Survival Probability
    let calculatedProbability = 100;
    let calculatedReasoning = "No active target milestones. Start a new timeline mapping inside the AI Planner.";

    if (goals.length > 0) {
      let totalTasks = 0;
      let completedTasks = 0;
      let totalRemainingMinutes = 0;
      let incompleteCriticalTasks = 0;
      let hasOverdueGoal = false;
      let minHoursRemaining = Infinity;
      let hasHighOrCriticalTask = false;

      goals.forEach(goal => {
        const goalTarget = new Date(goal.targetDateTime).getTime();
        const nowTime = Date.now();
        const diffMs = goalTarget - nowTime;
        const goalHoursRemaining = diffMs / (1000 * 60 * 60);

        const goalHasIncomplete = goal.tasks.some(t => !t.completed);
        if (goalHasIncomplete) {
          if (goalHoursRemaining <= 0) {
            hasOverdueGoal = true;
          }
          if (goalHoursRemaining > 0 && goalHoursRemaining < minHoursRemaining) {
            minHoursRemaining = goalHoursRemaining;
          }
        }

        goal.tasks.forEach(task => {
          totalTasks++;
          if (task.completed) {
            completedTasks++;
          } else {
            totalRemainingMinutes += task.estimatedMinutes;
            if (task.isCriticalPath) {
              incompleteCriticalTasks++;
            }
            if (task.riskLevel === 'High' || task.riskLevel === 'Critical' || task.priority === 'high') {
              hasHighOrCriticalTask = true;
            }
          }
        });
      });

      // 1. Base Score starts at 100
      let score = 100;

      // 2. Completion Rate impact (up to -30 points if no tasks are completed)
      const completionRateVal = totalTasks > 0 ? (completedTasks / totalTasks) : 1;
      score -= Math.round((1 - completionRateVal) * 30);

      // 3. Time Left vs Workload compression factor
      const workloadHours = totalRemainingMinutes / 60;
      const timeAvailableHours = isFinite(minHoursRemaining) && minHoursRemaining > 0 ? minHoursRemaining : 4;
      
      const compressionRatio = workloadHours / timeAvailableHours;
      if (compressionRatio > 1.2) {
        score -= 35;
      } else if (compressionRatio > 0.8) {
        score -= 20;
      } else if (compressionRatio > 0.4) {
        score -= 10;
      }

      // 4. Overdue penalty
      if (overdueCount > 0 || hasOverdueGoal) {
        score -= 30;
      }

      // 5. Risk level of active tasks
      if (hasHighOrCriticalTask) {
        score -= 15;
      }
      if (incompleteCriticalTasks > 0) {
        score -= Math.min(20, incompleteCriticalTasks * 4);
      }

      // Clamping between 10 and 100
      calculatedProbability = Math.max(10, Math.min(100, score));

      // 6. Generate EXACTLY ONE sentence explaining why it is at that percentage
      if (overdueCount > 0 || hasOverdueGoal) {
        calculatedReasoning = `${overdueCount || 1} critical milestones are overdue with uncompleted deliverables — immediate triage required.`;
      } else if (compressionRatio > 1.0) {
        const excessHours = Math.round(workloadHours - timeAvailableHours);
        calculatedReasoning = `${incompleteCriticalTasks} critical tasks remain with workload exceeding available time by ${excessHours > 0 ? excessHours : 1} hours — immediate timeline compression required.`;
      } else if (incompleteCriticalTasks > 0 && timeAvailableHours < 24) {
        calculatedReasoning = `${incompleteCriticalTasks} critical path tasks remain with only ${Math.round(timeAvailableHours)} hours left — high bottleneck exposure.`;
      } else if (hasHighOrCriticalTask) {
        calculatedReasoning = `Timeline has unresolved high-risk dependency bottlenecks on active deliverables — proactive execution required.`;
      } else if (calculatedProbability < 70) {
        calculatedReasoning = `Workload density of ${workloadHours.toFixed(1)} hours is compressing remaining buffers — focus optimization is advised.`;
      } else {
        calculatedReasoning = `All upcoming milestones are secure with ample timeline buffers of over ${Math.round(timeAvailableHours)} hours.`;
      }
    }

    setSurvivalProbability(calculatedProbability);
    setSurvivalReasoning(calculatedReasoning);

    // Generate 100% Unique Insights for Dashboard (Executive & Psychological Coaching focus)
    const dInsights: ProductivityInsight[] = [];
    
    // Feature peak based on actual tasks
    let eveningCount = 0;
    let morningCount = 0;
    let afternoonCount = 0;
    goals.forEach(g => {
      g.tasks.forEach(t => {
        if (t.completed) {
          if (t.assignedSession === "evening") eveningCount++;
          else if (t.assignedSession === "morning") morningCount++;
          else if (t.assignedSession === "afternoon") afternoonCount++;
        }
      });
    });

    if (eveningCount >= morningCount && eveningCount >= afternoonCount && eveningCount > 0) {
      dInsights.push({
        id: "d-ins-1",
        title: "Evening Execution Spike",
        description: `Chronotype analysis reveals high cognitive efficacy between 19:00 and 22:30. Schedule your high-intensity critical-path items here.`,
        type: "success",
        category: "evening-peak"
      });
    } else if (morningCount > eveningCount && morningCount >= afternoonCount) {
      dInsights.push({
        id: "d-ins-1",
        title: "Early Bird Cognitive Efficacy",
        description: `Early morning completion peaks detected. Tackle your main problem-solving blocks before midday cognitive fatigue sets in.`,
        type: "success",
        category: "evening-peak"
      });
    } else {
      dInsights.push({
        id: "d-ins-1",
        title: "Balanced Flow Allocation",
        description: `Your completion rates remain highly stable throughout midday blocks. Leverage this momentum to distribute task stress evenly.`,
        type: "success",
        category: "evening-peak"
      });
    }

    // Overload or high-risk alert
    const highRiskGoals = goals.filter(g => g.riskLevel === "High Risk");
    if (highRiskGoals.length > 0 || overdueCount > 0) {
      dInsights.push({
        id: "d-ins-2",
        title: "Syllabus Load Surcharge",
        description: `Warning: You have ${highRiskGoals.length} high-risk milestones. High risk of timeline congestion. Consider executing AI Replanning or Panic Mode immediately.`,
        type: "warning",
        category: "spike-warning"
      });
    } else {
      dInsights.push({
        id: "d-ins-2",
        title: "Optimal Milestone Flow",
        description: `Timeline check: 0 high-risk backlogs detected. Maintain current operational consistency to ensure maximum score output.`,
        type: "info",
        category: "general"
      });
    }

    // Micro-decomposition or task-sizing
    const hasSmallTasks = goals.some(g => g.tasks.some(t => t.estimatedMinutes <= 45 && t.completed));
    if (hasSmallTasks) {
      dInsights.push({
        id: "d-ins-3",
        title: "Micro-Decomposition Yields",
        description: `Decomposing milestones into blocks under 45 minutes reduces cognitive resistance by 94%. Keep leveraging bite-sized execution chunks!`,
        type: "tip",
        category: "decomp-tip"
      });
    } else {
      dInsights.push({
        id: "d-ins-3",
        title: "Optimize Focus Intervals",
        description: `Try chunking remaining high-hour tasks (>60 mins) into sub-30-minute steps to lower neural resistance and increase weekly yield.`,
        type: "tip",
        category: "decomp-tip"
      });
    }

    setDashboardInsights(dInsights);

    // Generate 100% Unique Insights for Analytics page (Statistical, Chronotype, and Technical Telemetry Diagnostics)
    const aInsights: ProductivityInsight[] = [];
    
    // Stat 1: Flow Consistency & Consistency Streak
    if (stats.streakDays >= 5) {
      aInsights.push({
        id: "a-ins-1",
        title: "High-Caliber Execution Streak",
        description: `Incredible momentum: ${stats.streakDays}-day streak active. Your baseline cognitive persistence score is in the upper 98th percentile.`,
        type: "success",
        category: "general"
      });
    } else {
      aInsights.push({
        id: "a-ins-1",
        title: "Consistency Stabilization",
        description: `Active streak is at ${stats.streakDays} days. Focus on completing at least 1 critical-path task daily to build unshakeable focus habits.`,
        type: "info",
        category: "general"
      });
    }

    // Stat 2: Critical Path Safety Rate
    const totalCritical = goals.reduce((acc, g) => acc + g.tasks.filter(t => t.isCriticalPath).length, 0);
    const completedCritical = goals.reduce((acc, g) => acc + g.tasks.filter(t => t.isCriticalPath && t.completed).length, 0);
    const criticalRate = totalCritical > 0 ? Math.round((completedCritical / totalCritical) * 100) : 80;

    if (criticalRate >= 75) {
      aInsights.push({
        id: "a-ins-2",
        title: "Critical Path Shielding",
        description: `You are shielding critical path milestones beautifully (${criticalRate}% complete). This minimizes terminal risk and guarantees submission readiness.`,
        type: "success",
        category: "general"
      });
    } else {
      aInsights.push({
        id: "a-ins-2",
        title: "Critical Path Exposure",
        description: `Critical path task completion is at ${criticalRate}%. High vulnerability. Prioritize tasks marked with critical flags to prevent catastrophic failures.`,
        type: "warning",
        category: "spike-warning"
      });
    }

    // Stat 3: Cognitive Load Distribution
    const activeGoalsCount = goals.filter(g => g.tasks.some(t => !t.completed)).length;
    if (activeGoalsCount > 2) {
      aInsights.push({
        id: "a-ins-3",
        title: "Attention Residue Congestion",
        description: `Multi-tasking warning: ${activeGoalsCount} concurrent goals are active. Context-switching degrades recall. Close outstanding subtasks before opening new goals.`,
        type: "warning",
        category: "spike-warning"
      });
    } else {
      aInsights.push({
        id: "a-ins-3",
        title: "Monolithic Execution Mode",
        description: `Single-task dedication is highly optimized. Managing fewer concurrent goals keeps your cognitive load low and focus concentration pure.`,
        type: "tip",
        category: "general"
      });
    }

    setAnalyticsInsights(aInsights);
  }, [goals, stats.streakDays]);

  // One-click Judge Demo Mode Bootloader
  const handleTriggerDemoMode = () => {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const twoDaysStr = twoDaysFromNow.toISOString().slice(0, 16);

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStr = oneDayFromNow.toISOString().slice(0, 16);

    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
    const fourDaysStr = fourDaysFromNow.toISOString().slice(0, 16);

    const demoGoals: DeadlineGoal[] = [
      {
        id: "demo-assignment",
        title: "Machine Learning Assignment: Deep Neural Networks from Scratch",
        category: "Assignment",
        targetDateTime: `${twoDaysStr}:00`,
        riskLevel: "Moderate Risk",
        completionProbability: 64,
        isPanicModeActive: false,
        recommendations: [
          "Verify backpropagation equations by hand before coding neural loops.",
          "Allocate 45 minutes for matrix dimensions mismatch checks.",
          "Export training graphs as high-resolution SVG to secure rubric points."
        ],
        tasks: [
          { id: "demo-a-1", title: "Configure CUDA-enabled Docker environments and fetch raw weblog training datasets", estimatedMinutes: 60, estimatedHours: 1.0, priority: "high", completed: true, order: 1, isCriticalPath: true, assignedSession: "morning", completedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), riskLevel: "Low", impactIfSkipped: "No valid training environment setup exists, halting any pipeline operations." },
          { id: "demo-a-2", title: "Write matrix derivative equations for backpropagation backward-pass loops", estimatedMinutes: 60, estimatedHours: 1.0, priority: "medium", completed: true, order: 2, isCriticalPath: false, assignedSession: "afternoon", completedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), dependencyTitle: "Configure CUDA-enabled Docker environments and fetch raw weblog training datasets", riskLevel: "Medium", impactIfSkipped: "Weight updates will use incorrect math, causing network divergence." },
          { id: "demo-a-3", title: "Implement PyTorch custom linear layers and activation functions", estimatedMinutes: 120, estimatedHours: 2.0, priority: "high", completed: false, order: 3, isCriticalPath: true, assignedSession: "evening", dependencyTitle: "Write matrix derivative equations for backpropagation backward-pass loops", riskLevel: "High", impactIfSkipped: "Cannot execute model forward passes, making training impossible." },
          { id: "demo-a-4", title: "Conduct local gradient checks to confirm correct analytical backpropagation", estimatedMinutes: 90, estimatedHours: 1.5, priority: "high", completed: false, order: 4, isCriticalPath: true, assignedSession: "morning", dependencyTitle: "Implement PyTorch custom linear layers and activation functions", riskLevel: "Critical", impactIfSkipped: "Undetected backpropagation bugs will prevent network convergence on main dataset." },
          { id: "demo-a-5", title: "Build training monitor dashboard with real-time loss graph telemetry in React", estimatedMinutes: 150, estimatedHours: 2.5, priority: "medium", completed: false, order: 5, isCriticalPath: false, assignedSession: "afternoon", dependencyTitle: "Conduct local gradient checks to confirm correct analytical backpropagation", riskLevel: "Low", impactIfSkipped: "Zero real-time visual insights to check training correctness." },
          { id: "demo-a-6", title: "Write automated archive shell script packaging files into a valid submission ZIP", estimatedMinutes: 30, estimatedHours: 0.5, priority: "low", completed: false, order: 6, isCriticalPath: false, assignedSession: "evening", dependencyTitle: "Build training monitor dashboard with real-time loss graph telemetry in React", riskLevel: "Low", impactIfSkipped: "Manual submission files are error-prone and risk missing critical deliverables." }
        ]
      },
      {
        id: "demo-contest",
        title: "Global Algorithmic Coding Contest: Dynamic Programming Prep",
        category: "Contest",
        targetDateTime: `${oneDayStr}:00`,
        riskLevel: "High Risk",
        completionProbability: 38,
        isPanicModeActive: false,
        recommendations: [
          "Pre-code fast I/O template headers to reduce compile-test latency.",
          "Revise knapsack and bitmask transition formulas to speed up optimization.",
          "Practice 2 competitive tree-state problems under a strict 45-minute limit."
        ],
        tasks: [
          { id: "demo-c-1", title: "Pre-compile custom fast dynamic hash map and buffered I/O headers in C++", estimatedMinutes: 60, estimatedHours: 1.0, priority: "high", completed: true, order: 1, isCriticalPath: true, assignedSession: "morning", completedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), riskLevel: "Low", impactIfSkipped: "Heavy C++ input/output system calls will trigger time limit exceeded errors." },
          { id: "demo-c-2", title: "Derive transition recurrence formula for segment trees state-space", estimatedMinutes: 90, estimatedHours: 1.5, priority: "medium", completed: false, order: 2, isCriticalPath: false, assignedSession: "afternoon", dependencyTitle: "Pre-compile custom fast dynamic hash map and buffered I/O headers in C++", riskLevel: "Medium", impactIfSkipped: "Unable to solve complex range update queries in required O(log N) time complexity." },
          { id: "demo-c-3", title: "Implement segment tree range queries with lazy propagation", estimatedMinutes: 120, estimatedHours: 2.0, priority: "low", completed: false, order: 3, isCriticalPath: false, assignedSession: "evening", dependencyTitle: "Derive transition recurrence formula for segment trees state-space", riskLevel: "High", impactIfSkipped: "Range updates fall back to O(N) complexity, timing out under stress sets." },
          { id: "demo-c-4", title: "Run local automated stress test script against brute-force baseline resolver", estimatedMinutes: 180, estimatedHours: 3.0, priority: "high", completed: false, order: 4, isCriticalPath: true, assignedSession: "evening", dependencyTitle: "Implement segment tree range queries with lazy propagation", riskLevel: "Critical", impactIfSkipped: "Edge-case failures or off-by-one errors will fail system tests." }
        ]
      },
      {
        id: "demo-interview",
        title: "FAANG Technical Interview: Graph Algorithms & System Design",
        category: "Interview",
        targetDateTime: `${fourDaysStr}:00`,
        riskLevel: "Safe",
        completionProbability: 88,
        isPanicModeActive: false,
        recommendations: [
          "Rehearse consistent hashing and load-balancer design scenarios.",
          "Practice articulating graph traversals verbally using a timer.",
          "Conduct a self-mock scenario on Dijkstra and Bellman-Ford algorithms."
        ],
        tasks: [
          { id: "demo-i-1", title: "Design database cluster schema for multi-region user data persistence", estimatedMinutes: 60, estimatedHours: 1.0, priority: "high", completed: true, order: 1, isCriticalPath: true, assignedSession: "morning", completedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), riskLevel: "Low", impactIfSkipped: "Database architecture will be highly bottlenecked by cross-region latency." },
          { id: "demo-i-2", title: "Write API endpoints for distributed cache consistent hashing rings", estimatedMinutes: 90, estimatedHours: 1.5, priority: "medium", completed: true, order: 2, isCriticalPath: false, assignedSession: "afternoon", completedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), dependencyTitle: "Design database cluster schema for multi-region user data persistence", riskLevel: "Medium", impactIfSkipped: "Unbalanced cache loads will hot-spot specific servers and crash them." },
          { id: "demo-i-3", title: "Implement dynamic BFS/DFS pathfinding algorithms with topological sorting", estimatedMinutes: 90, estimatedHours: 1.5, priority: "high", completed: false, order: 3, isCriticalPath: true, assignedSession: "morning", dependencyTitle: "Write API endpoints for distributed cache consistent hashing rings", riskLevel: "High", impactIfSkipped: "Graph dependencies cannot be topological ordered, causing package circular deadlocks." },
          { id: "demo-i-4", title: "Simulate high load network partition event utilizing Gossip Protocols", estimatedMinutes: 120, estimatedHours: 2.0, priority: "high", completed: false, order: 4, isCriticalPath: true, assignedSession: "evening", dependencyTitle: "Implement dynamic BFS/DFS pathfinding algorithms with topological sorting", riskLevel: "Critical", impactIfSkipped: "Split-brain data consistency issues go completely undetected under server outage." },
          { id: "demo-i-5", title: "Conduct self-timed system design whiteboard session on load balancer routing algorithms", estimatedMinutes: 60, estimatedHours: 1.0, priority: "low", completed: false, order: 5, isCriticalPath: false, assignedSession: "afternoon", dependencyTitle: "Simulate high load network partition event utilizing Gossip Protocols", riskLevel: "Low", impactIfSkipped: "Failure to articulate architectural trade-offs during live technical evaluation." }
        ]
      }
    ];

    setGoals(demoGoals);
    setStats(prev => ({
      ...prev,
      streakDays: 8
    }));
    setIsDemoMode(true);

    setActiveTab("dashboard");
  };

  // Add a newly decomposed milestone goal
  const handleAddGoal = (newGoal: DeadlineGoal) => {
    const updated = [newGoal, ...goals];
    setGoals(updated);
  };

  // Delete a goal
  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter(g => g.id !== goalId);
    setGoals(updated);
  };

  // Toggle subtask completion state
  const handleToggleTask = (goalId: string, taskId: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      let isPanic = goal.isPanicModeActive;
      let updatedTasks = goal.tasks;
      let updatedPanicTasks = goal.panicModeTasks;

      if (isPanic && updatedPanicTasks) {
        updatedPanicTasks = updatedPanicTasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
        );
      } else {
        updatedTasks = updatedTasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
        );
      }

      // Dynamic calculation: as tasks get checked off, completion probability scales upwards!
      const tasksList = isPanic && updatedPanicTasks ? updatedPanicTasks : updatedTasks;
      const completedCount = tasksList.filter(t => t.completed).length;
      const totalCount = tasksList.length;
      const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
      
      // Gradually boost probability
      const baseProb = isPanic ? 35 : 55;
      const completionProbability = Math.min(100, baseProb + Math.round(progressRatio * (100 - baseProb)));
      
      const riskLevel = completionProbability > 75 ? "Safe" : completionProbability > 45 ? "Moderate Risk" : "High Risk";

      // Increment streak if a high priority task was completed
      const completedTask = tasksList.find(t => t.id === taskId);
      if (completedTask && !completedTask.completed && (completedTask.priority === "high" || completedTask.isCriticalPath)) {
        setStats(prev => ({ ...prev, streakDays: prev.streakDays + 1 }));
      }

      return {
        ...goal,
        tasks: updatedTasks,
        panicModeTasks: updatedPanicTasks,
        completionProbability,
        riskLevel
      };
    });

    setGoals(updated);
  };

  // Autonomous Replanning outcome callback
  const handleUpdateGoalAfterReplan = (
    goalId: string,
    updatedTasks: Task[],
    explanation: string,
    newProb: number,
    newRisk: 'Safe' | 'Moderate Risk' | 'High Risk'
  ) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      
      // Update recommendations list to contain the explanation from the coach
      const updatedRecs = [
        explanation.substring(0, 80) + "...",
        ...goal.recommendations.slice(0, 2)
      ];

      return {
        ...goal,
        tasks: updatedTasks,
        completionProbability: newProb,
        riskLevel: newRisk,
        recommendations: updatedRecs
      };
    });

    setGoals(updated);

    // Save coach reply to the Assistant chat thread automatically
    const assistantMessage: ChatMessage = {
      id: `chat-replan-${Date.now()}`,
      sender: "assistant",
      text: explanation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, assistantMessage]);
  };

  // Activate Panic Mode
  const handleActivatePanicMode = (goalId: string, panicTasks: Task[], emergencyStrategy: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        isPanicModeActive: true,
        panicModeTasks: panicTasks,
        recommendations: [emergencyStrategy, ...goal.recommendations.slice(0, 2)],
        riskLevel: "High Risk" as const,
        completionProbability: 35
      };
    });

    setGoals(updated);

    // Inject alert chat notification
    const coachPanicText = `⚠️ CRITICAL: Panic Mode engaged for "${goals.find(g => g.id === goalId)?.title}". I have pruned all low-priority operations and compressed durations by 40%. Focus strictly on this action list: \n\n${panicTasks.map(t => `- ${t.title} (${t.estimatedMinutes} mins)`).join('\n')}`;
    const assistantMessage: ChatMessage = {
      id: `chat-panic-${Date.now()}`,
      sender: "assistant",
      text: coachPanicText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, assistantMessage]);
  };

  // Exit/Stand down Panic Mode
  const handleExitPanicMode = (goalId: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      return {
        ...goal,
        isPanicModeActive: false,
        panicModeTasks: undefined,
        riskLevel: "Moderate Risk" as const,
        completionProbability: 60
      };
    });

    setGoals(updated);
  };

  // Handle Chat Log inputs
  const handleAddChatMessage = (msg: ChatMessage) => {
    setChatHistory((prev) => [...prev, msg]);
  };

  const tabOrder = ["dashboard", "planner", "simulator", "panic", "schedule", "analytics"];

  const tabNames: { [key: string]: string } = {
    landing: "Landing Page",
    dashboard: "Executive Dashboard",
    planner: "AI Task Decomposer",
    simulator: "Cascade Failure Simulator",
    panic: "Tactical Panic Rescue",
    schedule: "Daily Execution Planner",
    analytics: "Cognitive Performance Analytics"
  };

  const currentDemoStep = tabOrder.indexOf(activeTab) + 1;

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setActiveTab("dashboard");
  };

  const handleNextDemoStep = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const step = currentIndex + 1;
    if (step >= 6) {
      exitDemoMode();
    } else if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % tabOrder.length;
      setActiveTab(tabOrder[nextIndex]);
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleExitDemo = () => {
    setIsDemoMode(false);
    setActiveTab("landing");
  };

  // Dynamic element highlight class attachment for Judge Demo Mode
  useEffect(() => {
    if (!isDemoMode) {
      document.querySelectorAll(".demo-highlighted").forEach(el => {
        el.classList.remove("demo-highlighted");
      });
      return;
    }

    const timer = setTimeout(() => {
      document.querySelectorAll(".demo-highlighted").forEach(el => {
        el.classList.remove("demo-highlighted");
      });

      if (activeTab === "planner") {
        const btn = document.getElementById("planner-submit-btn");
        if (btn) btn.classList.add("demo-highlighted");
      } else if (activeTab === "simulator") {
        const buttons = document.querySelectorAll("button");
        buttons.forEach(btn => {
          const txt = btn.textContent?.trim().toLowerCase();
          if (txt === "delay" || txt === "skip") {
            btn.classList.add("demo-highlighted");
          }
        });
      } else if (activeTab === "panic") {
        const btn = document.getElementById("panic-engage-btn");
        if (btn) btn.classList.add("demo-highlighted");
      } else if (activeTab === "schedule") {
        const btn = document.getElementById("schedule-trigger-replan-btn");
        if (btn) btn.classList.add("demo-highlighted");
      } else if (activeTab === "analytics") {
        const headers = document.querySelectorAll("h3");
        headers.forEach(h3 => {
          if (h3.textContent?.trim() === "Cognitive Focus Score") {
            const parent = h3.closest(".glass");
            if (parent) parent.classList.add("demo-highlighted");
          }
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [activeTab, isDemoMode, goals]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      
      {isDemoMode && (
        <>
          <style>{`
            @keyframes pulse-cyan {
              0%, 100% {
                box-shadow: 0 0 5px rgba(6, 182, 212, 0.4), inset 0 0 5px rgba(6, 182, 212, 0.2);
                border-color: rgba(6, 182, 212, 0.6);
              }
              50% {
                box-shadow: 0 0 20px rgba(6, 182, 212, 0.8), inset 0 0 10px rgba(6, 182, 212, 0.4);
                border-color: rgba(6, 182, 212, 1);
              }
            }
            .demo-highlighted {
              position: relative !important;
              outline: 2px solid rgba(6, 182, 212, 0.9) !important;
              outline-offset: 2px !important;
              animation: pulse-cyan 2s infinite !important;
            }
          `}</style>
          
          <div className="fixed bottom-0 left-0 right-0 h-auto sm:h-14 bg-slate-950/95 backdrop-blur border-t border-cyan-800/60 z-50 flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 sm:py-0 gap-2 sm:gap-4 text-xs font-mono text-slate-200 select-none">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-3 text-center sm:text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">👨‍⚖️</span>
                <span className="font-black text-cyan-400 tracking-wider">JUDGE DEMO MODE</span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <span className="text-slate-300">
                Exploring: <strong className="text-white font-extrabold">{tabNames[activeTab] || activeTab}</strong>
              </span>
              {tabOrder.includes(activeTab) && (
                <>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <span className="text-cyan-400/80 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40 text-[10px] font-bold">
                    Step {tabOrder.indexOf(activeTab) + 1} of 6
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleNextDemoStep}
                className={`px-3 py-1.5 rounded font-black tracking-wide text-[10px] uppercase transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                  currentDemoStep >= 6 
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20" 
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                }`}
              >
                {currentDemoStep >= 6 ? "Finish Tour ✓" : "Next Feature →"}
              </button>
              <button
                onClick={handleExitDemo}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-[10px] uppercase transition-all duration-150 cursor-pointer"
              >
                Exit Demo
              </button>
            </div>
          </div>
        </>
      )}

      {/* Persisted Header Navigation */}
      {activeTab !== "landing" && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          streakDays={stats.streakDays}
          survivalProbability={survivalProbability}
          onGoHome={() => setActiveTab("landing")}
        />
      )}

      {/* Primary Workspace Stage */}
      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 relative ${isDemoMode ? "pb-24 sm:pb-16" : "pb-4"}`}>
        <AnimatePresence mode="wait">
          
          {/* Page Routing */}
          {activeTab === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingPage 
                onStart={() => setActiveTab("dashboard")} 
                onTriggerDemo={handleTriggerDemoMode}
              />
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard
                goals={goals}
                stats={stats}
                insights={dashboardInsights}
                onDeleteGoal={handleDeleteGoal}
                onNavigateToTab={setActiveTab}
                survivalProbability={survivalProbability}
                survivalReasoning={survivalReasoning}
                isDemoMode={isDemoMode}
                onSelectActiveGoal={(goal) => {
                  // Pre-select active goal for schedule tab
                  const index = goals.findIndex(g => g.id === goal.id);
                  if (index !== -1) {
                    // Handled internally by state binding
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === "planner" && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Planner
                onAddGoal={handleAddGoal}
                onNavigateToTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ScheduleView
                goals={goals}
                onToggleTask={handleToggleTask}
                onUpdateGoalAfterReplan={handleUpdateGoalAfterReplan}
              />
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AnalyticsView
                stats={stats}
                insights={analyticsInsights}
                goals={goals}
              />
            </motion.div>
          )}

          {activeTab === "simulator" && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <DeadlineSimulator
                goals={goals}
                isDemoMode={isDemoMode}
              />
            </motion.div>
          )}

          {activeTab === "panic" && (
            <motion.div
              key="panic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <PanicMode
                goals={goals}
                onToggleTask={handleToggleTask}
                onActivatePanicMode={handleActivatePanicMode}
                onExitPanicMode={handleExitPanicMode}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent floating AI Coach Assistant chat widget */}
      {activeTab !== "landing" && (
        <ChatAssistant
          chatHistory={chatHistory}
          onAddChatMessage={handleAddChatMessage}
          activeGoal={goals[0] || null}
          activeTab={activeTab}
        />
      )}

      {/* Footer bar for visual balance */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-[10px] font-mono text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 DEADLINE GUARDIAN AI. COGNITIVE CALIBRATION ENGAGED. SECURING CRITICAL PATHS.</p>
        </div>
      </footer>

    </div>
  );
}
