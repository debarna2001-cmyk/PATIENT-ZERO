import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { fallbackCases } from "./src/fallbackCases";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client if key is present
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY" && API_KEY.trim() !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Patient Zero Server: Gemini API initialized successfully.");
  } catch (error) {
    console.error("Patient Zero Server: Failed to initialize Gemini API.", error);
  }
} else {
  console.log("Patient Zero Server: No GEMINI_API_KEY. Using rich offline vignette engine.");
}

// 1. API Endpoint: Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiEnabled: ai !== null,
    systemTime: new Date().toISOString(),
  });
});

// 2. API Endpoint: Specialty List
app.get("/api/cases/specialties", (req, res) => {
  const specialties = [
    "Emergency Medicine / ICU",
    "Cardiology",
    "Obstetrics & Gynecology",
    "Pharmacology & Toxicology",
    "Pediatrics",
    "Internal Medicine",
    "General Surgery",
    "Neurology & Psychiatry",
    "Anesthesiology & ENT",
  ];
  res.json({ specialties });
});

// 3. API Endpoint: Generate NEET PG Clinical Case
app.post("/api/cases/generate", async (req, res) => {
  const { specialty } = req.body;
  const chosenSpecialty = specialty || "Emergency Medicine / ICU";

  // Check if AI is initialized; if not, fallback to local cases
  if (!ai) {
    console.log(`AI disabled or unconfigured. Serving offline fallback case for: ${chosenSpecialty}`);
    const filtered = fallbackCases.filter(c => 
      c.specialty.toLowerCase().includes(chosenSpecialty.toLowerCase().replace(" / ", " ")) ||
      chosenSpecialty.toLowerCase().includes(c.specialty.split(" / ")[0].toLowerCase())
    );
    const options = filtered.length > 0 ? filtered : fallbackCases;
    const randomCase = options[Math.floor(Math.random() * options.length)];
    // Return a copy with a generated dynamic ID
    return res.json({
      ...randomCase,
      id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });
  }

  try {
    const prompt = `Generate an array of 5 high-yield clinical vignettes for NEET PG medical students. Specialty: ${chosenSpecialty}.
Focus on life-or-death emergencies where quick decision making is required.

For each case, provide:
- "patientName": A fictional realistic Indian name.
- "ageGender": e.g., "45M"
- "chiefComplaint": A dramatic, brief summary of their acute agony.
- "clinicalVignette": A detailed paragraph describing their initial emergency presentation, medical history, physical examination, and relevant vitals or clinical findings. Use high-yield clinical buzzwords.
- "labResults": An array of 2 to 4 crucial lab findings or diagnostic findings.
- "options": An object with properties "A", "B", "C", and "D". Each option should present a plausible medical decision. Only ONE option is strictly correct.
- "correctAnswer": Must be exactly one of "A", "B", "C", or "D".
- "highYieldPearl": A 1-2 sentence golden NEET PG clinical pearl/mnemonic.
- "explanation": A structured, comprehensive feedback explaining why the correct option is standard of care.
- "initialVitals": Realistic patient vitals on presentation, including:
  - "hr": Heart rate in bpm (Range: 40 - 180)
  - "bp": Blood pressure string (e.g. "90/60")
  - "spo2": SpO2 percentage (Range: 70 - 100)
  - "temp": Temperature in Fahrenheit (Range: 96.0 - 105.0)

Make sure the questions require active pathophysiological or pharmacological reasoning. Avoid easy questions; these are medical PG level questions.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly demanding medical residency examiner who has designed a clinical survival simulation for NEET PG postgraduate test prep. You output medically pristine, highly rigorous clinico-pathological vignettes.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              specialty: { type: Type.STRING },
              complexity: { type: Type.STRING },
              patientName: { type: Type.STRING },
              ageGender: { type: Type.STRING },
              chiefComplaint: { type: Type.STRING },
              clinicalVignette: { type: Type.STRING },
              labResults: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                },
                required: ["A", "B", "C", "D"],
              },
              correctAnswer: { type: Type.STRING },
              highYieldPearl: { type: Type.STRING },
              explanation: { type: Type.STRING },
              initialVitals: {
                type: Type.OBJECT,
                properties: {
                  hr: { type: Type.INTEGER },
                  bp: { type: Type.STRING },
                  spo2: { type: Type.INTEGER },
                  temp: { type: Type.NUMBER },
                },
                required: ["hr", "bp", "spo2", "temp"],
              },
            },
            required: [
              "patientName",
              "ageGender",
              "chiefComplaint",
              "clinicalVignette",
              "options",
              "correctAnswer",
              "highYieldPearl",
              "explanation",
              "initialVitals",
            ],
          }
        },
      },
    });

    const rawText = response.text || "";
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);
    const mappedData = parsedData.map((d: any) => ({ ...d, id: `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`, specialty: chosenSpecialty, complexity: 'Urgent' }));
    res.json(mappedData);
  } catch (error) {
    console.error("Gemini case generation failed. Resorting to local deck of survival scenarios...", error);
    // Serve a backup case so the user has an uninterrupted premium experience
    const randomCase = fallbackCases[Math.floor(Math.random() * fallbackCases.length)];
    res.json({
      ...randomCase,
      id: `local-error-fallback-${Date.now()}`
    });
  }
});

app.post("/api/cases/suggestions", async (req, res) => {
  const { sessionHistory } = req.body;
  if (!ai || !sessionHistory || sessionHistory.length === 0) {
    return res.json({ suggestions: ["Review Advanced Cardiac Life Support (ACLS)", "Review Acute Respiratory Distress Syndrome (ARDS)", "Review Status Epilepticus Protocols"] });
  }

  try {
    const historySummary = (sessionHistory as any[]).map(sh => `Case: ${sh.case.clinicalVignette} - Solved: ${sh.success ? 'Yes' : 'No'}`).join("\n");
    const prompt = `Based on these recently attempted medical clinical vignettes:
${historySummary}
Suggest exactly 3 high-yield theoretical topics the medical student should read to improve. Return a JSON object with 'suggestions' array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a residency mentor directing a student's study plan.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["suggestions"],
        }
      }
    });

    res.json(JSON.parse(response.text || '{"suggestions":[]}'));
  } catch (error) {
     res.json({ suggestions: ["Review ACLS protocols", "Review ARDS management", "Review Shock algorithms"] });
  }
});

// 4. API Endpoint: AI Oversight / Performance Reviews
app.post("/api/metrics/review", async (req, res) => {
  const { stats, type } = req.body;
  if (!ai) {
    return res.json({ 
      title: "Chief Resident Feedback",
      content: `Your current fatigue index is ${stats?.burnoutIndex}%. Ensure you get enough sleep and complete cases consistently.`,
      actionableAdvice: ["Maintain study streaks", "Take frequent breaks"]
    });
  }

  try {
    const prompt = `Generate a ${type} performance review for a medical student preparing for NEET PG.
Student Stats: 
- Cases Solved: ${stats.patientsSaved}
- Burnout/Fatigue Index: ${stats.burnoutIndex}%
- Current Streak: ${stats.shiftStreak}
- Vitals Health Multiplier: ${stats.patientHealth}%
- Activity Logs: ${JSON.stringify(stats.activityLogs)}
- Sleep Logs: ${JSON.stringify(stats.sleepLogs)}
- MCQ Logs: ${JSON.stringify(stats.mcqLogs)}
- Video Logs: ${JSON.stringify(stats.videoLogs)}

Give a tough but motivating review from an elite AI Chief Resident. Output a JSON with title, a paragraph of review content grading their resilience and study habits, and an array of 2 actionable advice points.`;

    const daysRemaining = stats?.daysToExam ?? 365;
    const burnoutLevel = stats?.burnoutIndex ?? 0;

    const dynamicSystemInstruction =
      daysRemaining < 30 ?
        `You are a wartime chief resident with ${daysRemaining} days left before your student's NEET PG exam. Be terse, mission-critical, and ruthless about priorities. No encouragement unless the numbers justify it.` :
      daysRemaining < 90 || burnoutLevel > 65 ?
        `You are an urgent chief resident. Your student has ${daysRemaining} days remaining. Be direct and demanding. Identify what must change immediately.` :
      daysRemaining < 180 ?
        `You are a demanding chief resident with ${daysRemaining} days remaining. Acknowledge what is working but push hard on gaps. Be analytical, not motivational.` :
        `You are a mentoring chief resident in the early orientation phase with ${daysRemaining} days remaining. Focus on building habits and systems, not panic.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: dynamicSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             title: { type: Type.STRING },
             content: { type: Type.STRING },
             actionableAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "content", "actionableAdvice"],
        }
      }
    });

    res.json(JSON.parse(response.text || '{"title":"Review Failed","content":"Error generating review","actionableAdvice":[]}'));
  } catch (error) {
    res.json({ 
      title: "System Fallback Review",
      content: "You are pushing hard. Keep tracking your sleep to optimize cognitive load and avoid critical burnout.",
      actionableAdvice: ["Rest appropriately", "Focus on high-yield pearls"]
    });
  }
});

// Configure Vite middleware in development or express static client bundling in production
async function runServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Patient Zero express server humming on port ${PORT}`);
  });
}

runServer().catch((err) => {
  console.error("Critical server startup crash:", err);
});
