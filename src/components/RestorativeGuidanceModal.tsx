import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Heart,
  Wind,
  Eye,
  Moon,
  Clock,
  Compass,
  Zap,
  Activity,
  ArrowRight,
  Plus,
  Trash2
} from "lucide-react";
import { sound } from "../lib/audio";

export interface RestorativeProtocol {
  id: string;
  name: string;
  category: "Neuro-Rest" | "Autonomic Reset" | "Optic Pacing" | "Circadian Buffer";
  durationMinutes: number;
  evidence: string;
  benefitBurnout: number;
  benefitResilience: number;
  icon: React.ReactNode;
}

interface ProtocolStage {
  title: string;
  directive: string;
  purpose: string;
  durationSeconds: number;
  checkpointPrompt?: string;
}

interface RestorativeGuidanceModalProps {
  protocol: RestorativeProtocol;
  onClose: () => void;
  onComplete: (protocol: RestorativeProtocol) => void;
}

export const RestorativeGuidanceModal: React.FC<RestorativeGuidanceModalProps> = ({
  protocol,
  onClose,
  onComplete
}) => {
  const totalSecondsInitial = protocol.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSecondsInitial);
  const [isRunning, setIsRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [amberFilterActive, setAmberFilterActive] = useState(false);

  // Physiological sigh states (3.0s inhale, 1.0s top-up inhale, 6.5s exhale)
  const [sighPhase, setSighPhase] = useState<"inhale1" | "inhale2" | "exhale">("inhale1");
  const [sighCycleCount, setSighCycleCount] = useState(1);
  const [sighPhaseProgress, setSighPhaseProgress] = useState(0);

  // Multi-stage states for NSDR, Optic, Evening Decoupling
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<Record<number, boolean>>({});

  // Evening Decoupling brain dump scratchpad
  const [dumpItems, setDumpItems] = useState<string[]>([
    "Review tomorrow's morning ICU bedside handover list",
    "Close out remaining diagnostic case notes"
  ]);
  const [newDumpInput, setNewDumpInput] = useState("");

  // Define structured clinical stages per protocol
  const stages: ProtocolStage[] = React.useMemo(() => {
    switch (protocol.id) {
      case "proto-nsdr":
        return [
          {
            title: "Stage 1: Somatic Grounding & Posture Settling",
            directive: "Lie flat on your back or recline comfortably with uncrossed limbs. Intentionally release jaw tension, let your tongue drop away from the palate, and let eye muscles go limp.",
            purpose: "Disengages motor cortex striatal motor arousal and eliminates micro-tremor sympathetic feedback.",
            durationSeconds: 180, // 3 min
            checkpointPrompt: "Limbs uncrossed, jaw slackened, and eyelids resting gently."
          },
          {
            title: "Stage 2: Systematic Peripheral Somatosensory Scan",
            directive: "Systematically sweep attention across your body's contact points: heels, calves, lower back, shoulder blades, and palms. Observe sensory contact without moving.",
            purpose: "Transitions cortical activity from top-down executive task networks to idle somatosensory receiving.",
            durationSeconds: 360, // 6 min (to 9 min)
            checkpointPrompt: "Weight of the body completely anchored to gravity."
          },
          {
            title: "Stage 3: Hypnagogic Delta/Theta Neuro-Rest",
            directive: "Allow thoughts and clinical scenarios to drift past without grasping. Suspend all active deduction or problem solving. Rest in non-judgmental awareness.",
            purpose: "Clears extracellular adenosine buildup and replenishes striatal dopamine reserves in the basal ganglia.",
            durationSeconds: 480, // 8 min (to 17 min)
            checkpointPrompt: "Effortless resting state; clinical problems gently suspended."
          },
          {
            title: "Stage 4: Gentle Re-Emergence & Alertness Reactivation",
            directive: "Gradually deepen your nasal breathing. Introduce tiny micro-movements to your fingertips and toes. Open eyes smoothly to ambient light.",
            purpose: "Ensures smooth autonomic re-entry without post-rest disorientation or sympathetic overshoot.",
            durationSeconds: 180, // 3 min (to 20 min)
            checkpointPrompt: "Alertness restored with clear, calm focus."
          }
        ];

      case "proto-optic":
        return [
          {
            title: "Stage 1: Gaze Expansion & Horizon Scan",
            directive: "Step outside or face an open distant viewpoint. Elevate your gaze toward the horizon or tree line. Soften your central focal tunnel into wide panoramic 180° peripheral vision.",
            purpose: "Disengages foveal central acuity to silence amygdalar threat detection and reduce vigilance fatigue.",
            durationSeconds: 300, // 5 min
            checkpointPrompt: "Peripheral edges of the visual field actively perceived."
          },
          {
            title: "Stage 2: Cadence Pacing & Dynamic Lateral Optic Flow",
            directive: "Maintain an effortless, rhythmic walking cadence. Let trees, architecture, and clouds flow past your visual sides without locking eyes onto any single object.",
            purpose: "Bilateral retinal motion stimulates calm parasympathetic signaling and clears working memory bottleneck.",
            durationSeconds: 300, // 5 min
            checkpointPrompt: "Smooth bilateral visual flow established at steady pace."
          },
          {
            title: "Stage 3: Somatic Integration & Return Transition",
            directive: "Continue gentle strides while taking slow, deep nasal breaths. Sense the ambient temperature and fresh air before returning to your study desk.",
            purpose: "Consolidates prefrontal decompression, priming working memory for high-yield study blocks.",
            durationSeconds: 300, // 5 min
            checkpointPrompt: "Mental scratchpad cleared and ready for focused work."
          }
        ];

      case "proto-buffer":
        return [
          {
            title: "Stage 1: Cognitive Offload & Working Memory Dump",
            directive: "Offload any lingering clinical dilemmas, pending tasks, or tomorrow's to-dos into the holding tray below. Empty your working memory so your brain stops rehearsing them.",
            purpose: "Inhibits default mode network (DMN) rumination and prevents bedtime cognitive perseveration.",
            durationSeconds: 600, // 10 min
            checkpointPrompt: "Pending open loops transferred to written holding tray."
          },
          {
            title: "Stage 2: Photobiological Shift & Screen Attenuation",
            directive: "Dim room lighting and turn off blue-dominant screens. Switch to warm ambient lamps or activate our soothing amber circadian filter mode below.",
            purpose: "Shields melanopsin-expressing retinal ganglion cells to allow endogenous melatonin synthesis to rise.",
            durationSeconds: 600, // 10 min
            checkpointPrompt: "Lighting dimmed to warm amber spectrum (< 3000K)."
          },
          {
            title: "Stage 3: Somatosensory Cool-Down & Parasympathetic Shift",
            directive: "Recline in comfortable stillness. Keep nasal breathing slow (< 6 breaths per minute). Allow body temperature to cool slightly and embrace restorative rest.",
            purpose: "Facilitates autonomic downregulation and prepares neural architecture for slow-wave non-REM sleep.",
            durationSeconds: 600, // 10 min
            checkpointPrompt: "Respiration slow and body fully relaxed."
          }
        ];

      default: // proto-sigh
        return [
          {
            title: "Continuous Guided Vagal Reset",
            directive: "Synchronize breath with the visual & acoustic pacer: Two swift nasal inhalations followed by one prolonged, unhurried oral exhalation.",
            purpose: "Maximally inflates collapsed pulmonary alveoli and drives vagal nerve brake to slow heart rate.",
            durationSeconds: totalSecondsInitial
          }
        ];
    }
  }, [protocol.id, totalSecondsInitial]);

  // Overall Countdown Timer
  useEffect(() => {
    let timer: number | null = null;
    if (isRunning && secondsLeft > 0 && !isCompleted) {
      timer = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, secondsLeft, isCompleted]);

  // Auto-advance stages for multi-stage protocols as time elapses
  useEffect(() => {
    if (protocol.id === "proto-sigh" || stages.length <= 1) return;

    const elapsed = totalSecondsInitial - secondsLeft;
    let accumulated = 0;
    let calculatedStage = 0;

    for (let i = 0; i < stages.length; i++) {
      accumulated += stages[i].durationSeconds;
      if (elapsed < accumulated || i === stages.length - 1) {
        calculatedStage = i;
        break;
      }
    }

    if (calculatedStage !== currentStageIndex) {
      setCurrentStageIndex(calculatedStage);
      if (soundEnabled) {
        sound.playRestorativeChime("phase");
      }
    }
  }, [secondsLeft, stages, currentStageIndex, totalSecondsInitial, protocol.id, soundEnabled]);

  // Physiological Sigh Respiratory Pacer Loop (3.0s inhale -> 1.0s top-up -> 6.5s exhale)
  const sighTimerRef = useRef<{ phaseStartTime: number; animFrame?: number }>({
    phaseStartTime: Date.now()
  });

  useEffect(() => {
    if (protocol.id !== "proto-sigh" || !isRunning || isCompleted) return;

    const phaseDurations = {
      inhale1: 3000,
      inhale2: 1000,
      exhale: 6500
    };

    let active = true;

    const runBreathingCycle = () => {
      if (!active) return;
      const now = Date.now();
      const elapsedInPhase = now - sighTimerRef.current.phaseStartTime;
      const targetDuration = phaseDurations[sighPhase];

      // Update smooth progress (0 to 1)
      const prog = Math.min(1, elapsedInPhase / targetDuration);
      setSighPhaseProgress(prog);

      if (elapsedInPhase >= targetDuration) {
        // Transition to next phase
        sighTimerRef.current.phaseStartTime = Date.now();
        setSighPhase(curr => {
          if (curr === "inhale1") {
            if (soundEnabled) sound.playBreathingCue("topup");
            return "inhale2";
          }
          if (curr === "inhale2") {
            if (soundEnabled) sound.playBreathingCue("exhale");
            return "exhale";
          }
          // exhale complete -> restart next cycle
          setSighCycleCount(c => c + 1);
          if (soundEnabled) sound.playBreathingCue("inhale");
          return "inhale1";
        });
      }

      sighTimerRef.current.animFrame = requestAnimationFrame(runBreathingCycle);
    };

    // Initial cue
    if (soundEnabled && sighPhaseProgress === 0) {
      sound.playBreathingCue("inhale");
    }

    sighTimerRef.current.phaseStartTime = Date.now();
    sighTimerRef.current.animFrame = requestAnimationFrame(runBreathingCycle);

    return () => {
      active = false;
      if (sighTimerRef.current.animFrame) {
        cancelAnimationFrame(sighTimerRef.current.animFrame);
      }
    };
  }, [protocol.id, isRunning, isCompleted, sighPhase, soundEnabled]);

  const handleCompleteSession = () => {
    setIsCompleted(true);
    setIsRunning(false);
    if (soundEnabled) {
      sound.playRestorativeChime("complete");
    }
  };

  const handleStageJump = (idx: number) => {
    sound.click();
    setCurrentStageIndex(idx);
    if (soundEnabled) {
      sound.playRestorativeChime("phase");
    }
  };

  const toggleCheckpoint = (stageIdx: number) => {
    sound.click();
    setCompletedCheckpoints(prev => ({
      ...prev,
      [stageIdx]: !prev[stageIdx]
    }));
  };

  const handleAddDumpItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDumpInput.trim()) return;
    sound.click();
    setDumpItems(prev => [newDumpInput.trim(), ...prev]);
    setNewDumpInput("");
  };

  const handleRemoveDumpItem = (index: number) => {
    sound.click();
    setDumpItems(prev => prev.filter((_, i) => i !== index));
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentStage = stages[currentStageIndex] || stages[0];
  const percentCompleted = Math.min(100, Math.round(((totalSecondsInitial - secondsLeft) / totalSecondsInitial) * 100));

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md transition-colors duration-700 ${
      amberFilterActive ? "bg-amber-950/60" : ""
    }`}>
      {/* Background amber ambient glow if enabled in evening buffer */}
      {amberFilterActive && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-amber-600/10 via-amber-900/20 to-slate-950/90 mix-blend-color" />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-slate-900/95 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
      >
        {/* Top Control Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800/50 shadow-inner">
              {protocol.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/40">
                  {protocol.category}
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {protocol.durationMinutes} min protocol
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                {protocol.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                sound.click();
              }}
              title={soundEnabled ? "Mute guiding chimes" : "Enable guiding chimes"}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                soundEnabled
                  ? "bg-cyan-950/60 border-cyan-800 text-cyan-300 hover:bg-cyan-900/60"
                  : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? "Chimes On" : "Muted"}</span>
            </button>

            {/* Play/Pause */}
            {!isCompleted && (
              <button
                onClick={() => {
                  sound.click();
                  setIsRunning(!isRunning);
                }}
                className={`p-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  isRunning
                    ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                    : "bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-900/30"
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? "Pause" : "Resume"}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-white transition"
              title="Exit Protocol"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-800/50 h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${percentCompleted}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!isCompleted ? (
            <>
              {/* Timer Header & Status */}
              <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60 gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-cyan-400">
                    {formatTimer(secondsLeft)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Remaining Session</span>
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {percentCompleted}% Completed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCompleteSession}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-950/40 hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finish Early & Log Relief
                  </button>
                </div>
              </div>

              {/* SPECIFIC GUIDANCE ENGINE: PROTOCOL 1 - PHYSIOLOGICAL SIGH */}
              {protocol.id === "proto-sigh" && (
                <div className="bg-slate-950/60 rounded-3xl p-6 border border-cyan-900/40 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden">
                  {/* Glowing background halo */}
                  <div className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
                    sighPhase === "inhale1" ? "bg-cyan-500/10 scale-90" :
                    sighPhase === "inhale2" ? "bg-indigo-500/20 scale-110" :
                    "bg-emerald-500/10 scale-75"
                  }`} />

                  {/* Cycle Counter Badge */}
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sigh Cycle #{sighCycleCount}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-cyan-400 font-mono">10.5s Resonant Loop</span>
                  </div>

                  {/* High-Precision Interactive Breathing Ring */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
                    {/* Outer Progress Ring SVG */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        className="stroke-slate-800"
                        strokeWidth="4"
                        fill="none"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="44"
                        className={`transition-colors duration-500 ${
                          sighPhase === "inhale1" ? "stroke-cyan-400" :
                          sighPhase === "inhale2" ? "stroke-indigo-400" :
                          "stroke-emerald-400"
                        }`}
                        strokeWidth="4.5"
                        strokeDasharray={276.46}
                        strokeDashoffset={276.46 * (1 - sighPhaseProgress)}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>

                    {/* Inner Expanding/Contracting Visual Sphere */}
                    <motion.div
                      animate={{
                        scale: sighPhase === "inhale1" ? 0.9 + sighPhaseProgress * 0.25 :
                               sighPhase === "inhale2" ? 1.15 + sighPhaseProgress * 0.1 :
                               1.25 - sighPhaseProgress * 0.45
                      }}
                      transition={{ ease: "easeInOut", duration: 0.1 }}
                      className={`absolute w-44 h-44 rounded-full flex flex-col items-center justify-center p-3 shadow-2xl transition-colors duration-700 ${
                        sighPhase === "inhale1"
                          ? "bg-gradient-to-br from-cyan-900/70 to-cyan-950/90 border-2 border-cyan-400/80 text-cyan-200"
                          : sighPhase === "inhale2"
                          ? "bg-gradient-to-br from-indigo-900/80 to-purple-950/90 border-2 border-indigo-400 text-indigo-100 shadow-indigo-500/30"
                          : "bg-gradient-to-br from-emerald-950/70 to-slate-950/90 border-2 border-emerald-500/70 text-emerald-200"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                        {sighPhase === "inhale1" ? "Step 1 (3.0s)" :
                         sighPhase === "inhale2" ? "Step 2 (1.0s)" :
                         "Step 3 (6.5s)"}
                      </span>
                      <h4 className="text-sm sm:text-base font-black leading-tight">
                        {sighPhase === "inhale1" ? "Deep Inhale" :
                         sighPhase === "inhale2" ? "Sharp Top-Up" :
                         "Extended Exhale"}
                      </h4>
                      <span className="text-[11px] opacity-90 mt-1 font-mono">
                        {sighPhase === "inhale1" ? "Nasal • Belly" :
                         sighPhase === "inhale2" ? "Nasal Snort" :
                         "Oral • Unhurried"}
                      </span>
                    </motion.div>
                  </div>

                  {/* Real-time Physiological Purpose & Directive */}
                  <div className="mt-4 max-w-lg">
                    <p className="text-sm font-semibold text-slate-200">
                      {sighPhase === "inhale1" && "Breathe deeply through your nose, expanding lower belly & ribs."}
                      {sighPhase === "inhale2" && "Take a sharp secondary sip of air to pop open collapsed lung alveoli."}
                      {sighPhase === "exhale" && "Release slowly through softly parted lips; let gravity and diaphragm sink."}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      <strong className="text-cyan-300">Biometrics: </strong>
                      {sighPhase === "inhale1" && "Diaphragmatic excursion primes the respiratory sinus arrhythmia loop."}
                      {sighPhase === "inhale2" && "Surfactant re-distribution restores high alveolar oxygen diffusion surface."}
                      {sighPhase === "exhale" && "Thoracic compression slows venous return, signalling vagal nerve to downregulate heart rate."}
                    </p>
                  </div>
                </div>
              )}

              {/* SPECIFIC GUIDANCE ENGINE: PROTOCOLS 2, 3, 4 (MULTI-STAGE ENGINES) */}
              {protocol.id !== "proto-sigh" && (
                <div className="space-y-4">
                  {/* Multi-Stage Visual Stepper */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Protocol Timeline ({currentStageIndex + 1} of {stages.length})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStageJump(Math.max(0, currentStageIndex - 1))}
                          disabled={currentStageIndex === 0}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition"
                          title="Previous stage"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStageJump(Math.min(stages.length - 1, currentStageIndex + 1))}
                          disabled={currentStageIndex === stages.length - 1}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition"
                          title="Next stage"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {stages.map((stg, idx) => {
                        const isActive = idx === currentStageIndex;
                        const isDone = idx < currentStageIndex || completedCheckpoints[idx];
                        return (
                          <button
                            key={idx}
                            onClick={() => handleStageJump(idx)}
                            className={`p-2.5 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                              isActive
                                ? "bg-cyan-950/60 border-cyan-500/80 text-white ring-1 ring-cyan-500/30"
                                : isDone
                                ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/50"
                                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                Stage {idx + 1}
                              </span>
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : isActive ? (
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              ) : null}
                            </div>
                            <span className="font-semibold line-clamp-1">{stg.title.split(":")[1] || stg.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Stage Directive Box */}
                  <motion.div
                    key={currentStageIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-slate-950/80 rounded-3xl p-6 border border-cyan-900/40 shadow-xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800/40">
                          Active Directives • Stage {currentStageIndex + 1}
                        </span>
                        <h3 className="text-lg font-black text-white mt-1">
                          {currentStage.title}
                        </h3>
                      </div>
                    </div>

                    {/* Actionable Directive text */}
                    <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 text-slate-200 text-sm sm:text-base leading-relaxed">
                      <p className="font-medium">{currentStage.directive}</p>
                    </div>

                    {/* Physiological Purpose card */}
                    <div className="bg-cyan-950/30 rounded-2xl p-3.5 border border-cyan-800/30 flex items-start gap-3">
                      <Compass className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Physiological Mechanism</h5>
                        <p className="text-xs text-slate-300 mt-0.5 leading-normal">
                          {currentStage.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Checkpoint */}
                    {currentStage.checkpointPrompt && (
                      <div className="pt-2">
                        <button
                          onClick={() => toggleCheckpoint(currentStageIndex)}
                          className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                            completedCheckpoints[currentStageIndex]
                              ? "bg-emerald-950/50 border-emerald-500/70 text-emerald-200"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              completedCheckpoints[currentStageIndex]
                                ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                : "border-slate-600 bg-slate-800"
                            }`}>
                              {completedCheckpoints[currentStageIndex] && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <span>Check somatic checkpoint: {currentStage.checkpointPrompt}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            {completedCheckpoints[currentStageIndex] ? "Anchored" : "Tap to Confirm"}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* SPECIFIC INTERACTIVE TOOL: Protocol 4 Evening Decoupling Brain Dump */}
                    {protocol.id === "proto-buffer" && currentStageIndex === 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            Tactical Working Memory Dump (Offload Pending Loops)
                          </h4>
                          <span className="text-[10px] text-slate-400">{dumpItems.length} items logged</span>
                        </div>

                        <form onSubmit={handleAddDumpItem} className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newDumpInput}
                            onChange={e => setNewDumpInput(e.target.value)}
                            placeholder="Type an unclosed task or thought keeping your brain awake..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Offload
                          </button>
                        </form>

                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {dumpItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300">
                              <span className="line-clamp-1">{item}</span>
                              <button
                                onClick={() => handleRemoveDumpItem(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SPECIFIC INTERACTIVE TOOL: Protocol 4 Evening Decoupling Amber Filter */}
                    {protocol.id === "proto-buffer" && currentStageIndex === 1 && (
                      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between bg-amber-950/30 p-3 rounded-2xl border border-amber-800/40">
                        <div>
                          <span className="text-xs font-bold text-amber-300 block">Circadian Screen Melatonin Filter</span>
                          <span className="text-[11px] text-amber-200/70">Tints view to warm 2700K amber to attenuate alerting 480nm spectrum.</span>
                        </div>
                        <button
                          onClick={() => {
                            sound.click();
                            setAmberFilterActive(!amberFilterActive);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            amberFilterActive
                              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-900/40"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {amberFilterActive ? "Amber Active" : "Enable Amber Tint"}
                        </button>
                      </div>
                    )}

                    {/* SPECIFIC INTERACTIVE VISUAL: Protocol 3 Optic Flow Cadence Metronome */}
                    {protocol.id === "proto-optic" && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            Peripheral Lateral Flow Pacer
                          </span>
                          <span className="text-[10px] text-slate-400">Keep gaze panoramic</span>
                        </div>
                        <div className="relative h-12 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                          <motion.div
                            animate={{ x: [-160, 160] }}
                            transition={{
                              repeat: Infinity,
                              repeatType: "reverse",
                              duration: 4.5,
                              ease: "easeInOut"
                            }}
                            className="w-16 h-8 rounded-full bg-gradient-to-r from-emerald-500/40 via-teal-400 to-cyan-500/40 blur-sm"
                          />
                          <span className="absolute text-[11px] font-semibold text-slate-400 pointer-events-none">
                            Allow visual stimuli to wash outward across periphery
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </>
          ) : (
            /* SESSION COMPLETED SUMMARY */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-950/60">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Therapeutic Protocol Completed
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {protocol.name}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">
                  Session successfully logged to clinical endurance history. Autonomic balance and parasympathetic reserve re-established.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Burnout Relief</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    -{protocol.benefitBurnout}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Cognitive Load</span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Resilience</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono">
                    +{protocol.benefitResilience}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Vagal Tone</span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Time</span>
                  <span className="text-2xl font-black text-indigo-400 font-mono">
                    {formatTimer(totalSecondsInitial - secondsLeft)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Mindful Rest</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full max-w-md pt-2">
                <button
                  onClick={() => onComplete(protocol)}
                  className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Log Relief & Return to Shifts</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Footer Note */}
        {!isCompleted && (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span className="line-clamp-1 text-center sm:text-left">
              <strong className="text-slate-300">Clinical Evidence: </strong>
              {protocol.evidence}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold shrink-0">
              Zero-Cost Therapeutic Protocol
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
