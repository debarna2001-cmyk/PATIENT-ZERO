import { ClinicalCase } from "./types";

export const fallbackCases: ClinicalCase[] = [
  {
    id: "case-01-pneumothorax",
    specialty: "Surgery / Emergency Medicine",
    complexity: "Critical",
    patientName: "Officer Vikram",
    ageGender: "28-year-old Male",
    chiefComplaint: "Severe respiratory distress following chest trauma in a road accident.",
    clinicalVignette: "A 28-year-old male is rushed to the emergency room following a motorcycle accident. He is in severe respiratory distress, cyanotic, and using accessory muscles of respiration. On examination, there is tracheal deviation to the left, diminished breath sounds on the right hemithorax, and hyperresonance to percussion on the right side. Distended neck veins are noted.",
    labResults: [
      "Heart Rate: 132 bpm (Sinus Tachycardia)",
      "Blood Pressure: 82/50 mmHg (Shock)",
      "SpO2: 84% on room air",
      "ABG: Severe Hypoxemia & Respiratory Acidosis"
    ],
    options: {
      A: "Immediate tube thoracostomy (Chest drain) in the 5th intercostal space",
      B: "Needle decompression in the 2nd intercostal space, midclavicular line (or 5th ICS, midaxillary line)",
      C: "Urgent portable Chest X-ray to confirm the diagnosis",
      D: "Endotracheal intubation and mechanical ventilation"
    },
    correctAnswer: "B",
    highYieldPearl: "NEET PG Key: In Tension Pneumothorax, clinical diagnosis is paramount. NEVER wait for an X-ray. Immediate needle decompression overrides all other interventions to relieve obstructive shock.",
    explanation: "This patient presents with classic signs of Tension Pneumothorax (obstructive shock, tracheal deviation, absent breath sounds, hyperresonance). The immediate life-saving treatment is urgent needle decompression in the 2nd intercostal space midclavicular line or 5th intercostal space mid-axillary line. Performing a chest X-ray first (Option C) would delay treatment and could lead to cardiac arrest. Intubation (Option D) before pleural decompression can worsen pleural pressure and lead to complete cardiovascular collapse.",
    initialVitals: {
      hr: 132,
      bp: "82/50",
      spo2: 84,
      temp: 98.6
    }
  },
  {
    id: "case-02-eclampsia",
    specialty: "Obstetrics & Gynecology",
    complexity: "Critical",
    patientName: "Amina Begum",
    ageGender: "24-year-old Female (34 weeks pregnant)",
    chiefComplaint: "Generalized tonic-clonic seizures in the obstetric triage zone.",
    clinicalVignette: "A 24-year-old primigravida at 34 weeks of gestation is brought to the hospital by her husband because of a sudden onset of generalized tonic-clonic seizures lasting for 2 minutes. On initial assessment, she is post-ictal, confused, has a blood pressure of 172/112 mmHg, and 3+ proteinuria on dipstick. Her patellar reflexes are hyperreflexic.",
    labResults: [
      "Platelets: 105,000 / uL",
      "Serum Creatinine: 1.1 mg/dL",
      "Urine Dipstick: 3+ Proteinuria",
      "Liver Enzymes (ALT/AST): Normal range"
    ],
    options: {
      A: "Administer Diazepam 10mg IV bolus immediately",
      B: "Initialize Magnesium Sulfate (MgSO4) using the Pritchard or Zuspan regimen",
      C: "Stall anticonvulsants and perform an urgent Cesarean section",
      D: "Administer Phenytoin 15 mg/kg slow IV infusion"
    },
    correctAnswer: "B",
    highYieldPearl: "NEET PG Key: Magnesium Sulfate (MgSO4) is the drug of choice for preventing and treating seizures in Eclampsia. Monitor for toxicity: Patellar reflexes (1st to go), respiratory rate (<12/min), and urine output (<25 mL/hr). Antidote is Calcium Gluconate.",
    explanation: "This case illustrates Eclampsia. Magnesium sulfate is superior to other anticonvulsants (like diazepam or phenytoin) in preventing recurrent seizures and lowering maternal mortality. Initial steps include a loading dose of MgSO4 (4-6g IV over 20 mins plus deep IM injections if Pritchard regimen). Delivery is the definitive cure, but the patient must first be stabilized medically with anticonvulsants and antihypertensives.",
    initialVitals: {
      hr: 110,
      bp: "172/112",
      spo2: 95,
      temp: 99.1
    }
  },
  {
    id: "case-03-organophosphate",
    specialty: "Pharmacology & Toxicology",
    complexity: "Critical",
    patientName: "Farmer Ramesh",
    ageGender: "42-year-old Male",
    chiefComplaint: "Altered sensorium, frothing at the mouth, and intense breathing difficulties.",
    clinicalVignette: "A 42-year-old farmer is brought to the emergency department in a state of semi-consciousness, accessory muscle breathing, and excessive salivation. He was spraying pesticides in his farm 4 hours ago without protective gear. On examination, he has pinpoint pupils (miosis), bilateral diffuse crepitations in chest, muscle fasciculations, and a strong chemical odor on his clothes.",
    labResults: [
      "Cholinergic signs: Miosis, lacrimation, urination, defecation, GI upset, emesis, bronchoconstriction (SLUDGE)",
      "Red Blood Cell Acetylcholinesterase: Severely depressed"
    ],
    options: {
      A: "Atropine 2mg IV every 5-10 minutes titrated to double the dose until bronchial secretions clear",
      B: "Pralidoxime (2-PAM) alone without Atropine",
      C: "Naloxone 0.4mg IV to treat the pinpoint pupils and altered state",
      D: "Physostigmine 1mg IV slowly"
    },
    correctAnswer: "A",
    highYieldPearl: "NEET PG Key: In Organophosphate Poisoning, Atropine is the competitive antagonist of acetylcholine at muscarinic receptors. TITRATE Atropine to secure the airway (target: drying of pulmonary secretions and heart rate around 100 bpm), NOT pupil dilation alone.",
    explanation: "The patient is experiencing a cholinergic crisis due to organophosphate pesticide poisoning, which blocks acetylcholinesterase. This leads to toxic accumulations of acetylcholine. Atropine (Option A) acts as an antidote. Pralidoxime (Option B) is an acetylcholinesterase reactivator (oxime) that must ALWAYS be given together with Atropine, never alone, because it doesn't cross the blood-brain barrier effectively and can transiently worsen symptoms if atropine is absent. Physostigmine (Option D) is an acetylcholinesterase inhibitor and is contraindicated as it would worsen the cholinergic overload.",
    initialVitals: {
      hr: 54,
      bp: "96/60",
      spo2: 89,
      temp: 98.2
    }
  },
  {
    id: "case-04-dka",
    specialty: "Internal Medicine / Endocrinology",
    complexity: "Urgent",
    patientName: "Priyanka Roy",
    ageGender: "19-year-old Female",
    chiefComplaint: "Nausea, projectile vomiting, deep hyperpnea, and progressive drowsiness.",
    clinicalVignette: "A 19-year-old female with Type 1 Diabetes presents with abdominal pain, vomiting, and deep, sighing respirations (Kussmaul breathing). Her breath has a distinct fruity odor. Her blood glucose on a fingerstick is 450 mg/dL, and urine ketones are highly positive (4+). She is dehydrated and drowsy.",
    labResults: [
      "Random Blood Glucose: 450 mg/dL",
      "Arterial pH: 7.15 (Severe metabolic acidosis)",
      "Serum Bicarbonate: 10 mEq/L",
      "Anion Gap: 24 (High Anion Gap Metabolic Acidosis)"
    ],
    options: {
      A: "Immediate IV infusion of 50% Dextrose with 10 units regular insulin",
      B: "Aggressive aggressive intravenous fluid resuscitation with 0.9% Normal Saline (1-1.5L in 1st hour)",
      C: "Immediate intravenous Sodium Bicarbonate bolus of 100 mEq",
      D: "Administer subcutaneous Long-Acting Glargine insulin immediately"
    },
    correctAnswer: "B",
    highYieldPearl: "NEET PG Key: In Diabetic Ketoacidosis (DKA), the first and most critical step is volume resuscitation with isotonic saline (0.9% NaCl). This restores renal perfusion to clear ketones and glucose, and stabilizes intravascular collapse.",
    explanation: "While insulin is required to turn off ketogenesis, aggressive volume resuscitation (Option B) takes precedent. It dilutes circulating counter-regulatory hormones, decreases blood sugar, and restores hemodynamics. Giving insulin without fluid resuscitation can trigger collapse due to intravascular-to-intracellular fluid shifts. Sodium bicarbonate (Option C) is only guided if pH is severely low (<6.9) due to risks of hypokalemia, cerebral edema, and rebound acidosis.",
    initialVitals: {
      hr: 118,
      bp: "94/62",
      spo2: 97,
      temp: 100.2
    }
  },
  {
    id: "case-05-epiglottitis",
    specialty: "Pediatrics / ENT",
    complexity: "Critical",
    patientName: "Rahul",
    ageGender: "4-year-old Male",
    chiefComplaint: "Inability to swallow, high fever, and drooling of saliva in the tripod position.",
    clinicalVignette: "A 4-year-old boy is brought to the pediatric ER with high-grade fever, sore throat, and severe stridor. He is sitting forward, leaning on his hands with his neck extended and mouth open (tripod position), drooling saliva. He looks toxic and is extremely anxious. His parents suggest he had not received his routine Hib vaccinations.",
    labResults: [
      "Fever: 103.1 F",
      "Stridor: Present during both inspiration and expiration"
    ],
    options: {
      A: "Examine the posterior oropharynx with a tongue depressor to rule out peritonsillar abscess",
      B: "Keep the child calm, avoid disturbing him, and prepare for controlled airway inspection in the OR",
      C: "Obtain an immediate anteroposterior neck X-ray to look for croup (steeple sign)",
      D: "Administer nebulized epinephrine and oral dexamethasone immediately"
    },
    correctAnswer: "B",
    highYieldPearl: "NEET PG Key: Acute Epiglottitis is a pediatric emergency. NEVER examine the throat in an un-intubated child (no throat swabs or tongue depressor) as it can precipitate laryngospasm and complete respiratory shut-down. The priority is securing the airway in a controlled theatre environment.",
    explanation: "This child exhibits the classic presentation of Acute Epiglottitis (fever, dysphagia, drooling, distress in a tripod position), often caused by Haemophilus influenzae type b (Hib). Trying to visualize the epiglottis with a tongue depressor (Option A) can cause sudden laryngospasm and choking. The standard of care is to leave the child undisturbed in their position of comfort (Option B) and mobilize the anesthesia/ent team to transport the child to the operating room for direct laryngoscopy and intubation. Nebulized epinephrine (Option D) is the treatment of choice for croup, not epiglottitis.",
    initialVitals: {
      hr: 140,
      bp: "100/65",
      spo2: 91,
      temp: 103.1
    }
  },
  {
    id: "case-06-digoxin",
    specialty: "Pharmacology & Cardiology",
    complexity: "Urgent",
    patientName: "Savitri Devi",
    ageGender: "72-year-old Female",
    chiefComplaint: "Yellowish vision, confusing hallucinations, nausea, and feeling lightheaded.",
    clinicalVignette: "A 72-year-old female with chronic heart failure presents with a 3-day history of severe nausea, loss of appetite, fatigue, and a strange yellowish-green haze in her vision (xanthopsia). Her ECG reveals multiple premature ventricular contractions and a classic reverse tick/sagging ST segment depression. She takes Digoxin, Furosemide, and Enalapril.",
    labResults: [
      "Potassium: 2.9 mEq/L (Severe Hypokalemia)",
      "Creatinine: 1.8 mg/dL (Decline in GFR)"
    ],
    options: {
      A: "Assess and correct Serum Potassium, stop Digoxin, and monitor closely",
      B: "Administer immediate IV Calcium Gluconate to stabilize the cardiac membrane",
      C: "Increase her dose of Furosemide to clear the yellow visual pigments",
      D: "Initiate hemodialysis to filter the Digoxin"
    },
    correctAnswer: "A",
    highYieldPearl: "NEET PG Key: Hypokalemia increases Digoxin toxicity because Potassium competes with Digoxin for binding site on the Na+/K+ ATPase pump. When potassium is low, digoxin binds more readily, causing toxicity despite therapeutic drug levels. Correct hypokalemia immediately. NEVER give Calcium in Digoxin toxicity as calcium concentration synergizes digoxin effects and triggers 'stone-heart' arrest.",
    explanation: "Digoxin toxicity is precipitated here by diuretic-induced hypokalemia (Furosemide) and a renal GFR decline that decreases digoxin excretion. The priority is to stop digoxin, verify potassium levels, and correct potassium (Option A) to stabilize the heart rate. Giving Calcium (Option B) is contraindicated in digoxin toxicity because digoxin already blocks the sodium-potassium ATPase, leading to high intracellular calcium; adding extra calcium can lead to lethal ventricular tachyarrhythmias. Digoxin is not dialyzable (Option D) due to its extremely high volume of distribution.",
    initialVitals: {
      hr: 48,
      bp: "102/64",
      spo2: 96,
      temp: 98.4
    }
  }
];
