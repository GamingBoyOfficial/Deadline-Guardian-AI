import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

// Lazy initialize Gemini client to prevent crashes if key is not set
let aiClient: GoogleGenAI | null = null;

function getGeminiAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please set your Gemini API Key in the Settings > Secrets panel of Google AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. AI Task Decomposition
  app.post("/api/decompose", async (req, res) => {
    try {
      const { title, category, targetDateTime } = req.body;
      if (!title || !category || !targetDateTime) {
        return res.status(400).json({ error: "Missing required fields: title, category, targetDateTime" });
      }

      const ai = getGeminiAI();
      const prompt = `Decompose the following goal into a sequence of actionable, highly tactical, and context-aware subtasks.

Goal: "${title}"
Category: ${category}
Deadline: ${targetDateTime}

As an elite performance and execution coach, you must intelligently recognize different task categories and generate context-aware subtasks tailored specifically to the goal.

Follow these strict category-specific guidelines:
1. For study-related tasks, exams, contests, or test prep (e.g. Category is "Exam", "Contest", or titles focusing on studying, revising, quizzes, or topics):
Your generated subtasks MUST focus on and contain specific, distinct steps for reading, note making, practice questions, and mock tests.
- Example for a Coding Contest Prep goal:
  * "Review DP state design"
  * "Solve 1D DP patterns" (depends on DP state design)
  * "Solve knapsack variations" (depends on 1D DP)
  * "Solve digit DP" (depends on knapsack)
  * "Complete timed mock contest" (depends on digit DP)

2. For coding-related tasks, software development, or programming (e.g. Category is "Project" or titles mentioning code, app, api, programming, refactoring, database, frontend, backend):
Your generated subtasks MUST focus on and contain specific, distinct steps for problem breakdown, implementation, testing, and debugging.
- Example for a Machine Learning Assignment goal:
  * "Design neural network architecture & specify layer dimensions"
  * "Implement forward propagation functions" (depends on architecture)
  * "Implement backpropagation gradient formulas" (depends on forward propagation)
  * "Validate gradients numerically with finite differences" (depends on backpropagation)
  * "Build training loop and implement optimization algorithms" (depends on validation)
  * "Tune hyperparameters and plot training curves" (depends on training loop)
  * "Analyze results & write findings report" (depends on training loop)

CRITICAL SPECIFICITY, QUALITY, AND DEPENDENCY CONSTRAINTS:
- EVERY subtask must have a chronological execution order and a list of dependent tasks (represented as an array of 'order' numbers).
- Avoid generic, low-effort subtasks like 'blueprint', 'implementation', or 'formatting' when they are not directly relevant to the user's specific goal.
- Every subtask must be highly specific to the actual goal entered by the user. Do not return generic phrases like 'Step 1: Implementation' or 'Step 2: Testing'. Instead, tailor them specifically to the user's title.
- Identify which tasks represent the "critical path" (cannot be skipped or delayed without missing the deadline).
- Provide a success probability score (1-100) and risk assessment based on the deadline. Give 3 actionable coaching tips to avoid procrastination.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "A unique identifier string for the task (e.g., '1')" },
                    title: { type: Type.STRING, description: "A highly actionable, concrete, specific step (e.g. 'Review Lecture 4' rather than 'Study')" },
                    duration: { type: Type.INTEGER, description: "Realistic time required in minutes (15 to 240)" },
                    completed: { type: Type.BOOLEAN, description: "Default false" },
                    // Extra compatibility properties for frontend parsing:
                    estimatedMinutes: { type: Type.INTEGER },
                    priority: { type: Type.STRING, description: "Priority level: high, medium, or low" },
                    isCriticalPath: { type: Type.BOOLEAN, description: "True if task is part of the absolute critical path" },
                    order: { type: Type.INTEGER, description: "Chronological sequence starting at 1" },
                    dependencies: {
                      type: Type.ARRAY,
                      items: { type: Type.INTEGER },
                      description: "List of 'order' numbers of other subtasks this task directly depends on"
                    }
                  },
                  required: ["id", "title", "duration", "completed", "estimatedMinutes", "priority", "isCriticalPath", "order", "dependencies"]
                }
              },
              completionProbability: { type: Type.INTEGER, description: "Probability of completing this before deadline (1 to 100)" },
              riskLevel: { type: Type.STRING, description: "Risk category: Safe, Moderate Risk, or High Risk" },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "One of: motivation, strategy, or warning" },
                    text: { type: Type.STRING, description: "Specific coaching tip text" }
                  },
                  required: ["type", "text"]
                }
              }
            },
            required: ["tasks", "completionProbability", "riskLevel", "recommendations"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/decompose:", error);
      res.status(500).json({ error: error.message || "Failed to decompose task using Gemini AI" });
    }
  });

  // 2. Autonomous Replanning
  app.post("/api/replan", async (req, res) => {
    try {
      const { goal, missedActionDescription } = req.body;
      if (!goal || !missedActionDescription) {
        return res.status(400).json({ error: "Missing required fields: goal, missedActionDescription" });
      }

      const ai = getGeminiAI();
      const prompt = `The user missed, delayed, or encountered an issue: "${missedActionDescription}"

Current Goal: "${goal.title}" (Category: ${goal.category}, Due: ${goal.targetDateTime})
Current tasks state:
${JSON.stringify(goal.tasks, null, 2)}

As an elite execution strategist, recalculate the remaining workload to recover from this setback.
You may compress estimated minutes of low-priority tasks, drop non-critical tasks if absolutely necessary to hit the deadline, or shift schedules. Protect critical path tasks!

You must intelligently recognize different task categories and ensure the recalculated subtasks are context-aware and highly specific to the actual goal:
- For study tasks: reading, revision, note making, practice questions
- For coding tasks: problem breakdown, implementation, testing, debugging
- For assignments: research, drafting, implementation, review, submission
- For interview preparation: topic review, mock interview, problem solving, revision

Avoid generic, context-free subtasks like 'blueprint', 'implementation', or 'formatting' if they do not fit the goal's context. Tailor every task directly to the goal title.
Generate the adjusted schedule and explain exactly what changes were made, and why, in an authoritative, supportive, yet ultra-calm coaching tone.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "Maintain existing task IDs where possible, or assign a random index/id if newly generated" },
                    title: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                    priority: { type: Type.STRING },
                    completed: { type: Type.BOOLEAN },
                    isCriticalPath: { type: Type.BOOLEAN },
                    order: { type: Type.INTEGER }
                  },
                  required: ["id", "title", "estimatedMinutes", "priority", "completed", "isCriticalPath", "order"]
                }
              },
              explanation: { type: Type.STRING, description: "Explanation of exactly what was compressed, shifted, or optimized to maintain the deadline" },
              completionProbability: { type: Type.INTEGER },
              riskLevel: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["tasks", "explanation", "completionProbability", "riskLevel", "recommendations"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/replan:", error);
      res.status(500).json({ error: error.message || "Failed to calculate recovery plan" });
    }
  });

  // 3. Deadline Risk Prediction
  app.post("/api/predict-risk", async (req, res) => {
    try {
      const { goals } = req.body;
      if (!goals || !Array.isArray(goals)) {
        return res.status(400).json({ error: "Missing or invalid goals array" });
      }

      const ai = getGeminiAI();
      const prompt = `Evaluate the schedule risk and completion probability for the following deadlines:
${JSON.stringify(goals, null, 2)}

Provide an objective mathematical and structural evaluation. Determine risk levels and provide the precise success probabilities. Include key recommendations for each.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              evaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    goalId: { type: Type.STRING },
                    completionProbability: { type: Type.INTEGER },
                    riskLevel: { type: Type.STRING },
                    recommendations: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["goalId", "completionProbability", "riskLevel", "recommendations"]
                }
              }
            },
            required: ["evaluations"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/predict-risk:", error);
      res.status(500).json({ error: error.message || "Failed to predict risk" });
    }
  });

  // 4. Panic Mode (Signature Feature)
  app.post("/api/panic-mode", async (req, res) => {
    try {
      const { goal, hoursLeft } = req.body;
      if (!goal) {
        return res.status(400).json({ error: "Missing goal data for Panic Mode" });
      }

      const ai = getGeminiAI();
      const prompt = `CRITICAL PANIC MODE TRIGGERED.
Goal: "${goal.title}" (Category: ${goal.category}, Due in ${hoursLeft || 8} hours!)
Current Tasks:
${JSON.stringify(goal.tasks, null, 2)}

You are an Elite Deadline Combat Coach. There is no room for error.
Generate a ruthlessly stripped-down, high-intensity compressed focus plan.
Identify only the highest Return-on-Investment (ROI) tasks. Drop, trim, or compress all non-critical work.
Generate a list of compressed, high-ROI tasks fitting within the final hours window.

Ensure all generated panic tasks are highly specific to the actual goal entered by the user and context-aware. Avoid generic, low-effort subtasks:
- For study goals: generate high-intensity revision and practice questions
- For coding goals: generate core implementation, focused testing, and critical debugging
- For assignments: generate focused drafting, review, and absolute final submission steps
- For interviews: generate key topic reviews, rapid problem solving, and behavioral revision

Write a powerful, dramatic, focused, calm-under-fire emergency strategy directive. No filler. Only focus on what will maximize outcomes now.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              panicTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                    priority: { type: Type.STRING },
                    isCriticalPath: { type: Type.BOOLEAN },
                    order: { type: Type.INTEGER }
                  },
                  required: ["title", "estimatedMinutes", "priority", "isCriticalPath", "order"]
                }
              },
              emergencyStrategy: { type: Type.STRING, description: "Ruthless, inspiring, ultra-focused coaching quote and operational guide" }
            },
            required: ["panicTasks", "emergencyStrategy"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/panic-mode:", error);
      res.status(500).json({ error: error.message || "Failed to engage Panic Mode" });
    }
  });

  // 5. Conversational AI Assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, currentGoal } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Missing messages history" });
      }

      const ai = getGeminiAI();
      const lastMessage = messages[messages.length - 1]?.text || "";

      // Format conversation history for Gemini
      const formattedHistory = messages.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Coach'}: ${msg.text}`
      ).join("\n");

      const systemInstruction = `You are the Elite Execution Strategist and lead coach of Deadline Guardian AI.
Your personality:
- Highly analytical, direct, ultra-calm under extreme pressure.
- Decisive, strategic, highly actionable.
- Speaks with authoritative yet supportive wisdom.
- Never gives fluff, generic cheerleading, or long friendly introductory remarks.
- Gets straight to the solution, prioritizing the "critical path".

Current active user goal being managed: ${currentGoal ? JSON.stringify(currentGoal) : "No specific active goal being evaluated yet."}

Respond directly to the user's struggle. Keep your answer concise (under 120 words), structured with short bullet points where needed, and highly psychological yet practical.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Conversation history:\n${formattedHistory}\n\nLast Message: "${lastMessage}"`,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      res.json({ text: response.text || "I am analyzing your timeline. Keep pushing forward." });
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      res.status(500).json({ error: error.message || "Coach was unable to respond. Stay focused and carry on." });
    }
  });

  // 6. AI Insights Panel
  app.post("/api/insights", async (req, res) => {
    try {
      const { stats } = req.body;
      if (!stats) {
        return res.status(400).json({ error: "Missing productivity statistics" });
      }

      const ai = getGeminiAI();
      const prompt = `Generate 4 proactive, futuristic AI productivity insights for our insights board.
User current stats:
Completion Rate: ${stats.completionRate}%
Focus Score: ${stats.focusScore}/100
Current Streak: ${stats.streakDays} days
Completed Tasks: ${stats.completedTasksCount}
Total Tasks: ${stats.totalTasksCount}

Create highly tailored insights referencing typical student/developer/professional patterns (e.g., peak evening focus, workload spikes, decomposition strategies, recovery streaks). Make them sound sophisticated and personalized.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, description: "Must be one of: warning, tip, success, or info" },
                    category: { type: Type.STRING, description: "Must be one of: evening-peak, spike-warning, decomp-tip, or general" }
                  },
                  required: ["title", "description", "type", "category"]
                }
              }
            },
            required: ["insights"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/insights:", error);
      res.status(500).json({ error: error.message || "Failed to generate insights" });
    }
  });

  // 7. AI Voice Command Transcription & Goal Extraction
  app.post("/api/voice-command", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Missing uploaded audio file" });
      }

      const ai = getGeminiAI();
      const audioBuffer = req.file.buffer;
      const mimeType = req.file.mimetype || "audio/webm";

      const prompt = `You are an elite productivity and scheduling voice coach.
Listen to the user's recorded audio describing a task or milestone they want to set up.
1. Transcribe the spoken text exactly into the "transcript" field.
2. Formulate a highly specific, clean, and concrete title for the goal.
3. Categorize it into one of these strict values: "Exam", "Assignment", "Interview", "Project", "Contest", "Meeting", "Personal".
4. Determine the target due date and time if mentioned. If not mentioned or implied, default it to 2 days from now in standard YYYY-MM-DDTHH:MM format.

Respond ONLY with raw, valid JSON:
{
  "transcript": "exactly what the user said",
  "title": "extracted milestone title",
  "category": "Project",
  "targetDateTime": "2026-06-27T23:59"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: audioBuffer.toString("base64"),
              mimeType: mimeType
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/voice-command:", error);
      res.status(500).json({ error: error.message || "Failed to process voice command" });
    }
  });

  // Serve static assets and mount Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Deadline Guardian AI Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
