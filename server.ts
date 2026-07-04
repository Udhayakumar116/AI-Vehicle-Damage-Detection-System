import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialize Gemini client to avoid crash if API key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required to run live damage detection.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
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

  // Set limits for base64 vehicle images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Helper mock generator for Demo Mode (if API key is missing or explicitly run as demo)
  const getMockDetections = (filename: string) => {
    const mockDb: Record<string, any> = {
      "demo_car_1.jpg": {
        damage_count: 2,
        inference_time_ms: 124,
        damages: [
          {
            class_name: "dent",
            confidence: 0.89,
            severity: "moderate",
            description: "Deep dent on the front passenger door panel",
            box_2d: [380, 210, 560, 520] // ymin, xmin, ymax, xmax (0-1000)
          },
          {
            class_name: "scratch",
            confidence: 0.74,
            severity: "minor",
            description: "15cm linear scratch below the door handle",
            box_2d: [480, 240, 510, 440]
          }
        ]
      },
      "demo_car_2.jpg": {
        damage_count: 3,
        inference_time_ms: 142,
        damages: [
          {
            class_name: "broken_light",
            confidence: 0.96,
            severity: "severe",
            description: "Shattered right headlight housing and bulb exposure",
            box_2d: [450, 720, 620, 910]
          },
          {
            class_name: "bumper_damage",
            confidence: 0.88,
            severity: "moderate",
            description: "Cracked bumper cover and minor dislocation at joint",
            box_2d: [520, 580, 780, 950]
          },
          {
            class_name: "scratch",
            confidence: 0.65,
            severity: "minor",
            description: "Surface scuff marks on the lower right bumper corner",
            box_2d: [680, 780, 740, 910]
          }
        ]
      },
      "demo_car_3.jpg": {
        damage_count: 1,
        inference_time_ms: 98,
        damages: [
          {
            class_name: "glass_damage",
            confidence: 0.91,
            severity: "severe",
            description: "Webbed impact crack on the front windshield (spiderweb pattern)",
            box_2d: [200, 350, 480, 680]
          }
        ]
      },
      "default": {
        damage_count: 1,
        inference_time_ms: 150,
        damages: [
          {
            class_name: "dent",
            confidence: 0.85,
            severity: "moderate",
            description: "Visible dent located in the center panel of the body",
            box_2d: [300, 300, 700, 700]
          }
        ]
      }
    };
    return mockDb[filename] || mockDb["default"];
  };

  // API Route: Check Gemini API Connection Status
  app.get("/api/status", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    res.json({
      status: "online",
      apiKeyConfigured: hasKey,
      mode: hasKey ? "live" : "demo"
    });
  });

  // API Route: Detect Vehicle Damage
  app.post("/api/detect", async (req, res) => {
    try {
      const { image, filename, isDemo, confidenceThreshold, selectedClasses } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      const confThresh = confidenceThreshold !== undefined ? Number(confidenceThreshold) : 0.25;
      const classesToDetect = selectedClasses || ["scratch", "dent", "broken_light", "bumper_damage", "glass_damage"];

      // If requested as demo, or if Gemini key is missing, return high-quality mock data
      const hasKey = !!process.env.GEMINI_API_KEY;
      if (isDemo || !hasKey) {
        // Yield some simulated network delay (e.g. 800ms) to feel real
        await new Promise(resolve => setTimeout(resolve, 1000));
        const baseResult = getMockDetections(filename || "");
        
        // Filter mock results based on client thresholds
        const filteredDamages = baseResult.damages.filter((d: any) => {
          return d.confidence >= confThresh && classesToDetect.includes(d.class_name);
        });

        return res.json({
          ...baseResult,
          damages: filteredDamages,
          damage_count: filteredDamages.length,
          is_mocked: true,
          apiKeyConfigured: hasKey
        });
      }

      // Live Detection using Gemini Multimodal Model
      const ai = getGeminiClient();
      
      // Extract base64 payload
      let mimeType = "image/jpeg";
      let base64Data = image;
      
      if (image.startsWith("data:")) {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };

      const promptText = `You are an expert vehicle damage inspector. Analyze the uploaded car image and identify any structural, paint, or panel damage.
Classify each damage into one of these exact categories:
- scratch (scuffs, key marks, surface scratches)
- dent (depressions, panel dents, door dings)
- broken_light (cracked or broken headlamp, tail-lamp, fog lamp, indicators)
- bumper_damage (cracked bumper, dislodged bumper, bumper scratches)
- glass_damage (cracked windshield, broken side windows, mirror cracks)

For each damage detected:
1. Draw a bounding box around it. Provide the 2D bounding box as normalized coordinates [ymin, xmin, ymax, xmax] on a scale of 0 to 1000 (where 0 is top/left and 1000 is bottom/right).
2. Assign a confidence score between 0.0 and 1.0.
3. Classify the severity of the damage ('minor', 'moderate', 'severe').
4. Write a concise technical description explaining the exact location and scope of the damage.

Filter detections to include only classes in this list: [${classesToDetect.join(", ")}].
Only return detections with confidence >= ${confThresh}.`;

      const startTime = Date.now();
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, promptText],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              damage_count: {
                type: Type.INTEGER,
                description: "The total number of vehicle damages detected."
              },
              damages: {
                type: Type.ARRAY,
                description: "List of detected vehicle damages.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    class_name: {
                      type: Type.STRING,
                      description: "The category of vehicle damage.",
                    },
                    confidence: {
                      type: Type.NUMBER,
                      description: "Detection confidence score between 0.0 and 1.0."
                    },
                    severity: {
                      type: Type.STRING,
                      description: "Severity level of this particular damage: 'minor', 'moderate', or 'severe'."
                    },
                    description: {
                      type: Type.STRING,
                      description: "Short concise description of the detected damage, including exact panel location."
                    },
                    box_2d: {
                      type: Type.ARRAY,
                      description: "Normalized 2D box coordinates in format [ymin, xmin, ymax, xmax] integers from 0 to 1000.",
                      items: {
                        type: Type.INTEGER
                      }
                    }
                  },
                  required: ["class_name", "confidence", "severity", "description", "box_2d"]
                }
              }
            },
            required: ["damage_count", "damages"]
          }
        }
      });

      const endTime = Date.now();
      const inferenceTime = endTime - startTime;

      let resultText = response.text || "{}";
      // Sanitize response formatting in case markdown brackets are returned
      resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedResult = JSON.parse(resultText);

      res.json({
        damage_count: parsedResult.damage_count ?? (parsedResult.damages ? parsedResult.damages.length : 0),
        inference_time_ms: inferenceTime,
        damages: parsedResult.damages || [],
        is_mocked: false,
        apiKeyConfigured: true
      });

    } catch (error: any) {
      console.error("Vehicle damage detection error:", error);
      res.status(500).json({
        error: error.message || "Failed to analyze vehicle image.",
        details: error.stack
      });
    }
  });

  // Serve static assets and Vite integration
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
    console.log(`AI Vehicle Damage Detection server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
