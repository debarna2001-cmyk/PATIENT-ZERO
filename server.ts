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
    const prompt = `Generate a rigorous, complex, high-yield clinical vignette case modeled after the NEET PG (Indian Postgraduate Medical Entrance) examination. 
The subject category should be: "${chosenSpecialty}".

The response must focus on emergency or high-stress medicine, involving simulated clinical decision-making. 

Please follow these character/vibe attributes:
- "patientName": An authentic sound-alike name for an Indian patient, e.g. "Arjun Sharma", "Amina Begum", "Dr. Kasturi".
- "ageGender": e.g. "45-year-old Female", "62-year-old Male".
- "chiefComplaint": A dramatic, brief summary of their acute agony, e.g., "Crushing substernal chest pressure for 2 hours with profuse diaphoresis."
- "clinicalVignette": A detailed paragraph describing their initial emergency presentation, medical history, physical examination findings (like pupil reaction, breath sounds, reflexes, abdominal rigidity), and relevant vitals or clinical findings. Use high-yield clinical buzzwords (e.g. "water-hammer pulse", "clasp-knife rigidity", "currant-jelly stools") appropriate for NEET PG.
- "labResults": An array of 2 to 4 crucial lab findings or diagnostic findings (e.g., "K+ level: 2.8 mEq/L", "ECG: ST-elevation in leads V1-V4", "Chest X-Ray: Thumb-print sign").
- "options": An object with properties "A", "B", "C", and "D". Each option should present a plausible medical decision (e.g., choice of drug, initial resuscitation action, definitive management, surgical consult). Only ONE option is strictly correct based on the latest medical guidelines (Harrison's, Bailey & Love, Nelson guidelines).
- "correctAnswer": Must be exactly one of "A", "B", "C", or "D".
- "highYieldPearl": A 1-2 sentence golden NEET PG clinical pearl/mnemonic that will help students rapidly recall this disease or management choice.
- "explanation": A structured, comprehensive feedback explaining why the correct option is standard of care, and explicitly naming why each of the other three premium options are incorrect or represent a life-threatening delay in this emergency context.
- "initialVitals": Realistic patient vitals on presentation, including:
  - "hr": Heart rate in bpm (Range: 40 - 150)
  - "bp": Blood pressure (Range: "70/40" - "210/120")
  - "spo2": SpO2 in % (Range: 75 - 100)
  - "temp": Temperature in Fahrenheit (Range: 96.0 - 105.0)

Make sure the question requires active pathophysiological or pharmacological reasoning to solve, fitting the 'psychological survival of a resident doctors shift' theme. Avoid easy questions; these are medical PG level questions.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly demanding medical residency examiner who has designed a clinical survival simulation for NEET PG postgraduate test prep. You output medically pristine, highly rigorous clinico-pathological vignettes.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
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
            "specialty",
            "complexity",
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
        },
      },
    });

    const parsedData = JSON.parse(response.text.trim());
    parsedData.id = parsedData.id || `ai-${Date.now()}`;
    res.json(parsedData);
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
