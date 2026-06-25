export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  estimatedHours?: number; // Realistic, in hours
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  order: number;
  isCriticalPath: boolean;
  assignedSession?: 'morning' | 'afternoon' | 'evening';
  completedAt?: string;
  dependencies?: number[]; // Reference to task orders (e.g., [1] means depends on task with order 1)
  dependencyTitle?: string; // What task must be done before this
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  impactIfSkipped?: string;
}

export interface DeadlineGoal {
  id: string;
  title: string;
  targetDateTime: string;
  category: 'Exam' | 'Assignment' | 'Interview' | 'Project' | 'Contest' | 'Meeting' | 'Personal';
  tasks: Task[];
  riskLevel: 'Safe' | 'Moderate Risk' | 'High Risk';
  completionProbability: number;
  recommendations: string[];
  isPanicModeActive: boolean;
  panicModeTasks?: Task[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ProductivityInsight {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'tip' | 'success' | 'info';
  category: 'evening-peak' | 'spike-warning' | 'decomp-tip' | 'general';
}

export interface ProductivityStats {
  completionRate: number; // e.g. 78
  focusScore: number; // e.g. 85
  streakDays: number; // e.g. 5
  overdueCount: number;
  completedTasksCount: number;
  totalTasksCount: number;
  heatmapData: { [day: string]: number }; // e.g., { "Monday": 3, "Tuesday": 5... }
  weeklyTrends: { name: string; completed: number; total: number }[];
}
