import { useState, useRef, useEffect } from "react";
import { Mic, Square, Sparkles, Loader2, Play, Volume2, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiVoiceCommand } from "../services/api";

interface VoicePlannerProps {
  onGoalParsed: (parsed: {
    title: string;
    category: 'Exam' | 'Assignment' | 'Interview' | 'Project' | 'Contest' | 'Meeting' | 'Personal';
    targetDateTime: string;
  }) => void;
}

export default function VoicePlanner({ onGoalParsed }: VoicePlannerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [parsedGoal, setParsedGoal] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Recording stopwatch timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    setTranscript(null);
    setParsedGoal(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for Safari/unsupported browser containers
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access failed", err);
      setError("Unable to access microphone. Please confirm browser microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await apiVoiceCommand(audioBlob);
      setTranscript(result.transcript);
      setParsedGoal(result);
      
      // Send parsed values straight to the configuration form
      onGoalParsed({
        title: result.title,
        category: result.category,
        targetDateTime: result.targetDateTime
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse audio commands. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-sans font-bold text-slate-200 tracking-wide uppercase">AI Voice Planner</span>
        </div>
        <div className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950/40 text-cyan-400 border border-cyan-800/30">
          GEMINI MULTIMODAL
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        {/* Record state animations */}
        <div className="relative flex items-center justify-center">
          <AnimatePresence>
            {isRecording && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className="absolute h-10 w-10 rounded-full bg-cyan-500/20"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.6 }}
                  className="absolute h-10 w-10 rounded-full bg-cyan-500/10"
                />
              </>
            )}
          </AnimatePresence>

          <button
            id="voice-planner-mic-btn"
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative z-10 p-4 rounded-full transition-all duration-300 shadow-md ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
                : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/25 hover:scale-105"
            } disabled:opacity-50 disabled:scale-100 flex items-center justify-center`}
          >
            {isRecording ? (
              <Square className="h-5 w-5 text-white fill-white" />
            ) : isProcessing ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </button>
        </div>

        {/* Info panel */}
        <div className="text-center">
          {isRecording ? (
            <div className="space-y-1">
              <span className="text-rose-400 font-mono text-xs tracking-wider font-bold">LIVE RECORDING</span>
              <p className="text-[10px] text-slate-400 font-mono">Timer: {formatTime(seconds)}</p>
            </div>
          ) : isProcessing ? (
            <div className="space-y-1">
              <span className="text-cyan-400 font-mono text-xs tracking-wider animate-pulse flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3 animate-spin" /> ANALYZING AUDIO VOICE VIA GEMINI...
              </span>
              <p className="text-[10px] text-slate-400">Transcribing and formulating strategic goals...</p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-slate-300 text-xs">Tap mic to speak your milestone details</span>
              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                "Draft NEET revision chemistry syllabus by tomorrow evening" or "Complete React coding test prep by Friday noon"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message feedback logs */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-2 p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-300 text-[11px]"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <p>{error}</p>
          </motion.div>
        )}

        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-[11px]"
          >
            <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono tracking-wider uppercase font-bold">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Spoken Transcript
            </div>
            <p className="text-slate-300 italic leading-relaxed">"{transcript}"</p>
            
            {parsedGoal && (
              <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="block text-slate-500 font-mono uppercase tracking-wider text-[8px]">Goal Formulated</span>
                  <span className="text-slate-200 font-medium truncate block">{parsedGoal.title}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-mono uppercase tracking-wider text-[8px]">Category / Time</span>
                  <span className="text-slate-300 truncate block">
                    {parsedGoal.category} • {parsedGoal.targetDateTime ? new Date(parsedGoal.targetDateTime).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
