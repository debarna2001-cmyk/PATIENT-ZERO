# PATIENT ZERO (v2.4a) — COMPREHENSIVE SYSTEM DOSSIER & ARCHITECTURAL AUDIT
**Postgraduate Medical Triage Survival Engine & Neuro-Cognitive Burnout Regulator for NEET PG**

*Document ID: P0-DOSSIER-2026-OCT*  
*Classification: Medical Education Technology / Applied Psychology Simulation*  
*Local System Timestamp: 2026-10-07T01:17:10-07:00*

---

## 1. EXECUTIVE SUMMARY & CORE PHILOSOPHY

### 1.1 The Problem Space
NEET PG (National Eligibility cum Entrance Test for Postgraduate Medical Admissions) is one of the world's highest-attrition medical competitive exams. Aspirants prepare across **19 distinct clinical and pre-clinical specialties** over months of solitary revision. The dominant reasons for preparation collapse are not lack of cognitive capability, but:
1. **Clinical Disconnect**: Memorizing thousands of isolated pharmacological tables and clinical criteria without real-time diagnostic urgency leads to severe boredom and passive reading.
2. **Burnout Cascade & Procrastination Guilt**: The "doomscroll-guilt spiral", where hours lost on social media lead to avoidance behavior, tachycardic anxiety, and catastrophic multi-day study halts.
3. **Absence of Real Shift Telemetry**: Traditional question banks (QBanks) display static numbers ("45/50 correct") without emotional resonance or life-or-death consequence.

### 1.2 The "Patient Zero" Paradigm
Patient Zero transforms NEET PG revision into a **high-stakes clinical emergency room shift**.
- **The Patient represents the aspirant's clinical readiness and mental state.**
- If the student studies, runs triage cases, logs hours, and sleeps adequately, the patient stabilizes (**Health restores to 100%, Burnout Index diminishes, Vitals normalize**).
- If the student procrastinates or abandons their routine, the patient experiences **decompensation and systemic collapse** (tachycardia, hypotension, desaturation, tachycardia shock).
- An attention slip or incorrect emergency diagnostic directly risks a **Flatline Event**, wiping active streaks and triggering urgent clinical intervention.

---

## 2. SYSTEM ARCHITECTURE & TECHNICAL STACK

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React 19 SPA)                    │
│  Vite Bundler • Tailwind CSS • Lucide Icons • Motion / Framer Motion   │
│  Recharts Data Visualizations • Web Audio API Synthesizer (Pulse/Chimes)│
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
         ┌────────────────────────┴─────────────────────────┐
         │                                                  │
┌────────▼─────────────────────────┐     ┌──────────────────▼──────────────────────┐
│       FIREBASE INTEGRATION       │     │          EXPRESS BACKEND ENGINE         │
│  • Firebase Auth (Google OAuth)  │     │  • Node.js / Express Proxy              │
│  • Cloud Firestore Database      │     │  • Google Gen AI SDK (@google/genai)    │
│  • Offline LocalStorage Fallback │     │  • Model: Gemini 2.5 Flash              │
│  • Security Rules ABAC Hardening │     │  • Fallback Offline Vignette Matrix     │
└──────────────────────────────────┘     └─────────────────────────────────────────┘
```

### 2.1 Technology Matrix
- **Frontend Framework**: React 19 (TypeScript) running on Vite with modular component architecture.
- **Styling & Cyber-Clinical Theme**: Tailwind CSS with dark-mode primary interface, cyber-grid overlays, pulsing critical state halos, and responsive mobile-first grid systems.
- **Backend & Middleware**: Express.js server (`server.ts`) hosting custom API proxy endpoints for Google Gemini API integration, preventing API key exposure to the client.
- **Artificial Intelligence Engine**: `@google/genai` TypeScript SDK utilizing `gemini-2.5-flash` for high-throughput, structured JSON generation of complex clinical case vignettes, diagnostic feedback, and Chief Resident reviews.
- **Audio Synthesizer Engine**: Low-latency Web Audio API procedural sound synthesizer producing cardiac beeps, tachycardia alarms, defibrillator charge sounds, stabilization chimes, and flatline warnings without external audio assets.
- **State Persistence**: Dual-layer architecture: Google Cloud Firestore for authenticated cross-device persistence with subcollection normalization, coupled with `localStorage` for complete offline functionality.

---

## 3. WHAT WORKS & HOW EVERY MODULE WORKS

### 3.1 Core Telemetry & The Physiological Engine
*Status: OPERATIONAL (High Fidelity & Performance-Driven)*

1. **Patient Preparation Health (`0–100%`)**:
   - Acts as the primary biological reserve.
   - **Clinical Performance-Driven Modulation (No Screen Time Decay)**: Patient vitals degrade strictly according to **clinical diagnostic performance** (triage accuracy and flatlines), **daily/weekly shift goals met vs. missed**, and **active operational compliance**, rather than passive app screen time or idle duration while studying.
   - **Performance Fluctuations**:
     - **Triage Decision Accuracy**: Stabilizing a clinical case replenishes **+30%** Health; committing medical malpractice / flatlining a patient inflicts a severe **-25%** vital shock.
     - **Daily Goal Compliance (Daily Rollover)**:
       - *All Goals Cleared (100%)*: **+10%** Health stabilization boost, **-15%** Burnout relief, and Shift Streak increments.
       - *Partially Met (50–99%)*: **-10%** Health fatigue, **+5%** Burnout strain.
       - *Goals Not Met / Shift Missed (0–49%)*: **-20%** Health penalty, **+15%** Burnout surge, and Shift Streak resets to 0.
     - **Multi-Day Inactivity Backfill**: If a resident is away for multiple calendar days (e.g., active on 08-10-2026, resumes on 10-10-2026), the engine automatically archives intermediate days (09-10-2026) with **"Shift Missed — Goals Not Met"** (0/5 objectives completed), applies the appropriate clinical vital penalty, and preserves unbroken historical honesty.
     - **Restoration Multipliers**: Completing study protocols (+15% to +50%), logging video modules (+35%), quick breaks (+10%), and sleep (+4% per hour).
   - **Critical State Warning**: When Health drops below **35%**, the entire viewport activates a pulsating red border halo (`animate-pulse`) and dynamic telemetry alarms.

2. **Burnout / Fatigue Index (`0–100%`)**:
   - Represents neuro-cognitive exhaustion and cognitive load.
   - Accumulates during missed daily shifts (+15%), clinical flatlines (+15%), and attention slips (+20%).
   - Decreased by restorative activities: 8 hours of sleep reduces burnout by **80%**, quick breaks shed **30%**, mood logging releases **15%**, and clearing daily shifts provides **-15%** relief.

3. **Dynamic Patient Vitals Telemetry**:
   - Generates simulated ICU vitals in real time based on the student's psychological indices:
     - **Heart Rate (HR)**: Base 72 bpm + (Burnout Index × 0.7) + (30 bpm if Health < 35%). Ranges between 55 and 150 bpm.
     - **Blood Pressure (BP)**: Modulates with burnout. Under critical state (<30% health), crashes to hypotensive shock (`82/46 mmHg`).
     - **Oxygen Saturation ($SpO_2$)**: Scales from 85% up to 100% based on preparation health.
     - **Temperature**: Tracks physiological stress from $97.8^\circ\text{F}$ to $101.8^\circ\text{F}$.

---

### 3.2 Tactical Shift Modes & Weekly Scheduling
*Status: OPERATIONAL*

To mirror real medical hospital rotations, the resident can toggle between three operational modes via the header menu:
1. **Regular Shift (`Normal`)**: Default day-to-day operation. Standard protocol target volumes apply.
2. **Intensive On-Call (`Duty`)**:
   - Simulates exhausting hospital duty shifts.
   - **Target Halving**: Daily study targets are halved (e.g., 50 MCQs becomes 25; 4 hours of lectures becomes 2) to acknowledge limited study time while preventing complete streak loss.
   - **Strict Weekly Quota**: Limited to a maximum of **3 shifts per week**.
3. **Recovery Shift (`Rest`)**:
   - Simulates post-duty recovery.
   - All study protocols are suspended. Targets set to zero. Focus shifts exclusively to burnout clearance.
   - **Strict Weekly Quota**: Limited to a maximum of **1 shift per week**.
4. **Weekly Rollover**:
   - Every Monday (`currentWeekStart !== currentMondayStr`), `dutyDaysUsed` and `restDaysUsed` automatically reset to zero.

---

### 3.3 Protocols, Daily Objectives & The Continuity Archive
*Status: OPERATIONAL (Continuously Verified)*

1. **Active Shift Protocols**:
   - Five core default objectives:
     - `m-04-triage`: Daily Triage Completion (1 Session, 300 XP, +50 Health)
     - `m-01-mcqs`: Marrow/Pre-PG MCQs (50 Questions, 100 XP, +25 Health)
     - `m-02-lectures`: Video Modules (4 Hours, 200 XP, +35 Health)
     - `m-05-review`: High-Yield Review Session (1 Hour, 80 XP, +15 Health)
     - `m-03-gt`: Weekly Grand Test GT (1 Test, 500 XP, +100 Health, Weekly cycle)
   - Support for custom student-created protocols with customizable units, targets, and daily/weekly reset frequencies.

2. **The Shift Continuity Guarantee**:
   - **Pre-Reset Snapshots**: At midnight (00:00) rollover, before resetting today's mission progress back to zero, the engine creates an immutable snapshot of yesterday's completed and pending objectives.
   - **Real-Time Synchronization**: Any time a mission progress bar is incremented or claimed, today's entry in `mission_history` is updated synchronously in Firestore and local storage.
   - **Shift Continuity Archive View**: Residents can toggle between **Active Shift Protocols** and **Shift Continuity Archive** in the Protocols tab, viewing historical dates, completion badges (e.g. *4 of 5 Objectives Completed (80%)*), and expanding each shift to review every individual objective.

---

### 3.4 Clinical Triage Simulator & AI Vignette Engine
*Status: OPERATIONAL*

1. **Daily Operational Limit**:
   - Residents are allowed **5 clinical emergency cases per day** to preserve the premium psychological stakes and prevent cognitive fatigue. Tracked via `triageCasesLogs[today]`.
2. **Dynamic AI Generation (`/api/cases/generate`)**:
   - Powered by Gemini 2.5 Flash via server-side proxy.
   - Prompts enforce strict postgraduate NEET PG standards: Indian fictional patient names, clinical buzzwords, initial lab values, multi-choice decision options (A, B, C, D), high-yield pearls, and pathophysiological explanations.
   - Covers 7 major clinical departments: Emergency Medicine/ICU, Cardiology, OB-GYN, Pharmacology, Pediatrics, Internal Medicine, and General Surgery.
3. **Offline Resilient Fallback Engine**:
   - If offline or if the Gemini API key is unavailable, the backend gracefully switches to a built-in library of curated clinical emergency cases.
4. **Two-Stage Multi-Attempt Diagnostic Logic**:
   - First incorrect answer: Triggers acute telemetry alarms and marks the case as `CRITICAL` (giving the resident one opportunity to reconsider).
   - Second incorrect answer: Case suffers **FLATLINE**, drops preparation health by -25%, resets `shiftStreak` to 0, and records a `FLATLINED` case in the log.
   - Correct answer: Immediate cardiac stabilization chime, +30% health, +150–250 XP, +2–4 credits, streak bonus calculation, and an unlock of a **High-Yield Clinical Pearl**.
5. **Post-Shift AI Suggestions (`/api/cases/suggestions`)**:
   - After completing a shift, the AI Chief Resident analyzes mistakes made during the session and prescribes 3 targeted high-yield topics to study.

---

### 3.5 Progress Analytics, Ranks & AI Chief Resident
*Status: OPERATIONAL*

1. **Clinical Operational Ranks**:
   - `Intern`: Level 1 (0 – 499 XP)
   - `Junior Resident`: Level 2 (500 – 1,499 XP)
   - `Senior Resident`: Level 3 (1,500 – 2,999 XP)
   - `Chief Resident`: Level 4 (3,000 – 5,999 XP)
   - `Attending`: Level 5 (6,000+ XP)
2. **Subject Mastery & 30-Day Rolling Accuracy Window**:
   - **Dual Perspective Analysis**: In addition to cumulative lifetime performance, the system computes an exact **30-Day Rolling Window** across all 19 medical specialties:
     $$\text{Rolling Window} = \{ d \in \text{subjectPerformanceDaily} \cup \text{EmergencyLogs} \mid \text{date}(d) \ge \text{Today} - 30\,\text{days} \}$$
   - **Momentum & Velocity Tracking ($\Delta$)**:
     $$\Delta = \text{Rolling Accuracy } \% - \text{Lifetime Mastery } \%$$
     Positive $\Delta$ indicates cognitive improvement and acute retention; negative $\Delta$ indicates knowledge decay or examination fatigue.
   - **Interactive Three-Tier Visualization**:
     - *Dual Comparison*: Side-by-side comparative bars showing Lifetime Mastery vs. 30-Day Rolling percentage.
     - *30-Day Rolling*: Focused view displaying recent 30-day percentage and intervention volume.
     - *Lifetime Only*: Historical career-spanning diagnostic benchmark.
   - **Detailed Specialty Breakdown Cards**: Real-time progress bars, case counts, and trend momentum badges (`TrendingUp` / `TrendingDown`) for every specialty.
3. **7-Day Longitudinal Telemetry**:
   - Dual-axis visual timeline plotting cases solved, hours of sleep, MCQs solved, and lecture hours over the previous week.
4. **AI Chief Resident Formal Review (`/api/metrics/review`)**:
   - Offers Daily, Weekly, and Monthly reviews.
   - The tone of the AI Chief Resident adapts dynamically based on time remaining to the exam:
     - `< 30 Days`: Wartime Chief Resident — terse, mission-critical, ruthless prioritization.
     - `< 90 Days` or High Burnout: Urgent Chief Resident — direct, demanding immediate habit adjustments.
     - `< 180 Days`: Analytical Chief Resident — focuses on structural gaps.
     - `> 180 Days`: Mentoring Chief Resident — emphasizes habits and foundational pace.

---

### 3.6 Biocompatibility, Sleep, Rewards & Persistence
*Status: OPERATIONAL*

1. **Biocompatibility (Mood) Logger**:
   - Records mental resilience from 1 (Exhausted) to 5 (Radiant).
   - Captures procrastination triggers (e.g., "Doomscrolled YouTube for 90 minutes").
   - Restores resilience (+12% Health, -15% Burnout).
2. **Sleep & Rest Recovery**:
   - Dedicated sleep logging modal. Every hour logged replenishes +4% Health and sheds -10% Burnout.
3. **Gamified Real-Life Reward Store**:
   - Earned Credits (`credits`) are redeemable for real-life rest incentives:
     - Specialty Coffee / Espresso: 4 Credits
     - Gaming Session (45 min): 8 Credits
     - Cheat Meal / Pizza Night: 15 Credits
     - Movie / Streaming Break: 10 Credits
4. **Multi-Platform Data Persistence**:
   - Real-time Firestore synchronization with automated error trapping (`handleFirestoreError`).
   - LocalStorage offline mirror ensures 100% functionality without internet access.

---

## 4. COMPREHENSIVE AUDIT: WHAT WAS FIXED & WHAT REMAINS MALFUNCTIONING

### 4.1 Defects Resolved & Architecture Enhanced
| Subsystem | Previous State (Defect) | Implemented Resolution |
| :--- | :--- | :--- |
| **System Active Stuck at 1 Day** | In Settings panel, `earliestDate` relied on `lastMissionResetDate` which was constantly reset to today, showing "System Active: 1 Day" indefinitely. | Introduced permanent `firstActiveDate` / `createdAt` in schema and computed actual elapsed calendar days via `getDaysDiff(firstActiveDate, today) + 1` alongside total cleared shifts. |
| **Screen Time Parameter Drain** | Vitals decayed passively per interval / screen time while student was studying or reading, draining health without clinical correlation. | Decoupled vitals decay from screen time. Parameters now adjust strictly by clinical performance: triage case outcomes (stabilization +30%, flatline -25%) and daily shift goals met (+10%) vs. missed (-20%). |
| **Multi-Day Inactivity Gap Logging** | Shifts were only archived if the app was opened. If a user was active on 08/10 and returned on 10/10, 09/10 had no data recorded. | Implemented automated backfilling via `getIntermediateISODates`. Intermediate unattended dates are permanently archived with `status: "Shift Missed"`, `0/5` objectives completed, and accurate penalty applied. |
| **Date Formatting Standard** | Dates were rendered in mixed ISO format (`YYYY-MM-DD`) or localized strings. | Standardized universal date formatting to `dd-mm-yyyy` across Shift Archive, Telemetry Logs, Heatmap, Progress Windows, and Settings. |
| **Data Preservation Guarantee** | User concern that architecture refactors or continuity updates might wipe client-side progress. | Zero-reset guarantee: all state loads deep-merge with existing Firestore and local storage records. Existing XP, credits, pearls, and subject metrics are 100% preserved. |
| **30-Day Rolling Accuracy Window** | Only lifetime cumulative accuracy was stored, penalizing users for early mistakes and hiding recent gains. | Introduced 30-Day Rolling Accuracy alongside Lifetime Mastery with dual-view segment toggles, KPI momentum $\Delta$, and subject breakdown cards. |
| **Daily Objectives Continuity** | At midnight, missions reset `current: 0, status: "Pending"` in-place. Yesterday's completion status was permanently erased. | Implemented `DailyMissionRecord` schema and `mission_history` archive in Firestore and localStorage. Snapshot saved before reset; live progress synced continuously. |

---

### 4.2 Known Quirks, Edge Cases & Gaps

1. **Client-Side Browser Notification Limitations**:
   - *Behavior*: Morning Shift alerts at 08:00 AM are powered by client-side Web Notifications and Service Workers.
   - *Limitation*: If the student closes their device or browser completely overnight, client-side timers pause. The notification only triggers once the device wakes and the tab resumes.
   - *Mitigation*: Service worker registration is implemented, and the Settings panel includes clear troubleshooting instructions and a manual test button.

2. **Audio Context Autoplay Policy**:
   - *Behavior*: The Web Audio API synthesizer requires an initial user interaction (click/touch) to resume the audio context (`AudioContext`).
   - *Nuance*: The first sound may be silent if triggered before any click event. The app mitigates this by initializing on any button tap.

---

## 5. COMPLETE VERIFICATION CHECKLIST

- [x] **TypeScript Build**: Compiled clean with zero errors via `compile_applet`.
- [x] **Linting Status**: Passed `tsc --noEmit` with zero warnings via `lint_applet`.
- [x] **Idle Decay Engine**: Refactored to compute exact elapsed time on tab focus / visibility change.
- [x] **30-Day Rolling Accuracy**: Implemented alongside lifetime mastery with comparative charts and trend momentum.
- [x] **Firestore Security Rules**: Hardened ABAC rules deployed via RPC with owner-restricted access to `/users/{userId}`, `/missions`, `/logs`, `/moods`, and `/mission_history`.
- [x] **Data Continuity**: Daily objective archival verified in Firestore and local storage.
- [x] **Offline Resilience**: Automatic fallback for cases and telemetry when Gemini API or network is unavailable.

---

*Patient Zero System Engineering Group — Build Verification Complete.*
