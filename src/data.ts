import { DeadlineGoal, ChatMessage, ProductivityInsight, ProductivityStats } from "./types";

export const INITIAL_GOALS: DeadlineGoal[] = [
  {
    id: "ml-assignment",
    title: "Machine Learning Assignment: Deep Neural Networks from Scratch",
    targetDateTime: "2026-06-26T23:59:00",
    category: "Assignment",
    riskLevel: "Moderate Risk",
    completionProbability: 64,
    recommendations: [
      "Decompose the training loops early to identify shape mismatch errors",
      "Compress evaluation metrics research; focus strictly on PyTorch built-ins",
      "Protect 2 hours tonight for debugging cross-entropy loss functions"
    ],
    isPanicModeActive: false,
    tasks: [
      { id: "ml-1", title: "Implement linear feedforward neural layer weight initializations", estimatedMinutes: 90, estimatedHours: 1.5, priority: "high", completed: true, order: 1, isCriticalPath: true, assignedSession: "morning", riskLevel: "Low", impactIfSkipped: "Model weights will be zero, causing gradient stagnation." },
      { id: "ml-2", title: "Write ReLU activation forward and backward gradient derivatives", estimatedMinutes: 60, estimatedHours: 1.0, priority: "medium", completed: true, order: 2, isCriticalPath: false, assignedSession: "afternoon", dependencyTitle: "Implement linear feedforward neural layer weight initializations", riskLevel: "Medium", impactIfSkipped: "Activations won't propagate, stalling model training completely." },
      { id: "ml-3", title: "Implement gradient descent optimizer backpropagation weight updates", estimatedMinutes: 120, estimatedHours: 2.0, priority: "high", completed: false, order: 3, isCriticalPath: true, assignedSession: "evening", dependencyTitle: "Write ReLU activation forward and backward gradient derivatives", riskLevel: "High", impactIfSkipped: "Loss gradients won't update network parameters, yielding zero convergence." },
      { id: "ml-4", title: "Validate model accuracy on test dataset and log convergence metrics", estimatedMinutes: 90, estimatedHours: 1.5, priority: "high", completed: false, order: 4, isCriticalPath: true, assignedSession: "morning", dependencyTitle: "Implement gradient descent optimizer backpropagation weight updates", riskLevel: "Critical", impactIfSkipped: "Cannot verify model classification correctness or prevent overfitting issues." },
      { id: "ml-5", title: "Build React component for training monitoring and loss trajectory chart", estimatedMinutes: 150, estimatedHours: 2.5, priority: "medium", completed: false, order: 5, isCriticalPath: false, assignedSession: "afternoon", dependencyTitle: "Validate model accuracy on test dataset and log convergence metrics", riskLevel: "Low", impactIfSkipped: "No visual telemetry to verify loss reduction during mock training." },
      { id: "ml-6", title: "Write automated shell script to package submission files into ZIP archive", estimatedMinutes: 30, estimatedHours: 0.5, priority: "low", completed: false, order: 6, isCriticalPath: false, assignedSession: "evening", dependencyTitle: "Build React component for training monitoring and loss trajectory chart", riskLevel: "Low", impactIfSkipped: "Manual packaging increases submission delay risk and potential format errors." }
    ]
  },
  {
    id: "dsa-interview",
    title: "FAANG Technical Interview Preparation: Graph Algorithms & System Design",
    targetDateTime: "2026-06-29T10:00:00",
    category: "Interview",
    riskLevel: "Safe",
    completionProbability: 88,
    isPanicModeActive: false,
    recommendations: [
      "Review consistent hashing and load balancer design patterns",
      "Solve at least 2 medium tree traversal questions on LeetCode",
      "Take a timed mock interview on Exponent to reduce stress"
    ],
    tasks: [
      { id: "dsa-1", title: "Design database schema for distributed user authentication and session caches", estimatedMinutes: 120, estimatedHours: 2.0, priority: "high", completed: true, order: 1, isCriticalPath: true, assignedSession: "morning", riskLevel: "Low", impactIfSkipped: "System architecture is prone to single-point scaling bottlenecks." },
      { id: "dsa-2", title: "Write unit tests for Trie prefix string search autocompletion API endpoints", estimatedMinutes: 90, estimatedHours: 1.5, priority: "high", completed: true, order: 2, isCriticalPath: true, assignedSession: "afternoon", dependencyTitle: "Design database schema for distributed user authentication and session caches", riskLevel: "Medium", impactIfSkipped: "Autocompletion service may return incorrect edge-case query routes." },
      { id: "dsa-3", title: "Implement Dijkstra pathfinding optimizer for route selection", estimatedMinutes: 120, estimatedHours: 2.0, priority: "medium", completed: false, order: 3, isCriticalPath: false, assignedSession: "evening", dependencyTitle: "Write unit tests for Trie prefix string search autocompletion API endpoints", riskLevel: "High", impactIfSkipped: "Core routing services fail to identify optimal paths for user navigation." },
      { id: "dsa-4", title: "Conduct system design mockup evaluating load balancers and Gossip protocol consistency", estimatedMinutes: 150, estimatedHours: 2.5, priority: "high", completed: false, order: 4, isCriticalPath: true, assignedSession: "morning", dependencyTitle: "Implement Dijkstra pathfinding optimizer for route selection", riskLevel: "Critical", impactIfSkipped: "Failure to diagnose edge-case scale failures in high throughput scenarios." }
    ]
  },
  {
    id: "contest-prep",
    title: "Global Algorithmic Coding Contest: Dynamic Programming Prep",
    targetDateTime: "2026-06-27T18:00:00",
    category: "Contest",
    riskLevel: "High Risk",
    completionProbability: 38,
    recommendations: [
      "Analyze previous Round 1 editorials for missing DP strategies",
      "Set up dynamic layout macros and speed IO templates",
      "Enter high-focus lock mode to finish practice sets"
    ],
    isPanicModeActive: false,
    tasks: [
      { id: "cp-1", title: "Implement custom fast I/O buffered stream reader and hash maps in C++", estimatedMinutes: 90, estimatedHours: 1.5, priority: "high", completed: false, order: 1, isCriticalPath: true, assignedSession: "morning", riskLevel: "Medium", impactIfSkipped: "Time Limit Exceeded errors due to heavy standard input/output overhead." },
      { id: "cp-2", title: "Solve segment tree range query dynamic state transitions problems", estimatedMinutes: 150, estimatedHours: 2.5, priority: "low", completed: false, order: 2, isCriticalPath: false, assignedSession: "afternoon", dependencyTitle: "Implement custom fast I/O buffered stream reader and hash maps in C++", riskLevel: "High", impactIfSkipped: "Sub-optimal range processing algorithms cause compilation timeouts." },
      { id: "cp-3", title: "Validate segment tree edge-case inputs through automated stress-testing scripts", estimatedMinutes: 180, estimatedHours: 3.0, priority: "high", completed: false, order: 3, isCriticalPath: true, assignedSession: "evening", dependencyTitle: "Solve segment tree range query dynamic state transitions problems", riskLevel: "Critical", impactIfSkipped: "Undetected off-by-one errors will fail system validation phase." }
    ]
  }
];

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "chat-1",
    sender: "assistant",
    text: "Greetings. I am your Elite Execution Coach. My objective is simple: secure your upcoming deadlines and optimize your cognitive output. What is causing friction in your workflow today?",
    timestamp: "10:00"
  }
];

export const INITIAL_INSIGHTS: ProductivityInsight[] = [
  {
    id: "ins-1",
    title: "Evening Focus Peak Detected",
    description: "Your completion rate is 32% higher on tasks tackled between 19:00 and 22:30. Consider scheduling high-difficulty algorithms for evening blocks.",
    type: "success",
    category: "evening-peak"
  },
  {
    id: "ins-2",
    title: "Workload Spike: Thursday Pressure",
    description: "You have 3 concurrent tasks due on Friday. We predict extreme overload starting tomorrow afternoon. Recommend decomposing 1 task tonight.",
    type: "warning",
    category: "spike-warning"
  },
  {
    id: "ins-3",
    title: "Micro-Decomposition Pays Off",
    description: "Tasks with estimated durations under 45 minutes are 94% more likely to be completed on time. Keep breaking larger tasks down.",
    type: "tip",
    category: "decomp-tip"
  }
];

export const INITIAL_STATS: ProductivityStats = {
  completionRate: 72,
  focusScore: 84,
  streakDays: 6,
  overdueCount: 1,
  completedTasksCount: 5,
  totalTasksCount: 13,
  heatmapData: {
    "Mon": 4,
    "Tue": 6,
    "Wed": 2,
    "Thu": 7,
    "Fri": 5,
    "Sat": 3,
    "Sun": 1
  },
  weeklyTrends: [
    { name: "Week 1", completed: 8, total: 12 },
    { name: "Week 2", completed: 11, total: 15 },
    { name: "Week 3", completed: 14, total: 18 },
    { name: "Week 4", completed: 15, total: 20 },
    { name: "Week 5", completed: 18, total: 22 }
  ]
};

// LocalStorage helpers
export function getSavedGoals(): DeadlineGoal[] {
  const saved = localStorage.getItem("deadline_guardian_goals");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_GOALS;
}

export function saveGoals(goals: DeadlineGoal[]) {
  localStorage.setItem("deadline_guardian_goals", JSON.stringify(goals));
}

export function getSavedChat(): ChatMessage[] {
  const saved = localStorage.getItem("deadline_guardian_chat");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_CHAT;
}

export function saveChat(chat: ChatMessage[]) {
  localStorage.setItem("deadline_guardian_chat", JSON.stringify(chat));
}

export function getSavedInsights(): ProductivityInsight[] {
  const saved = localStorage.getItem("deadline_guardian_insights");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_INSIGHTS;
}

export function saveInsights(insights: ProductivityInsight[]) {
  localStorage.setItem("deadline_guardian_insights", JSON.stringify(insights));
}

export function getSavedStats(): ProductivityStats {
  const saved = localStorage.getItem("deadline_guardian_stats");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_STATS;
}

export function saveStats(stats: ProductivityStats) {
  localStorage.setItem("deadline_guardian_stats", JSON.stringify(stats));
}
