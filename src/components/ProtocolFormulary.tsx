import { Lock, Eye, BookOpen, Stethoscope, Dumbbell } from "lucide-react";

interface Protocol {
  id: string;
  title: string;
  category: string;
  requiredXp: number;
  mnemonicName: string;
  mnemonicFormula: string;
  clinicalDetails: string[];
}

interface ProtocolFormularyProps {
  currentXp: number;
}

const protocols: Protocol[] = [
  {
    id: "prot-gcs",
    title: "Glasgow Coma Scale (GCS) Score",
    category: "Trauma & Neurology",
    requiredXp: 0, // Unlocked initially
    mnemonicName: "E - V - M score indices",
    mnemonicFormula: "E4 - V5 - M6 (Total points: 3 - 15)",
    clinicalDetails: [
      "Eye Opening (E): 4 Spontaneous, 3 To sound, 2 To pain, 1 None.",
      "Verbal Response (V): 5 Oriented, 4 Confused, 3 Inappropriate words, 2 Incomprehensible sounds, 1 None.",
      "Motor Response (M): 6 Obeys commands, 5 Localizes pain, 4 Withdrawal (normal flexion), 3 Abnormal flexion (decorticate), 2 Extension (decerebrate), 1 None.",
      "NEET PG Key: Intubation is baseline mandatory for GCS ≤ 8 ('8, intubate!'). Decerebrate posturing represents lower brainstem lesions and carries higher clinical mortality than decorticate."
    ]
  },
  {
    id: "prot-acls",
    title: "ACLS Resuscitation Drug Dosage",
    category: "Emergency Cardiology",
    requiredXp: 120, // Requires 120 XP
    mnemonicName: "ROSC Resuscitation Algorithm",
    mnemonicFormula: "1mg Adrenaline + 300mg Amiodarone",
    clinicalDetails: [
      "Adrenaline (Epinephrine): 1mg IV push every 3 to 5 minutes for asystole, PEA, and shock-refractory VF/pVT.",
      "Amiodarone: 1st Dose: 300 mg IV lipid emulsion bolus. 2nd Dose: 150 mg IV (for shock-refractory VF/pulseless VT). Alternatively, Lidocaine 1-1.5 mg/kg IV.",
      "Reversible Causes (5 Hs & 5 Ts): Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo/Hyperkalemia, Hypothermia; Tension pneumothorax, Tamponade (cardiac), Toxins, Thrombosis (pulmonary), Thrombosis (coronary)."
    ]
  },
  {
    id: "prot-antidote",
    title: "High-Yield Toxicology Antidotes",
    category: "Pharmacology & ICU",
    requiredXp: 280, // Requires 280 XP
    mnemonicName: "Antidotal Clearance Keys",
    mnemonicFormula: "OP: Atropine | ACM: NAC | Arrhy: Digibind",
    clinicalDetails: [
      "Organophosphate Pesticides: Atropine (titrate to resolve bronchial hypersecretion) and Pralidoxime (reactivates acetylcholinesterase).",
      "Acetaminophen (Paracetamol) overdose: N-acetylcysteine (NAC) - restores glutathione stores in the liver. Administer based on Rumack-Matthew nomogram.",
      "Benzodiazepines: Flumazenil (Caution: can precipitate lethal withdrawal seizures in chronic users).",
      "β-blocker toxicity: Glucagon (bypasses β-receptors to increase cAMP inside cardiac myocytes)."
    ]
  },
  {
    id: "prot-eclampsia",
    title: "Eclampsia Pritchard Regime (MgSO₄)",
    category: "Obstetrics & Gynecology",
    requiredXp: 450, // Requires 450 XP
    mnemonicName: "Seizure Prevention Rule",
    mnemonicFormula: "MgSO4: 14g Loading -> 5g alternate IM Q4H",
    clinicalDetails: [
      "Loading Dose: 4g of 20% MgSO4 IV slowly over 15-20 mins + 10g of 50% solution deep IM (5g in each buttock).",
      "Maintenance Dose: 5g IM of 50% solution in alternating buttocks every 4 hours, provided: Patellar reflexes are present, respiration > 12/min, and urine output > 25 mL/hr.",
      "Management of Toxicity: If reflexes vanish or breathing slows, stop MgSO4 immediately and inject 10 mL of 10% Calcium Gluconate IV slowly over 10 minutes."
    ]
  },
  {
    id: "prot-apgar",
    title: "Pediatric APGAR Diagnostic Score",
    category: "Neonatology & Pediatrics",
    requiredXp: 600, // Requires 600 XP
    mnemonicName: "Immediate Neonatal Resuscitation Guide",
    mnemonicFormula: "A-P-G-A-R index (0, 1, or 2 points each)",
    clinicalDetails: [
      "Appearance (Skin Color): 2 Completely pink, 1 Pink body with blue extremities (acrocyanosis), 0 Completely blue or pale.",
      "Pulse (Heart Rate): 2 ≥ 100 bpm, 1 < 100 bpm, 0 Absent.",
      "Grimace (Reflex Irritability on stimulation): 2 Sneezes/coughs/cries, 1 Grimace or weak cry, 0 No response.",
      "Activity (Muscle Tone): 2 Active motion & flexed posture, 1 Some flexion of extremities, 0 Flaccid or limp.",
      "Respiration (Breathing Effort): 2 Vigorous cry, 1 Slow, irregular, or weak cry, 0 Absent respiration."
    ]
  }
];

export default function ProtocolFormulary({ currentXp }: ProtocolFormularyProps) {
  return (
    <div className="bg-slate-950 border border-white/5 rounded-xl p-5 shadow-lg flex flex-col gap-4" id="protocols-formulary-panel">
      <div className="border-b border-white/5 pb-3">
        <h3 className="font-sans font-bold text-base text-white">Therapeutic Formulary Protocols</h3>
        <p className="text-xs text-slate-400">High-yield standard operating guides, codes, and mnemonics critical for NEET PG questions. Earn XP in clinical shifts to unlock.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protocols.map((proto) => {
          const isLocked = currentXp < proto.requiredXp;

          return (
            <div
              key={proto.id}
              className={`border rounded-xl p-4 transition-all duration-300 relative overflow-hidden ${
                isLocked
                  ? "border-slate-900 bg-slate-950/40 text-slate-600 dark:text-slate-400 select-none"
                  : "border-indigo-950 bg-slate-900/10 hover:border-indigo-800/60"
              }`}
              id={`protocol-card-${proto.id}`}
            >
              {/* Blur screen for locked state */}
              {isLocked && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                  <Lock className="w-6 h-6 text-red-500/80 mb-2 animate-bounce" />
                  <span className="font-mono text-xs text-slate-300 font-bold uppercase tracking-wider">
                    PROTOCOL LOCKED
                  </span>
                  <span className="font-mono text-[10px] text-red-400 mt-1">
                    Requires: {proto.requiredXp} Clinical XP
                  </span>
                  <span className="font-mono text-[9px] text-slate-500 mt-1">
                    (Current Balance: {currentXp} XP)
                  </span>
                </div>
              )}

              {/* Protocol Content */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] bg-indigo-505/10 text-indigo-400 border border-indigo-950 rounded px-1.5 py-0.5">
                    {proto.category}
                  </span>
                  {!isLocked && (
                    <span className="font-mono text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                      <Eye className="w-3 h-3" /> ACTIVE NODE
                    </span>
                  )}
                </div>

                <h4 className="font-sans font-bold text-sm text-white mt-1">
                  {proto.title}
                </h4>

                <div className="mt-2 py-1.5 px-2 bg-black/60 border border-white/5 rounded font-mono text-xs flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mnemonic Key:</span>
                    <span className="text-indigo-400 font-bold">{proto.mnemonicName}</span>
                  </div>
                  <div className="flex justify-between mt-0.5 border-t border-white/5 pt-1">
                    <span className="text-slate-500">Core Index:</span>
                    <span className="text-emerald-400 font-bold font-mono">{proto.mnemonicFormula}</span>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-col gap-1">
                  <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-indigo-400" /> RESIDENCY DIRECTIVES
                  </span>
                  <ul className="flex flex-col gap-1.5 mt-1">
                    {proto.clinicalDetails.map((detail, idx) => (
                      <li key={idx} className="font-sans text-[11px] leading-relaxed text-slate-300 flex items-start gap-1">
                        <span className="text-indigo-400 font-mono select-none mt-0.5">{idx + 1}.</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
