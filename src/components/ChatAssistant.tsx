import { MessageSquare, Bot, X, Send, HelpCircle, Sparkles, AlertCircle, RefreshCw, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect, FormEvent } from "react";
import { ChatMessage, DeadlineGoal } from "../types";
import { apiChat } from "../services/api";

interface ChatAssistantProps {
  chatHistory: ChatMessage[];
  onAddChatMessage: (msg: ChatMessage) => void;
  activeGoal: DeadlineGoal | null;
  activeTab?: string;
}

export default function ChatAssistant({ chatHistory, onAddChatMessage, activeGoal, activeTab }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  function startVoiceInput() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported. Please use Chrome browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? prev + " " + transcript : transcript);
      setIsListening(false);
    };

    recognition.onspeechend = () => recognition.stop();

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("Microphone blocked. Please allow microphone access in browser settings.");
      }
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => recognition.start())
        .catch(() => {
          alert("Microphone access denied.");
          setIsListening(false);
        });
    } else {
      recognition.start();
    }
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  // Auto-close on page transition
  useEffect(() => {
    setIsOpen(false);
  }, [activeTab]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isOpen]);

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsgText = inputText.trim();
    setInputText("");

    const userMessage: ChatMessage = {
      id: `chat-user-${Date.now()}`,
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update frontend list
    onAddChatMessage(userMessage);
    setIsLoading(true);

    try {
      // Gather full message context for AI Coach
      const contextHistory = [...chatHistory, userMessage];
      const coachReplyText = await apiChat(contextHistory, activeGoal);

      const assistantMessage: ChatMessage = {
        id: `chat-assistant-${Date.now()}`,
        sender: "assistant",
        text: coachReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      onAddChatMessage(assistantMessage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60]">
      
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="chat-toggle-open-btn"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
          >
            <div className="absolute inset-0 rounded-full bg-cyan-400 blur-sm opacity-30 group-hover:opacity-50 transition-opacity" />
            <MessageSquare className="h-6 w-6 relative z-10 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expandable Chat Sidebar Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] max-h-[calc(100vh-6rem)] sm:max-h-[600px] rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between"
          >
            {/* Header bar */}
            <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-ping" />
                <Bot className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="font-sans font-extrabold text-xs text-white uppercase tracking-wider">AI Execution Strategist</h3>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Strategic Tactical Channel</p>
                </div>
              </div>

              <button
                id="chat-toggle-close-btn"
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-xl transition-all duration-300 border border-slate-700/60 hover:border-rose-500/40 flex items-center justify-center cursor-pointer shadow-sm group"
                title="Close AI Strategist (Esc)"
              >
                <X className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            </div>

            {/* Messages Log area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs relative overflow-hidden leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-900/60 border border-slate-850 text-slate-200 rounded-bl-none"
                    }`}>
                      {msg.text}
                      <span className="block text-[8px] font-mono text-slate-500 text-right mt-1.5 uppercase">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator placeholder */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/60 border border-slate-850 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                    <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                    <span>Analyzing critical parameters...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Conversational shortcuts board */}
            <div className="px-4 py-1 flex flex-wrap gap-1.5 border-t border-slate-900 pt-2.5">
              {(activeTab ? (() => {
                const shortcuts = [
                  { text: "I feel overwhelmed", prompt: "I feel completely overwhelmed. Help me focus." },
                  { text: "What's my priority?", prompt: "Help me prioritize. What is my next critical path task?" }
                ];
                if (activeTab === "dashboard") {
                  shortcuts.push({ text: "Explain survival rating", prompt: "Perform an executive diagnostics analysis on my Master Survival Probability score and tell me how to increase it." });
                } else if (activeTab === "schedule") {
                  shortcuts.push({ text: "Assess schedule risk", prompt: "Look at my active schedule blocks and tell me if there are any critical path sequence bottleneck overlaps." });
                } else if (activeTab === "panic") {
                  shortcuts.push({ text: "Pruning playbook", prompt: "I am in Panic Mode. Give me a high-intensity, stress-free tactical playbook to secure the final submissions." });
                } else if (activeTab === "simulator") {
                  shortcuts.push({ text: "Mitigate failures", prompt: "The simulator predicts potential slippage. Give me 3 concrete cognitive hacks to accelerate execution." });
                } else {
                  shortcuts.push({ text: "I missed work today", prompt: "I missed today's work sessions and I'm falling behind." });
                }
                return shortcuts;
              })() : [
                { text: "I feel overwhelmed", prompt: "I feel completely overwhelmed. Help me focus." },
                { text: "What's my priority?", prompt: "Help me prioritize. What is my next critical path task?" },
                { text: "I missed work today", prompt: "I missed today's work sessions and I'm falling behind." }
              ]).map((shortcut, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(shortcut.prompt)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-[9px] font-mono transition-colors"
                >
                  {shortcut.text}
                </button>
              ))}
            </div>

            {/* Input Submission Bar */}
            {isListening && (
              <div className="px-3 py-1 text-[10px] font-mono text-rose-400 animate-pulse text-center">
                🎤 Listening... speak now. Tap mic to stop.
              </div>
            )}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-900 bg-slate-950 flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <input
                  id="chat-text-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask your tactical coach..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-all duration-200 shrink-0 border ${
                    isListening
                      ? "bg-rose-950/60 border-rose-700 text-rose-400 animate-pulse"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-700"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening
                    ? <MicOff className="h-4 w-4" />
                    : <Mic className="h-4 w-4" />
                  }
                </button>
                <button
                  id="chat-submit-btn"
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
