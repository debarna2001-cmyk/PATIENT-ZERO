import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserStats } from "../types";
import { sound } from "../lib/audio";
import { formatDoctorName, getDoctorMonogram } from "../lib/doctorUtils";
import { 
  Compass, Sparkles, CheckCircle2, 
  Trophy, Award, Gem, Navigation,
  Crosshair, Layers
} from "lucide-react";

interface Props {
  stats: UserStats;
  onNavigateTab?: (tab: "dashboard" | "missions" | "triage" | "progress" | "rewards" | "settings") => void;
}

export interface SpatialWaypoint {
  id: string;
  order: number;
  thresholdXp: number;
  title: string;
  zone: string;
  district: string;
  x: number; // 0 to 1000 SVG coordinates
  y: number; // 0 to 680 SVG coordinates
  coordinates: string;
  elevation: string;
  elevationMeters: number;
  shortDesc: string;
  clinicalContext: string;
  relicName: string;
  relicIcon: string;
  secretPearl: string;
  landmarkType: "basecamp" | "amphitheater" | "harbor" | "specialty" | "clocktower" | "observatory" | "summit";
  pastelTheme: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    zoneName: string;
  };
}

// 7 milestones arranged along a uniform serpentine zigzag path with smooth rounded curves and no sharp edges
export const SPATIAL_EXPEDITION_WAYPOINTS: SpatialWaypoint[] = [
  {
    id: "wp-1",
    order: 1,
    thresholdXp: 0,
    title: "White Coat Basecamp",
    zone: "Pre-Clinical Quadrangle",
    district: "South Campus Greens",
    x: 180,
    y: 530,
    coordinates: "41.3163° N, 72.9223° W",
    elevation: "12 m",
    elevationMeters: 12,
    shortDesc: "First steps onto the medical campus and clinical orientation.",
    clinicalContext: "Mastering bedside rapport, patient history hygiene, and physical exam maneuvers. The inception of the residency journey.",
    relicName: "The Brass Stethoscope",
    relicIcon: "🩺",
    secretPearl: "Always palpate the radial pulse simultaneously while auscultating heart sounds to precisely time S1, S2, and systolic murmurs.",
    landmarkType: "basecamp",
    pastelTheme: {
      bg: "#d1fae5",
      border: "#a7f3d0",
      text: "#065f46",
      accent: "#10b981",
      zoneName: "Pastel Mint Quad"
    }
  },
  {
    id: "wp-2",
    order: 2,
    thresholdXp: 18000,
    title: "The Differential Trench",
    zone: "Academic Boulevard & Amphitheater",
    district: "Faculty Hall Plaza",
    x: 500,
    y: 530,
    coordinates: "41.3410° N, 72.9450° W",
    elevation: "45 m",
    elevationMeters: 45,
    shortDesc: "Defending clinical cases and mastering common conditions over zebras.",
    clinicalContext: "Standing in front of the attending physician during morning report. Formulating probabilistic, pathophysiologic differential diagnoses.",
    relicName: "Occam's Diagnostic Scroll",
    relicIcon: "📜",
    secretPearl: "Common presentations of uncommon diseases occur far less often than atypical presentations of common diseases. Ground your top 3 differentials in epidemiology.",
    landmarkType: "amphitheater",
    pastelTheme: {
      bg: "#ffe4e6",
      border: "#fecdd3",
      text: "#9f1239",
      accent: "#f43f5e",
      zoneName: "Pastel Rose Amphitheater"
    }
  },
  {
    id: "wp-3",
    order: 3,
    thresholdXp: 50000,
    title: "Night Float Archipelago",
    zone: "Emergency Pier & Waterfront",
    district: "Eastern Harbor & ICU Pavilions",
    x: 820,
    y: 530,
    coordinates: "41.3820° N, 72.9810° W",
    elevation: "18 m",
    elevationMeters: 18,
    shortDesc: "Surviving 3 AM pager alarms, sudden decompensations, and trauma resuscitations.",
    clinicalContext: "The true proving ground of a resident: alone on night float when a patient decompensates. Rapid recognition of shock, respiratory distress, and sepsis resuscitation.",
    relicName: "The Resuscitation Lantern",
    relicIcon: "🏮",
    secretPearl: "In acute hypotension refractory to initial bolus: check bedside lung ultrasound and IVC collapsibility before blindly hanging further fluids or pressors.",
    landmarkType: "harbor",
    pastelTheme: {
      bg: "#dbeafe",
      border: "#bfdbfe",
      text: "#1e40af",
      accent: "#3b82f6",
      zoneName: "Pastel Powder Blue Bay"
    }
  },
  {
    id: "wp-4",
    order: 4,
    thresholdXp: 100000,
    title: "Shelf Exam Summit",
    zone: "Specialty Rotations District",
    district: "North-Eastern Clinical Park",
    x: 500,
    y: 350,
    coordinates: "41.4250° N, 73.0230° W",
    elevation: "120 m",
    elevationMeters: 120,
    shortDesc: "Crucial rotations cleared across Surgery, Peds, Ob/Gyn, and Internal Medicine.",
    clinicalContext: "Integrating multi-specialty knowledge. Moving beyond single-organ systems into complex multimorbid inpatient management.",
    relicName: "Golden ECG Calipers",
    relicIcon: "📐",
    secretPearl: "Diffuse concave ST elevations with PR depressions across anterior and limb leads = Acute Pericarditis. Look for PR elevation in lead aVR.",
    landmarkType: "specialty",
    pastelTheme: {
      bg: "#ffedd5",
      border: "#fed7aa",
      text: "#9a3412",
      accent: "#f97316",
      zoneName: "Pastel Peach Conservatory"
    }
  },
  {
    id: "wp-5",
    order: 5,
    thresholdXp: 160000,
    title: "The Diagnostic Crucible",
    zone: "Clocktower Plaza & Library",
    district: "Western Academic Heights",
    x: 180,
    y: 350,
    coordinates: "41.4780° N, 73.0890° W",
    elevation: "210 m",
    elevationMeters: 210,
    shortDesc: "High-yield diagnostic reflexes, pharmacology, and board milestone exams.",
    clinicalContext: "Peak cognitive retention. Answering high-yield clinical vignettes under timed pressure with diagnostic accuracy and zero fatigue slip-ups.",
    relicName: "The Diagnostic Prism",
    relicIcon: "💎",
    secretPearl: "Isolated profound thrombocytopenia with large platelets on peripheral blood smear: suspect EDTA pseudothrombocytopenia; repeat CBC in sodium citrate before ordering bone marrow biopsy.",
    landmarkType: "clocktower",
    pastelTheme: {
      bg: "#ede9fe",
      border: "#ddd6fe",
      text: "#5b21b6",
      accent: "#8b5cf6",
      zoneName: "Pastel Lavender Heights"
    }
  },
  {
    id: "wp-6",
    order: 6,
    thresholdXp: 220000,
    title: "Match Day Horizon",
    zone: "The Match Day Observatory",
    district: "Northern Ridge Lookout",
    x: 500,
    y: 170,
    coordinates: "41.5320° N, 73.1420° W",
    elevation: "340 m",
    elevationMeters: 340,
    shortDesc: "Rank order list submitted, opening the match envelope into your target specialty.",
    clinicalContext: "The culmination of years of clinical dedication. Matching into your dream specialty training program with confidence.",
    relicName: "The Envelope of Destiny",
    relicIcon: "✉️",
    secretPearl: "Clinical longevity is determined 10% by technical facts and 90% by circadian stamina, genuine empathy for patients, and restorative habits.",
    landmarkType: "observatory",
    pastelTheme: {
      bg: "#e0e7ff",
      border: "#c7d2fe",
      text: "#3730a3",
      accent: "#6366f1",
      zoneName: "Pastel Periwinkle Ridge"
    }
  },
  {
    id: "wp-7",
    order: 7,
    thresholdXp: 280000,
    title: "Chief Residency Summit",
    zone: "Chief Residency Summit Pavilion",
    district: "Apex Mountain Reserve",
    x: 820,
    y: 170,
    coordinates: "41.6000° N, 73.2100° W",
    elevation: "480 m (Apex)",
    elevationMeters: 480,
    shortDesc: "Clinical autonomy, teaching interns, and master-level diagnostic wisdom.",
    clinicalContext: "Attending status achieved. The doctor who diagnoses with clarity, prevents diagnostic errors, and protects the well-being of the whole team.",
    relicName: "The Master Caduceus",
    relicIcon: "🔱",
    secretPearl: "The greatest clinician knows when NOT to order an extra test. Trust rigorous clinical examination, protect patient dignity, and heal with wisdom.",
    landmarkType: "summit",
    pastelTheme: {
      bg: "#fef3c7",
      border: "#fde68a",
      text: "#92400e",
      accent: "#d97706",
      zoneName: "Pastel Honey Summit"
    }
  }
];

// Continuous uniform serpentine cubic Bezier segments connecting all stations smoothly without sharp edges
const SERPENTINE_SEGMENTS = [
  // 1 -> 2: Tier 1 wave (180, 530) -> (500, 530)
  "M 180 530 C 285 515, 395 545, 500 530",
  // 2 -> 3: Tier 1 wave (500, 530) -> (820, 530)
  "M 500 530 C 605 515, 715 545, 820 530",
  // 3 -> 4: Smooth rounded U-turn around right edge up to Tier 2 (820, 530) -> loop -> (500, 350)
  "M 820 530 C 940 530, 940 350, 820 350 C 715 335, 605 365, 500 350",
  // 4 -> 5: Tier 2 wave (500, 350) -> (180, 350)
  "M 500 350 C 395 335, 285 365, 180 350",
  // 5 -> 6: Smooth rounded U-turn around left edge up to Tier 3 (180, 350) -> loop -> (500, 170)
  "M 180 350 C 60 350, 60 170, 180 170 C 285 155, 395 185, 500 170",
  // 6 -> 7: Tier 3 wave (500, 170) -> (820, 170)
  "M 500 170 C 605 155, 715 185, 820 170"
];

// Single continuous serpentine path for the background cobblestone roadbed
const FULL_SERPENTINE_PATH = 
  "M 180 530 C 285 515, 395 545, 500 530 " +
  "C 605 515, 715 545, 820 530 " +
  "C 940 530, 940 350, 820 350 " +
  "C 715 335, 605 365, 500 350 " +
  "C 395 335, 285 365, 180 350 " +
  "C 60 350, 60 170, 180 170 " +
  "C 285 155, 395 185, 500 170 " +
  "C 605 155, 715 185, 820 170";

export default function JourneyMap({ stats }: Props) {
  const [activeWaypoint, setActiveWaypoint] = useState<SpatialWaypoint | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "vault">("map");
  const [revealedPearls, setRevealedPearls] = useState<Record<string, boolean>>({});
  const [, setFocusBeaconPing] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const userXp = stats.xp || 0;
  const doctorDisplayName = formatDoctorName(stats.studentName);
  const monogram = getDoctorMonogram(stats.studentName);

  // Determine current active waypoint index
  let currentIndex = 0;
  for (let i = 0; i < SPATIAL_EXPEDITION_WAYPOINTS.length; i++) {
    if (userXp >= SPATIAL_EXPEDITION_WAYPOINTS[i].thresholdXp) {
      currentIndex = i;
    }
  }

  const currentWp = SPATIAL_EXPEDITION_WAYPOINTS[currentIndex];
  const nextWp = SPATIAL_EXPEDITION_WAYPOINTS[Math.min(currentIndex + 1, SPATIAL_EXPEDITION_WAYPOINTS.length - 1)];
  const isAtApex = currentIndex === SPATIAL_EXPEDITION_WAYPOINTS.length - 1;

  // Progress to next waypoint
  let progressToNext = 100;
  if (!isAtApex) {
    const range = nextWp.thresholdXp - currentWp.thresholdXp;
    const gained = userXp - currentWp.thresholdXp;
    progressToNext = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
  }

  const togglePearl = (wpId: string) => {
    sound.click();
    setRevealedPearls(prev => ({ ...prev, [wpId]: !prev[wpId] }));
  };

  const handleFocusDrB = () => {
    sound.click();
    setFocusBeaconPing(true);
    setTimeout(() => setFocusBeaconPing(false), 2400);

    if (mapContainerRef.current) {
      const el = mapContainerRef.current;
      const scrollTargetX = (currentWp.x / 1000) * el.scrollWidth - el.clientWidth / 2;
      const scrollTargetY = (currentWp.y / 680) * el.scrollHeight - el.clientHeight / 2;
      el.scrollTo({
        left: Math.max(0, scrollTargetX),
        top: Math.max(0, scrollTargetY),
        behavior: "smooth"
      });
    }
  };

  const unlockedCount = currentIndex + 1;

  return (
    <div className="bg-[#FAF7F2] dark:bg-slate-900 border border-[#E7DFD3] dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col relative transition-all">
      {/* Top Cartographic Header with Pastel Warmth */}
      <div className="relative border-b border-[#E7DFD3] dark:border-slate-800 bg-gradient-to-r from-[#FFFDF9] via-[#F4EFE6] to-[#FFFDF9] dark:from-slate-900 dark:via-cyan-950/20 dark:to-slate-900 px-4 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E0F2FE] dark:bg-cyan-900/40 border border-[#BAE6FD] dark:border-cyan-800 flex items-center justify-center text-[#0284C7] dark:text-cyan-400 shadow-sm shrink-0">
            <Compass className="w-6 h-6 animate-[spin_24s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0369A1] dark:text-cyan-400 bg-[#E0F2FE] dark:bg-cyan-950/50 px-2.5 py-0.5 rounded-full border border-[#BAE6FD] dark:border-cyan-800/50">
                Residency Campus Map
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Clinical Pathway • Academic Grounds
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {doctorDisplayName}'s Clinical Journey
            </h2>
          </div>
        </div>

        {/* View Switcher: Campus Map vs Pearls Vault */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-[#EFE8DC] dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-[#DFD6C6] dark:border-slate-700/80">
            <button
              onClick={() => { sound.click(); setActiveTab("map"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "map"
                  ? "bg-white dark:bg-slate-900 text-[#0284C7] dark:text-cyan-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Campus Map
            </button>
            <button
              onClick={() => { sound.click(); setActiveTab("vault"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "vault"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Gem className="w-3.5 h-3.5" />
              Pearls Vault ({unlockedCount}/{SPATIAL_EXPEDITION_WAYPOINTS.length})
            </button>
          </div>

          {activeTab === "map" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFocusDrB}
              className="px-3.5 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-cyan-600/30"
              title={`Focus map on ${doctorDisplayName}`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              Focus on {doctorDisplayName}
            </motion.button>
          )}
        </div>
      </div>

      {/* Active Position Summary Banner */}
      <div className="px-4 sm:px-6 py-3 bg-[#F5EFEB] dark:bg-slate-950/60 border-b border-[#E7DFD3] dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 font-medium text-slate-700 dark:text-slate-300">
          <div className="w-6 h-6 rounded-full bg-[#0284C7] text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm">
            {monogram}
          </div>
          <span className="text-slate-500 dark:text-slate-400">Current Station:</span>
          <strong className="text-slate-900 dark:text-white font-bold">{currentWp.title}</strong>
          <span className="text-[#0284C7] dark:text-cyan-400 font-mono text-[11px] font-bold">
            ({currentWp.zone} • {currentWp.elevation})
          </span>
        </div>

        {!isAtApex ? (
          <div className="flex items-center gap-3">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Next Checkpoint: <strong className="text-[#0284C7] dark:text-cyan-400 font-bold">{nextWp.thresholdXp - userXp} XP</strong> to {nextWp.title}
            </span>
            <div className="w-24 sm:w-32 bg-[#DFD6C6] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#34D399] h-full rounded-full transition-all duration-700"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{progressToNext}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
            <Award className="w-4 h-4" /> Apex Chief Residency Summit Reached
          </div>
        )}
      </div>

      {/* Main 2D Pastel Territory Canvas View */}
      {activeTab === "map" ? (
        <div className="relative p-2 sm:p-4 bg-[#F2EDE4] dark:bg-slate-950 overflow-hidden">
          {/* Scrollable / Responsive Territory Canvas */}
          <div 
            ref={mapContainerRef}
            className="w-full overflow-x-auto overflow-y-hidden rounded-2xl relative select-none scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
          >
            <div className="min-w-[850px] relative bg-[#FAF7F2] dark:bg-slate-900 rounded-2xl border border-[#E5DDD0] dark:border-slate-800 shadow-sm overflow-hidden">
              <svg 
                viewBox="0 0 1000 680" 
                className="w-full h-auto block"
              >
                <defs>
                  {/* Pastel Paper Canvas Background */}
                  <linearGradient id="pastelPaperBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FAF7F2" />
                    <stop offset="50%" stopColor="#F5EFE6" />
                    <stop offset="100%" stopColor="#FAF7F2" />
                  </linearGradient>

                  {/* Pastel River Gradient */}
                  <linearGradient id="pastelRiverWater" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.75" />
                  </linearGradient>

                  {/* Pastel Cleared Trail Beam */}
                  <linearGradient id="pastelClearedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>

                  {/* Pastel Active Trail Beam */}
                  <linearGradient id="pastelActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284C7" />
                    <stop offset="50%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>

                  {/* Soft Pastel Shadow Filters */}
                  <filter id="softCardShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#78716C" floodOpacity="0.12" />
                  </filter>
                  <filter id="softBeaconShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0284C7" floodOpacity="0.35" />
                  </filter>
                </defs>

                {/* Base Pastel Canvas */}
                <rect width="1000" height="680" fill="url(#pastelPaperBg)" />

                {/* Subtle Topographic Elevation Contour Isolines in Warm Muted Sand */}
                <g fill="none" stroke="#E2D9C8" strokeWidth="1" opacity="0.6">
                  {/* 10m Low Valley */}
                  <path d="M 40 610 C 240 640, 420 590, 600 620 C 780 650, 920 600, 980 570" />
                  {/* 50m Plaza Contour */}
                  <path d="M 30 460 C 220 480, 410 440, 580 460 C 760 480, 890 430, 970 410" />
                  {/* 150m Mid Tier Contour */}
                  <path d="M 40 300 C 210 320, 390 280, 560 300 C 740 320, 880 260, 960 250" />
                  {/* 300m High Ridge */}
                  <path d="M 50 150 C 230 170, 420 120, 600 150 C 780 160, 890 110, 970 100" strokeDasharray="4 6" />
                </g>

                {/* PASTEL LANDSCAPE ZONES (Whimsical, soft-shaded illustrated districts) */}
                
                {/* 1. Pre-Clinical Quad (Pastel Mint Meadow) - Tier 1 Left */}
                <g>
                  <path 
                    d="M 60 460 C 120 440, 260 450, 320 480 C 350 540, 320 610, 260 640 C 180 650, 80 620, 60 550 Z" 
                    fill="#D1FAE5" 
                    opacity="0.65" 
                  />
                  {/* Campus Orchard & Grove Trees */}
                  <circle cx="110" cy="490" r="14" fill="#A7F3D0" />
                  <circle cx="125" cy="485" r="10" fill="#6EE7B7" opacity="0.8" />
                  <circle cx="280" cy="590" r="16" fill="#A7F3D0" />
                  <circle cx="265" cy="600" r="12" fill="#6EE7B7" opacity="0.8" />
                  <circle cx="90" cy="570" r="15" fill="#A7F3D0" />
                </g>

                {/* 2. Faculty Amphitheater Lawn (Pastel Blush Rose) - Tier 1 Center */}
                <g>
                  <path 
                    d="M 380 470 C 440 450, 560 450, 620 480 C 650 540, 620 610, 560 630 C 470 640, 390 610, 380 540 Z" 
                    fill="#FFE4E6" 
                    opacity="0.6" 
                  />
                  {/* Illustrated Tiered Amphitheater Arches */}
                  <path d="M 450 490 Q 500 465, 550 490" fill="none" stroke="#FECDD3" strokeWidth="3" />
                  <path d="M 460 500 Q 500 480, 540 500" fill="none" stroke="#FECDD3" strokeWidth="2.5" />
                  <circle cx="500" cy="510" r="4" fill="#FDA4AF" />
                  {/* Shrubbery */}
                  <circle cx="390" cy="500" r="9" fill="#FECDD3" />
                  <circle cx="610" cy="510" r="10" fill="#FECDD3" />
                </g>

                {/* 3. Eastern Harbor & Lake (Pastel Powder Blue Lagoon) - Tier 1 Right */}
                <g>
                  <path 
                    d="M 720 680 C 730 580, 750 470, 830 460 C 900 450, 960 480, 1000 500 L 1000 680 Z" 
                    fill="#DBEAFE" 
                    opacity="0.75" 
                  />
                  {/* Gentle Lagoon Waves */}
                  <path d="M 780 590 Q 810 585, 840 590" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 860 620 Q 890 615, 920 620" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 800 640 Q 830 635, 860 640" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                  {/* Cute Wooden Pier Planks */}
                  <rect x="740" y="520" width="30" height="8" rx="2" fill="#D7C9B2" stroke="#B8A88E" strokeWidth="1" />
                  <rect x="740" y="532" width="30" height="8" rx="2" fill="#D7C9B2" stroke="#B8A88E" strokeWidth="1" />
                  {/* Whimsical Pastel Sailboat */}
                  <polygon points="900,535 915,505 915,535" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                  <polygon points="917,535 927,515 917,515" fill="#FED7AA" />
                  <path d="M 895 536 L 932 536 L 925 543 L 902 543 Z" fill="#93C5FD" />
                </g>

                {/* 4. Specialty Rotations Conservatory (Pastel Peach Apricot) - Tier 2 Center */}
                <g>
                  <path 
                    d="M 390 290 C 460 270, 580 270, 640 300 C 660 360, 630 410, 570 420 C 470 420, 400 390, 390 340 Z" 
                    fill="#FFEDD5" 
                    opacity="0.65" 
                  />
                  {/* Illustrated Greenhouse Glass Dome Arches */}
                  <rect x="480" y="300" width="40" height="20" rx="4" fill="#FFFFFF" opacity="0.7" stroke="#FED7AA" strokeWidth="1.5" />
                  <path d="M 480 300 Q 500 285, 520 300" fill="none" stroke="#FB923C" strokeWidth="1.5" />
                  {/* Pastel Peach Blossom Trees */}
                  <circle cx="430" cy="330" r="12" fill="#FED7AA" />
                  <circle cx="580" cy="320" r="14" fill="#FED7AA" />
                </g>

                {/* 5. Diagnostic Clocktower Courtyard (Pastel Lavender Lilac) - Tier 2 Left */}
                <g>
                  <path 
                    d="M 80 290 C 140 270, 260 270, 310 300 C 330 360, 300 420, 240 430 C 150 430, 90 390, 80 340 Z" 
                    fill="#EDE9FE" 
                    opacity="0.65" 
                  />
                  {/* Stylized Collegiate Gothic Clocktower Spire */}
                  <rect x="172" y="278" width="16" height="26" fill="#DDD6FE" rx="2" stroke="#C4B5FD" strokeWidth="1" />
                  <polygon points="180,262 170,278 190,278" fill="#A78BFA" />
                  <circle cx="180" cy="286" r="3.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="1" />
                  {/* Lavender Courtyard Trees */}
                  <circle cx="120" cy="360" r="13" fill="#DDD6FE" />
                  <circle cx="270" cy="340" r="15" fill="#DDD6FE" />
                </g>

                {/* 6. Match Day Ridge Observatory (Pastel Periwinkle Dusk) - Tier 3 Center */}
                <g>
                  <path 
                    d="M 390 110 C 450 90, 580 90, 630 120 C 650 180, 620 230, 560 240 C 470 240, 400 210, 390 160 Z" 
                    fill="#E0E7FF" 
                    opacity="0.65" 
                  />
                  {/* Stylized Observatory Dome */}
                  <path d="M 485 130 A 15 15 0 0 1 515 130 Z" fill="#C7D2FE" stroke="#818CF8" strokeWidth="1.5" />
                  <rect x="485" y="130" width="30" height="10" fill="#FFFFFF" opacity="0.8" rx="2" />
                  <line x1="500" y1="122" x2="512" y2="114" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
                  {/* Little Pastel Twinkling Stars */}
                  <text x="440" y="125" fontSize="11" fill="#FBBF24">✦</text>
                  <text x="560" y="115" fontSize="9" fill="#FBBF24">✦</text>
                </g>

                {/* 7. Chief Residency Summit (Pastel Buttercream & Golden Honey) - Tier 3 Right */}
                <g>
                  <path 
                    d="M 710 100 C 760 70, 880 70, 940 100 C 970 160, 940 230, 880 240 C 790 250, 720 220, 710 160 Z" 
                    fill="#FEF3C7" 
                    opacity="0.75" 
                  />
                  {/* Stylized Mountain Peak with White Snow Cap */}
                  <polygon points="820,80 780,140 860,140" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1" />
                  <polygon points="820,80 802,107 838,107" fill="#FFFFFF" />
                  {/* Golden Summit Triumph Banner */}
                  <line x1="820" y1="80" x2="820" y2="60" stroke="#D97706" strokeWidth="2" />
                  <polygon points="820,60 838,66 820,72" fill="#F59E0B" />
                </g>

                {/* Meandering Pastel Brook / River connecting landscape zones */}
                <g>
                  <path 
                    d="M 460 0 C 470 80, 480 180, 520 260 C 560 340, 640 400, 740 460 C 780 480, 820 510, 860 540" 
                    fill="none" 
                    stroke="url(#pastelRiverWater)" 
                    strokeWidth="24" 
                    strokeLinecap="round" 
                  />
                  <path 
                    d="M 460 0 C 470 80, 480 180, 520 260 C 560 340, 640 400, 740 460 C 780 480, 820 510, 860 540" 
                    fill="none" 
                    stroke="#FFFFFF" 
                    strokeWidth="2" 
                    opacity="0.6"
                    strokeDasharray="8 12" 
                  />
                  {/* Arched Stone Bridge at River Crossing */}
                  <rect x="640" y="405" width="28" height="14" rx="3" fill="#E7DFD3" stroke="#B8A88E" strokeWidth="1.5" transform="rotate(-30 654 412)" />
                </g>

                {/* Whimsical Decorative Details (*The Perfect Date* aesthetic) */}
                {/* Hot Air Balloon drifting in upper sky */}
                <g transform="translate(290, 65)">
                  <path d="M 0 0 C -12 -16, 12 -16, 0 0" fill="#FCA5A5" />
                  <path d="M 0 0 C -16 -22, 16 -22, 0 0" fill="#FBCFE8" stroke="#F472B6" strokeWidth="0.75" />
                  <rect x="-3" y="2" width="6" height="5" rx="1" fill="#D97706" />
                  <line x1="-2" y1="0" x2="-2" y2="2" stroke="#78716C" strokeWidth="0.5" />
                  <line x1="2" y1="0" x2="2" y2="2" stroke="#78716C" strokeWidth="0.5" />
                </g>

                {/* Soft Fluffy Floating Clouds */}
                <g fill="#FFFFFF" opacity="0.8" filter="url(#softCardShadow)">
                  {/* Cloud 1 */}
                  <path d="M 140 100 Q 155 85, 175 95 Q 195 85, 210 100 Q 215 115, 195 118 L 150 118 Q 135 115, 140 100 Z" />
                  {/* Cloud 2 */}
                  <path d="M 640 60 Q 652 48, 668 56 Q 684 48, 696 60 Q 700 72, 684 75 L 648 75 Q 636 72, 640 60 Z" />
                </g>

                {/* THE UNIFORM SERPENTINE ADVENTURE TRAIL */}
                {/* 1. Underlying Pastel Roadbed Ribbon (Wide, soft cream cobblestone path) */}
                <path 
                  d={FULL_SERPENTINE_PATH} 
                  fill="none" 
                  stroke="#E8E0D2" 
                  strokeWidth="28" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d={FULL_SERPENTINE_PATH} 
                  fill="none" 
                  stroke="#FFFDF9" 
                  strokeWidth="20" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                {/* Center Cobblestone Dash Guideline */}
                <path 
                  d={FULL_SERPENTINE_PATH} 
                  fill="none" 
                  stroke="#D3C7B3" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeDasharray="4 6"
                />

                {/* 2. Path Segments: Cleared, Active, and Locked */}
                {SERPENTINE_SEGMENTS.map((seg, segIdx) => {
                  const isSegmentCleared = segIdx < currentIndex;
                  const isSegmentActive = segIdx === currentIndex;

                  if (isSegmentCleared) {
                    return (
                      <g key={segIdx}>
                        {/* Soft Pastel Mint Glow */}
                        <path 
                          d={seg} 
                          fill="none" 
                          stroke="#6EE7B7" 
                          strokeWidth="12" 
                          opacity="0.5" 
                          strokeLinecap="round" 
                        />
                        {/* Solid Cleared Pastel Mint Beam */}
                        <path 
                          d={seg} 
                          fill="none" 
                          stroke="url(#pastelClearedGrad)" 
                          strokeWidth="6" 
                          strokeLinecap="round" 
                        />
                      </g>
                    );
                  }

                  if (isSegmentActive) {
                    return (
                      <g key={segIdx}>
                        {/* Active Pastel Sky Halo */}
                        <path 
                          d={seg} 
                          fill="none" 
                          stroke="#7DD3FC" 
                          strokeWidth="14" 
                          opacity="0.5" 
                          strokeLinecap="round" 
                        />
                        {/* Active Flowing Dashes */}
                        <path 
                          d={seg} 
                          fill="none" 
                          stroke="url(#pastelActiveGrad)" 
                          strokeWidth="7" 
                          strokeLinecap="round" 
                          strokeDasharray="10 8" 
                          className="animate-[dash_2s_linear_infinite]"
                        />
                      </g>
                    );
                  }

                  // Locked forward segment
                  return (
                    <path 
                      key={segIdx}
                      d={seg} 
                      fill="none" 
                      stroke="#CBD5E1" 
                      strokeWidth="3" 
                      strokeDasharray="5 7" 
                      opacity="0.8"
                      strokeLinecap="round" 
                    />
                  );
                })}

                {/* DR. B EXPLORER BEACON (PASTEL AVATAR PIN) */}
                <g transform={`translate(${currentWp.x}, ${currentWp.y})`}>
                  {/* Concentric radar pulse ripples in pastel cyan */}
                  <circle cx="0" cy="0" r="34" fill="none" stroke="#38BDF8" strokeWidth="2" opacity="0.45" className="animate-ping" />
                  <circle cx="0" cy="0" r="24" fill="#E0F2FE" opacity="0.8" />
                  <circle cx="0" cy="0" r="16" fill="#0284C7" stroke="#FFFFFF" strokeWidth="3" filter="url(#softBeaconShadow)" />
                  
                  {/* Monogram in Crisp White */}
                  <text 
                    x="0" 
                    y="5" 
                    textAnchor="middle" 
                    fill="#FFFFFF" 
                    fontSize="12" 
                    fontWeight="900" 
                    fontFamily="monospace"
                  >
                    {monogram}
                  </text>

                  {/* Active Explorer Location Callout Banner */}
                  <g transform="translate(0, -32)" filter="url(#softCardShadow)">
                    <rect 
                      x="-70" 
                      y="-13" 
                      width="140" 
                      height="22" 
                      rx="11" 
                      fill="#0284C7" 
                      stroke="#BAE6FD" 
                      strokeWidth="1.5"
                    />
                    <text 
                      x="0" 
                      y="2" 
                      textAnchor="middle" 
                      fill="#FFFFFF" 
                      fontSize="10" 
                      fontWeight="bold" 
                      letterSpacing="0.3"
                    >
                      📍 {doctorDisplayName} is here
                    </text>
                  </g>

                  {/* Mini Direction Pointer towards next station */}
                  {!isAtApex && (
                    <g transform="translate(0, 24)">
                      <circle cx="0" cy="0" r="8" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.5" />
                      <line x1="0" y1="5" x2="0" y2="-5" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}
                </g>

                {/* INTERACTIVE WAYPOINT STATION PINS */}
                {SPATIAL_EXPEDITION_WAYPOINTS.map((wp, idx) => {
                  const isCompleted = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  const isLocked = idx > currentIndex;

                  return (
                    <g 
                      key={wp.id} 
                      transform={`translate(${wp.x}, ${wp.y})`}
                      className="cursor-pointer group"
                      onClick={() => {
                        sound.click();
                        setActiveWaypoint(wp);
                      }}
                    >
                      {/* Station base circle with pastel styling */}
                      <circle 
                        cx="0" 
                        cy="0" 
                        r={isCurrent ? "20" : "16"} 
                        fill={isCurrent ? "#F0F9FF" : isCompleted ? "#ECFDF5" : "#F8FAFC"} 
                        stroke={isCurrent ? "#0284C7" : isCompleted ? "#10B981" : "#94A3B8"} 
                        strokeWidth={isCurrent ? "3.5" : "2.5"}
                        filter="url(#softCardShadow)"
                        className="transition-transform duration-200 group-hover:scale-125"
                      />

                      {/* Station Badge Center Icon */}
                      {isCompleted ? (
                        <text x="0" y="5" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="bold">✓</text>
                      ) : isCurrent ? (
                        <circle cx="0" cy="0" r="6" fill="#0284C7" />
                      ) : (
                        <text x="0" y="4" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">🔒</text>
                      )}

                      {/* Station Order Number Pill */}
                      <g transform="translate(0, 26)" filter="url(#softCardShadow)">
                        <rect 
                          x="-30" 
                          y="-9" 
                          width="60" 
                          height="17" 
                          rx="8.5" 
                          fill={isCurrent ? "#0284C7" : isCompleted ? "#E6F4EA" : "#FFFFFF"} 
                          stroke={isCurrent ? "#BAE6FD" : isCompleted ? "#A7F3D0" : "#E2E8F0"} 
                          strokeWidth="1" 
                        />
                        <text 
                          x="0" 
                          y="3" 
                          textAnchor="middle" 
                          fill={isCurrent ? "#FFFFFF" : isCompleted ? "#065F46" : "#64748B"} 
                          fontSize="8.5" 
                          fontWeight="bold" 
                          fontFamily="monospace"
                        >
                          STATION 0{wp.order}
                        </text>
                      </g>

                      {/* Station Title Callout Pill */}
                      <g transform="translate(0, -26)" filter="url(#softCardShadow)" className="transition-transform duration-200 group-hover:-translate-y-8">
                        <rect 
                          x="-75" 
                          y="-10" 
                          width="150" 
                          height="20" 
                          rx="6" 
                          fill="#FFFFFF" 
                          stroke={isCurrent ? "#BAE6FD" : isCompleted ? "#A7F3D0" : "#E2E8F0"} 
                          strokeWidth="1" 
                        />
                        <text 
                          x="0" 
                          y="3.5" 
                          textAnchor="middle" 
                          fill={isCurrent ? "#0369A1" : isCompleted ? "#065F46" : "#475569"} 
                          fontSize="9.5" 
                          fontWeight="bold"
                        >
                          {wp.relicIcon} {wp.title}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Map Legend Overlay in Lower Left */}
                <g transform="translate(24, 620)" filter="url(#softCardShadow)">
                  <rect x="0" y="0" width="270" height="42" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                  <circle cx="16" cy="21" r="5" fill="#10B981" />
                  <text x="26" y="24" fill="#475569" fontSize="9" fontWeight="bold">Cleared Zone</text>
                  <circle cx="98" cy="21" r="5" fill="#0284C7" />
                  <text x="108" y="24" fill="#475569" fontSize="9" fontWeight="bold">Active ({doctorDisplayName})</text>
                  <circle cx="188" cy="21" r="5" fill="#94A3B8" />
                  <text x="198" y="24" fill="#64748B" fontSize="9" fontWeight="bold">Locked Horizon</text>
                </g>

                {/* Whimsical Pastel Compass Rose in Upper Right */}
                <g transform="translate(930, 60)" opacity="0.65">
                  <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke="#E2D9C8" strokeWidth="1.5" />
                  <polygon points="0,-22 4,-6 0,0 -4,-6" fill="#F59E0B" />
                  <polygon points="0,22 4,6 0,0 -4,6" fill="#94A3B8" />
                  <polygon points="-22,0 -6,4 0,0 -6,-4" fill="#94A3B8" />
                  <polygon points="22,0 6,4 0,0 6,-4" fill="#94A3B8" />
                  <text x="0" y="-25" textAnchor="middle" fill="#D97706" fontSize="9" fontWeight="bold">N</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Quick Waypoints Carousel Drawer below canvas */}
          <div className="mt-4 pt-3 border-t border-[#E5DDD0] dark:border-slate-800">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0284C7] dark:text-cyan-400" /> Waypoints & Stations
              </span>
              <span className="text-[10px] font-mono text-slate-500">Tap station to inspect dossier</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {SPATIAL_EXPEDITION_WAYPOINTS.map((wp, idx) => {
                const isCompleted = idx < currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={wp.id}
                    onClick={() => {
                      sound.click();
                      setActiveWaypoint(wp);
                    }}
                    className={`shrink-0 px-3.5 py-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      isCurrent
                        ? "bg-[#E0F2FE] border-[#38BDF8] text-[#0369A1] dark:bg-cyan-950/80 dark:border-cyan-400 dark:text-white shadow-md shadow-cyan-500/10"
                        : isCompleted
                        ? "bg-white border-[#E2E8F0] dark:bg-slate-800/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#0284C7]/50"
                        : "bg-[#F5EFEB] border-[#E5DDD0] dark:bg-slate-900/60 dark:border-slate-800/60 text-slate-500 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <span className="text-base">{wp.relicIcon}</span>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Station 0{wp.order} • {wp.elevation}
                      </span>
                      <span className="text-xs font-bold whitespace-nowrap">
                        {wp.title}
                      </span>
                    </div>
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-ping shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Vault Mode: Discovered Clinical Relics & Pearls */
        <div className="p-4 sm:p-8 bg-[#FAF7F2] dark:bg-slate-950/40">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  {doctorDisplayName}'s Discovered Relics & Pearls
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Clinical artifacts unlocked along your campus residency journey. Each relic holds a high-yield diagnostic pearl.
                </p>
              </div>
              <div className="bg-[#FEF3C7] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/60 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 self-start sm:self-auto">
                Relics Collected: {unlockedCount} / {SPATIAL_EXPEDITION_WAYPOINTS.length}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPATIAL_EXPEDITION_WAYPOINTS.map((wp, idx) => {
                const isUnlocked = idx <= currentIndex;
                const isPearlShown = Boolean(revealedPearls[wp.id]);

                return (
                  <div
                    key={wp.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      isUnlocked
                        ? "bg-white dark:bg-slate-900 border-amber-300/60 dark:border-amber-500/30 shadow-sm"
                        : "bg-[#F5EFEB]/60 dark:bg-slate-900/30 border-[#E5DDD0] dark:border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${
                          isUnlocked 
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" 
                            : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 grayscale"
                        }`}>
                          {isUnlocked ? wp.relicIcon : "🔒"}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Station 0{wp.order} • {wp.zone}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {wp.relicName}
                          </h4>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Conquered
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">
                          {wp.thresholdXp} XP
                        </span>
                      )}
                    </div>

                    {isUnlocked ? (
                      <div className="mt-3">
                        <button
                          onClick={() => togglePearl(wp.id)}
                          className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 transition flex items-center justify-between"
                        >
                          <span className="font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {isPearlShown ? "High-Yield Clinical Pearl:" : "Tap to Reveal High-Yield Pearl"}
                          </span>
                          <span className="text-[10px] font-bold text-[#0284C7] dark:text-cyan-400">
                            {isPearlShown ? "Hide" : "Reveal"}
                          </span>
                        </button>

                        <AnimatePresence>
                          {isPearlShown && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 p-3 rounded-xl bg-[#E0F2FE]/70 dark:bg-cyan-950/40 border border-[#BAE6FD] dark:border-cyan-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                "{wp.secretPearl}"
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-2 font-mono">
                        Locked. Reach {wp.thresholdXp.toLocaleString()} XP to unlock this clinical artifact.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Waypoint Detail Modal */}
      <AnimatePresence>
        {activeWaypoint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] dark:bg-cyan-950/50 border border-[#BAE6FD] dark:border-cyan-800 flex items-center justify-center text-2xl shadow-sm">
                    {activeWaypoint.relicIcon}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#0284C7] dark:text-cyan-400">
                      Station 0{activeWaypoint.order} • {activeWaypoint.elevation}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {activeWaypoint.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setActiveWaypoint(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* Waypoint Coordinates & District */}
              <div className="bg-[#FAF7F2] dark:bg-slate-950/60 rounded-xl p-3 mb-4 flex flex-wrap justify-between items-center text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-[#E5DDD0] dark:border-slate-800">
                <span>COORD: {activeWaypoint.coordinates}</span>
                <span>DISTRICT: {activeWaypoint.district}</span>
                <span>REQ: {activeWaypoint.thresholdXp} XP</span>
              </div>

              {/* Clinical Story & Context */}
              <div className="space-y-3 mb-6">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Clinical Milestone Context
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {activeWaypoint.clinicalContext}
                  </p>
                </div>

                {/* Secret Clinical Pearl Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#EDE9FE]/50 dark:from-cyan-950/40 dark:to-indigo-950/20 border border-[#BAE6FD] dark:border-cyan-800/80">
                  <div className="flex items-center gap-2 mb-2 text-cyan-900 dark:text-cyan-300 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Secret Clinical Pearl: {activeWaypoint.relicName}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif italic">
                    "{activeWaypoint.secretPearl}"
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {userXp >= activeWaypoint.thresholdXp ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Checkpoint Cleared
                    </span>
                  ) : (
                    <span>
                      Needs <strong>{activeWaypoint.thresholdXp - userXp} XP</strong> to unlock
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    sound.click();
                    setActiveWaypoint(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition shadow-sm"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
