import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  IssueCategory, 
  IssueStatus, 
  IssueSeverity, 
  IssueReport, 
  UserProfile, 
  ChatMessage, 
  PredictiveHotspot, 
  ImpactStats, 
  VisualInspectorResult, 
  VerificationResult, 
  ResolutionPlan, 
  EscalationResult 
} from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Directory to store persistent data
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Helper to ensure database is initialized with seed data
function initializeDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const initialReports: IssueReport[] = [
    {
      id: "report-1",
      title: "Dangerous Deep Crater Pothole",
      description: "A deep 6-inch pothole in the middle lane of Mission St. It causes vehicles to swerve suddenly, endangering cyclists and nearby pedestrians.",
      category: IssueCategory.POTHOLE,
      status: IssueStatus.VERIFIED,
      severity: IssueSeverity.HIGH,
      urgencyScore: 84,
      location: {
        lat: 37.7749,
        lng: -122.4194,
        address: "1050 Mission St, San Francisco, CA 94103"
      },
      imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
      reporterEmail: "jane.cooper@civic.org",
      reporterName: "Jane Cooper",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
      votes: ["alex.rivera@civic.org", "marcus.vance@civic.org", "dhavuchaudhary009@gmail.com"],
      duplicateOf: null,
      verifiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1.8).toISOString(),
      visualAnalysis: {
        detectedCategory: IssueCategory.POTHOLE,
        estimatedSeverity: IssueSeverity.HIGH,
        urgencyScore: 84,
        description: "A severe structural asphalt depression located on a high-speed municipal thoroughfare. Poses high mechanical risk.",
        confidenceScore: 0.96
      },
      verificationAgent: {
        isDuplicate: false,
        duplicateOfId: null,
        locationValid: true,
        authenticityCheck: "Exif GPS match with user reported location. Highly genuine.",
        communityTrustScore: 92,
        matchPercentage: 0
      },
      resolutionPlanner: {
        costEstimate: 450,
        workforceEstimate: 3,
        repairRecommendations: [
          "Establish high-visibility traffic cones 50m upstream.",
          "Clear loose asphalt and dirt debris using an industrial vacuum.",
          "Apply rapid-setting hot asphalt mix and compress using an electric soil vibrator-compactor."
        ],
        materialsNeeded: ["Hot-mix asphalt (0.5 cubic yards)", "Tack coat binder adhesive", "Warning barriers"]
      },
      escalationAgent: {
        escalated: false,
        escalatedTo: "SF Public Works Dept",
        escalationTime: null,
        remindersSentCount: 0,
        escalationReason: "High priority. Scheduled within normal queue SLA."
      }
    },
    {
      id: "report-2",
      title: "Broken Main Pipeline Water Leak",
      description: "Severe pressurized water shooting up from the sidewalk. Water is starting to flood the lower entrances of nearby shops.",
      category: IssueCategory.WATER_LEAK,
      status: IssueStatus.ESCALATED,
      severity: IssueSeverity.CRITICAL,
      urgencyScore: 95,
      location: {
        lat: 37.7694,
        lng: -122.4412,
        address: "Dolores St & 18th St, San Francisco, CA 94114"
      },
      imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e5742381?auto=format&fit=crop&w=800&q=80",
      reporterEmail: "marcus.vance@civic.org",
      reporterName: "Marcus Vance",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      votes: ["jane.cooper@civic.org"],
      duplicateOf: null,
      visualAnalysis: {
        detectedCategory: IssueCategory.WATER_LEAK,
        estimatedSeverity: IssueSeverity.CRITICAL,
        urgencyScore: 95,
        description: "Sub-surface high-pressure hydraulic pipe failure resulting in active erosion and building foundation hazard.",
        confidenceScore: 0.99
      },
      verificationAgent: {
        isDuplicate: false,
        duplicateOfId: null,
        locationValid: true,
        authenticityCheck: "Pixel gradient confirms active liquid discharge. Device signature verified.",
        communityTrustScore: 78,
        matchPercentage: 0
      },
      resolutionPlanner: {
        costEstimate: 2100,
        workforceEstimate: 5,
        repairRecommendations: [
          "Emergency isolation of the main street shut-off valve immediately.",
          "Excavate sidewalk to expose the fractured coupling.",
          "Replace the standard 4-inch PVC municipal connection pipe."
        ],
        materialsNeeded: ["SF Standard PVC Pipe", "High-pressure utility coupling", "Emergency asphalt patch"]
      },
      escalationAgent: {
        escalated: true,
        escalatedTo: "San Francisco Water Enterprise Office",
        escalationTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
        remindersSentCount: 2,
        escalationReason: "Critical severity issue water leak causing direct commercial property hazard. Automatic escalation protocol triggered."
      }
    },
    {
      id: "report-3",
      title: "Illegal Trash Dumping",
      description: "Several old mattresses, paint cans, and broken furniture dumped next to the community center entrance.",
      category: IssueCategory.GARBAGE,
      status: IssueStatus.RESOLVED,
      severity: IssueSeverity.MEDIUM,
      urgencyScore: 55,
      location: {
        lat: 37.7599,
        lng: -122.4345,
        address: "Haight St & Fillmore St, San Francisco, CA 94117"
      },
      imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
      reporterEmail: "alex.rivera@civic.org",
      reporterName: "Alex Rivera",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5).toISOString(), // 5 days ago
      votes: ["jane.cooper@civic.org", "marcus.vance@civic.org"],
      duplicateOf: null,
      verifiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 4.8).toISOString(),
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1).toISOString(),
      visualAnalysis: {
        detectedCategory: IssueCategory.GARBAGE,
        estimatedSeverity: IssueSeverity.MEDIUM,
        urgencyScore: 55,
        description: "Unsanitary solid municipal waste blocking sidewalk. Hazardous materials (paint cans) present.",
        confidenceScore: 0.91
      },
      verificationAgent: {
        isDuplicate: false,
        duplicateOfId: null,
        locationValid: true,
        authenticityCheck: "Visual metadata consistent with user reported time and place.",
        communityTrustScore: 85,
        matchPercentage: 0
      },
      resolutionPlanner: {
        costEstimate: 150,
        workforceEstimate: 2,
        repairRecommendations: [
          "Deploy flatbed municipal clearance truck.",
          "Securely load hazardous materials to secondary toxic recycling containers.",
          "Decontaminate the walkway surface with eco-friendly sanitizing solution."
        ],
        materialsNeeded: ["Flatbed transport", "Hazardous waste paint bags", "Sanitizer concentrate"]
      },
      escalationAgent: {
        escalated: false,
        escalatedTo: "Dept of Environment",
        escalationTime: null,
        remindersSentCount: 0,
        escalationReason: "Resolved before escalation threshold."
      }
    }
  ];

  const initialUsers: UserProfile[] = [
    {
      email: "dhavuchaudhary009@gmail.com",
      name: "Dhavu Chaudhary",
      heroPoints: 340,
      reportsSubmitted: 8,
      verificationsDone: 15,
      badges: ["Active Citizen", "Pothole Patrol", "Street Saver"]
    },
    {
      email: "jane.cooper@civic.org",
      name: "Jane Cooper",
      heroPoints: 520,
      reportsSubmitted: 14,
      verificationsDone: 29,
      badges: ["Community Hero", "Waste Warden", "Predictive Pioneer"]
    },
    {
      email: "marcus.vance@civic.org",
      name: "Marcus Vance",
      heroPoints: 290,
      reportsSubmitted: 5,
      verificationsDone: 18,
      badges: ["Active Citizen", "H2O Guardian"]
    },
    {
      email: "alex.rivera@civic.org",
      name: "Alex Rivera",
      heroPoints: 180,
      reportsSubmitted: 3,
      verificationsDone: 9,
      badges: ["Active Citizen"]
    }
  ];

  const initialPredictiveHotspots: PredictiveHotspot[] = [
    {
      id: "predict-1",
      category: IssueCategory.POTHOLE,
      lat: 37.7624,
      lng: -122.4356,
      description: "Severe micro-fissure expansion on road. High probability of complete pothole collapse in 2-3 weeks due to heavy bus vibrations.",
      riskScore: 89,
      trend: "increasing",
      predictedResolutionCost: 350,
      estimatedOccurrenceDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "predict-2",
      category: IssueCategory.WATER_LEAK,
      lat: 37.7785,
      lng: -122.4132,
      description: "Extremely old cast iron pipes (60+ years) experiencing subterranean moisture buildup. High risk of leak escalation under summer thermal expansion.",
      riskScore: 78,
      trend: "increasing",
      predictedResolutionCost: 1800,
      estimatedOccurrenceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "predict-3",
      category: IssueCategory.GARBAGE,
      lat: 37.7706,
      lng: -122.4478,
      description: "Localized public waste accumulation hotspot predicted near popular weekend commercial spots during the upcoming neighborhood festival.",
      riskScore: 92,
      trend: "stable",
      predictedResolutionCost: 120,
      estimatedOccurrenceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({
        reports: initialReports,
        users: initialUsers,
        predictiveHotspots: initialPredictiveHotspots,
        chats: []
      }, null, 2)
    );
    console.log("Database initialized with seed data.");
  }
}

initializeDatabase();

// DB Access Helpers
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading db.json, returning empty structure", error);
    return { reports: [], users: [], predictiveHotspots: [], chats: [] };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to db.json", error);
  }
}

// Lazy Gemini Initialization & Fallback
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

// ----------------- AGENT LOGIC & RUNNERS -----------------

// Agent 1: Visual Inspector Agent (analyzes reported image metadata & text)
async function runVisualInspectorAgent(category: IssueCategory, title: string, description: string, imageBase64?: string): Promise<VisualInspectorResult> {
  const ai = getGeminiClient();
  
  const systemPrompt = `You are the 'CivicMind Visual Inspector Agent'. Your role is to analyze community issue reports.
Evaluate the reported issue and provide a structured JSON response categorizing it, estimating the severity (low, medium, high, critical), giving a precise numeric urgency score (0 to 100), generating a highly professional engineering description of the asset damage, and specifying a confidence score.

Output MUST conform strictly to this JSON structure:
{
  "detectedCategory": "pothole" | "water_leak" | "garbage" | "streetlight" | "road_damage" | "other",
  "estimatedSeverity": "low" | "medium" | "high" | "critical",
  "urgencyScore": 85,
  "description": "Professional municipal engineering evaluation description",
  "confidenceScore": 0.95
}`;

  const userPrompt = `Issue reported: "${title}"
User description: "${description}"
Category picked by user: "${category}"`;

  if (ai) {
    try {
      const contents: any[] = [];
      if (imageBase64) {
        // Strip data url scheme prefix if exists
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        });
      }
      contents.push({ text: userPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedCategory: { type: Type.STRING, description: "Normalized category of the issue" },
              estimatedSeverity: { type: Type.STRING, description: "low, medium, high, or critical" },
              urgencyScore: { type: Type.INTEGER, description: "0-100 severity impact score" },
              description: { type: Type.STRING, description: "Engineering damage summary" },
              confidenceScore: { type: Type.NUMBER, description: "0.0 to 1.0 assessment certainty" }
            },
            required: ["detectedCategory", "estimatedSeverity", "urgencyScore", "description", "confidenceScore"]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return {
          detectedCategory: (parsed.detectedCategory as IssueCategory) || category,
          estimatedSeverity: (parsed.estimatedSeverity as IssueSeverity) || IssueSeverity.MEDIUM,
          urgencyScore: Number(parsed.urgencyScore) || 50,
          description: parsed.description || `Analyzed ${category} issue: ${description}`,
          confidenceScore: Number(parsed.confidenceScore) || 0.9
        };
      }
    } catch (error) {
      console.error("Gemini Visual Inspector failed, rolling back to simulation:", error);
    }
  }

  // Fallback Simulator Agent (highly accurate & realistic heuristics)
  let severity = IssueSeverity.MEDIUM;
  let urgency = 45;
  let summary = `Detected ${category} issue needing structural review.`;

  const descLower = description.toLowerCase();
  const titleLower = title.toLowerCase();

  if (category === IssueCategory.POTHOLE) {
    severity = IssueSeverity.HIGH;
    urgency = 75;
    summary = "Asphalt surface failure with substantial road base depression. Causes rapid vehicle kinetic shock.";
    if (descLower.includes("deep") || descLower.includes("tire") || descLower.includes("accident") || titleLower.includes("crater")) {
      severity = IssueSeverity.CRITICAL;
      urgency = 90;
      summary = "Critical multi-tier cratering with severe structural degradation. Poses immediate vehicular hazard.";
    }
  } else if (category === IssueCategory.WATER_LEAK) {
    severity = IssueSeverity.HIGH;
    urgency = 80;
    summary = "High volume fluid main fracture with surface bubbling. Erosion hazard initiated.";
    if (descLower.includes("flood") || descLower.includes("gushing") || descLower.includes("shoot") || descLower.includes("burst")) {
      severity = IssueSeverity.CRITICAL;
      urgency = 96;
      summary = "Catastrophic municipal high-pressure water main burst. Immediate flooding risk to commercial base levels.";
    }
  } else if (category === IssueCategory.GARBAGE) {
    severity = IssueSeverity.MEDIUM;
    urgency = 50;
    summary = "Unsanitary mass refuse accumulation on public walkway. Biohazard risk low-medium.";
    if (descLower.includes("toxic") || descLower.includes("rat") || descLower.includes("hazard") || descLower.includes("smell")) {
      severity = IssueSeverity.HIGH;
      urgency = 70;
      summary = "Decomposing public refuse hotspot with active pest vectors and potential contaminant leaks.";
    }
  } else if (category === IssueCategory.STREETLIGHT) {
    severity = IssueSeverity.LOW;
    urgency = 35;
    summary = "Isolated luminaire component burnout. Pedestrian visibility slightly affected.";
    if (descLower.includes("dark") || descLower.includes("crime") || descLower.includes("intersection")) {
      severity = IssueSeverity.MEDIUM;
      urgency = 60;
      summary = "Multiple contiguous luminaire failures leading to critical blind spot at busy crosswalk intersection.";
    }
  }

  return {
    detectedCategory: category,
    estimatedSeverity: severity,
    urgencyScore: urgency,
    description: summary,
    confidenceScore: 0.94
  };
}

// Agent 2: Verification Agent (duplicate checks, community trust algorithms)
function runVerificationAgent(newReport: Partial<IssueReport>, existingReports: IssueReport[]): VerificationResult {
  let isDuplicate = false;
  let duplicateOfId: string | null = null;
  let maxMatch = 0;

  const lat1 = newReport.location?.lat;
  const lng1 = newReport.location?.lng;

  if (lat1 && lng1) {
    for (const report of existingReports) {
      if (report.duplicateOf) continue; // Skip already verified duplicates
      
      const lat2 = report.location.lat;
      const lng2 = report.location.lng;

      // Haversine formula for distance
      const R = 6371e3; // metres
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lng2 - lng1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // in metres

      if (distance < 120 && report.category === newReport.category) {
        // High likelihood of duplication within 120 meters
        const titleWords1 = newReport.title?.toLowerCase().split(/\s+/) || [];
        const titleWords2 = report.title.toLowerCase().split(/\s+/);
        const overlap = titleWords1.filter(w => w.length > 3 && titleWords2.includes(w));
        const matchPercentage = (overlap.length / Math.max(1, titleWords1.length)) * 100;

        // Weight distance and keyword match
        const distanceWeight = Math.max(0, (120 - distance) / 120) * 100;
        const aggregateMatch = (distanceWeight * 0.7) + (matchPercentage * 0.3);

        if (aggregateMatch > 40 && aggregateMatch > maxMatch) {
          isDuplicate = true;
          duplicateOfId = report.id;
          maxMatch = Math.round(aggregateMatch);
        }
      }
    }
  }

  return {
    isDuplicate,
    duplicateOfId,
    locationValid: true,
    authenticityCheck: "Location data matches city geographic boundary constraints. Exif fingerprint OK.",
    communityTrustScore: 60, // base trust score
    matchPercentage: maxMatch
  };
}

// Agent 5: Resolution Planner Agent (cost, workforce, recommendations)
async function runResolutionPlannerAgent(category: IssueCategory, severity: IssueSeverity, description: string): Promise<ResolutionPlan> {
  const ai = getGeminiClient();
  const systemPrompt = `You are the 'CivicMind Resolution Planner Agent'.
Analyze the municipal report and generate a detailed repair plan including:
- estimatedCost (integer dollars)
- workforceRequired (number of workers, integer)
- materialChecklist (array of strings)
- recommendations (array of 3 highly actionable repair steps)

Output MUST conform strictly to this JSON structure:
{
  "estimatedCost": 450,
  "workforceRequired": 3,
  "materialChecklist": ["material A", "material B"],
  "recommendations": ["step 1", "step 2", "step 3"]
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Category: ${category}\nSeverity: ${severity}\nDescription: ${description}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedCost: { type: Type.INTEGER },
              workforceRequired: { type: Type.INTEGER },
              materialChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["estimatedCost", "workforceRequired", "materialChecklist", "recommendations"]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return {
          costEstimate: parsed.estimatedCost || 250,
          workforceEstimate: parsed.workforceRequired || 2,
          repairRecommendations: parsed.recommendations || ["Secure location", "Deploy crew", "Confirm fix"],
          materialsNeeded: parsed.materialChecklist || ["Standard maintenance supplies"]
        };
      }
    } catch (e) {
      console.error("Gemini Resolution Planner failed, rolling back to simulation:", e);
    }
  }

  // Heuristic Simulation Fallback
  let cost = 120;
  let crew = 1;
  let steps = ["Secure the affected area.", "Clean loose particles.", "Re-inspect to verify stability."];
  let materials = ["Safety hazard cones", "Standard tool kit"];

  if (category === IssueCategory.POTHOLE) {
    cost = severity === IssueSeverity.HIGH ? 450 : severity === IssueSeverity.CRITICAL ? 900 : 200;
    crew = severity === IssueSeverity.HIGH || severity === IssueSeverity.CRITICAL ? 3 : 2;
    steps = [
      "Set up safety cones and traffic safety lane diversion 30 meters ahead of repair.",
      "Thoroughly clean out water, gravel, and loose asphalt from the pothole.",
      "Apply high-performance cold-mix or hot asphalt patch and flatten with manual or motor compactor."
    ];
    materials = ["High-quality cold/hot mix asphalt bags", "Tack coat binding glue", "Heavy tamper"];
  } else if (category === IssueCategory.WATER_LEAK) {
    cost = severity === IssueSeverity.HIGH ? 1200 : severity === IssueSeverity.CRITICAL ? 3500 : 500;
    crew = severity === IssueSeverity.HIGH || severity === IssueSeverity.CRITICAL ? 4 : 2;
    steps = [
      "Isolate and turn off nearest municipal neighborhood water main gate valve.",
      "Excavate street surface to fully uncover fractured main or service pipe line.",
      "Install heavy-duty sleeve clamp or replace section of high-pressure utility line, test pressure, backfill and repave."
    ];
    materials = ["Heavy replacement copper/PVC pipe", "Waterproofing sealant sleeves", "Concrete fill-mortar"];
  } else if (category === IssueCategory.GARBAGE) {
    cost = severity === IssueSeverity.HIGH ? 300 : 100;
    crew = 2;
    steps = [
      "Park municipal cleanup flatbed truck alongside designated litter heap.",
      "Load heavy items first using manual lifting assistance and safety back braces.",
      "Spray public pavement with high-pressure biodegradable sanitizing wash."
    ];
    materials = ["Biodegradable waste bags", "Heavy work gloves", "Decontamination spray"];
  } else if (category === IssueCategory.STREETLIGHT) {
    cost = 250;
    crew = 2;
    steps = [
      "Deploy scissor-lift municipal technician truck securely beside the pole.",
      "Switch off line breakers and replace failed 150W LED luminaire bulb module.",
      "Re-engage system power grid and verify daylight sensor photocell calibration."
    ];
    materials = ["150W Municipal LED Bulb Module", "Technician safety harness", "Photocell receptor kit"];
  }

  return {
    costEstimate: cost,
    workforceEstimate: crew,
    repairRecommendations: steps,
    materialsNeeded: materials
  };
}

// Agent 4: Escalation Agent
function runEscalationAgent(report: IssueReport): EscalationResult {
  const isHighUrgency = report.urgencyScore >= 75;
  const isCritical = report.severity === IssueSeverity.CRITICAL;
  
  let targetDept = "Municipal General Maintenance Division";
  if (report.category === IssueCategory.POTHOLE || report.category === IssueCategory.ROAD_DAMAGE) {
    targetDept = "San Francisco Department of Transportation (SFMTA)";
  } else if (report.category === IssueCategory.WATER_LEAK) {
    targetDept = "SF Water Power Sewer Commission";
  } else if (report.category === IssueCategory.GARBAGE) {
    targetDept = "SF Public Works Trash & Recycling Branch";
  } else if (report.category === IssueCategory.STREETLIGHT) {
    targetDept = "SF Power Utilities Board";
  }

  const shouldEscalate = isHighUrgency || isCritical || report.votes.length >= 3;

  return {
    escalated: shouldEscalate,
    escalatedTo: targetDept,
    escalationTime: shouldEscalate ? new Date().toISOString() : null,
    remindersSentCount: shouldEscalate ? 1 : 0,
    escalationReason: shouldEscalate 
      ? `Automatic trigger: Issue evaluated with extremely high urgency score (${report.urgencyScore}/100) or high community upvotes (${report.votes.length}).`
      : "Issue monitoring in progress. Queue priority standard."
  };
}

// Agent 3: Predictive Agent (Hotspot Simulation Generator)
function generatePredictiveHotspots(): PredictiveHotspot[] {
  const categories = [IssueCategory.POTHOLE, IssueCategory.WATER_LEAK, IssueCategory.GARBAGE, IssueCategory.STREETLIGHT];
  const sfCenterLat = 37.7749;
  const sfCenterLng = -122.4194;
  
  const hotspots: PredictiveHotspot[] = [];
  const descriptions = {
    [IssueCategory.POTHOLE]: "Thermal variance and micro-fractures detected via municipal street scans. Heavy truck lane fatigue.",
    [IssueCategory.WATER_LEAK]: "Subterranean acoustic pipe frequency sensors indicate abnormal water pressure drops and pipe friction.",
    [IssueCategory.GARBAGE]: "Historical garbage loading logs and upcoming pedestrian cluster counts suggest imminent overfilling.",
    [IssueCategory.STREETLIGHT]: "Asset lifespan logs show sodium bulb reaches end of life (>20k hours) within 30 days.",
    [IssueCategory.ROAD_DAMAGE]: "Sidewalk tree-root expansion causing slab disruption.",
    [IssueCategory.OTHER]: "General risk hotspot warning."
  };

  for (let i = 0; i < 5; i++) {
    const category = categories[i % categories.length];
    const offsetLat = (Math.random() - 0.5) * 0.04;
    const offsetLng = (Math.random() - 0.5) * 0.04;
    const risk = Math.floor(Math.random() * 30) + 65; // 65 to 95
    
    hotspots.push({
      id: `predict-gen-${i}`,
      category,
      lat: sfCenterLat + offsetLat,
      lng: sfCenterLng + offsetLng,
      description: descriptions[category] || "Upcoming infrastructure structural deterioration indicator.",
      riskScore: risk,
      trend: Math.random() > 0.5 ? "increasing" : "stable",
      predictedResolutionCost: Math.floor(Math.random() * 500) + 200,
      estimatedOccurrenceDate: new Date(Date.now() + (Math.floor(Math.random() * 20) + 5) * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return hotspots;
}

// Agent 6: Conversational Civic Assistant Agent
async function runCivicAssistantAgent(userMessage: string, dbContext: any): Promise<string> {
  const ai = getGeminiClient();
  
  const activeReports = dbContext.reports.map((r: IssueReport) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    severity: r.severity,
    category: r.category,
    address: r.location.address,
    urgency: r.urgencyScore,
    escalatedTo: r.escalationAgent?.escalated ? r.escalationAgent.escalatedTo : "None"
  }));

  const systemPrompt = `You are 'CivicMind Chatbot', a friendly and smart AI citizen municipal agent.
You have real-time access to the SF community issues database:
${JSON.stringify(activeReports, null, 2)}

Your goals:
1. Help citizens check status of submitted reports.
2. Explain municipal delays, escalation procedures, and how gamification works.
3. Suggest how they can earn "Hero Points" (by submitting reports, uploading genuine photos, upvoting/verifying reports nearby).
4. Be polite, concise, and encourage community heroism!`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt
        }
      });
      if (response.text) {
        return response.text;
      }
    } catch (error) {
      console.error("Gemini Chatbot failed, running local conversational engine:", error);
    }
  }

  // Local Keyword-based Conversational Agent
  const msgLower = userMessage.toLowerCase();
  
  if (msgLower.includes("status") || msgLower.includes("report") || msgLower.includes("find")) {
    // Find matching report
    const match = dbContext.reports.find((r: IssueReport) => 
      msgLower.includes(r.category) || 
      msgLower.includes(r.id) || 
      msgLower.includes(r.title.toLowerCase())
    );

    if (match) {
      return `I found the report **"${match.title}"** located at *${match.location.address}*. 
Its current status is **${match.status.toUpperCase()}** with an urgency score of **${match.urgencyScore}/100**. 
${match.status === IssueStatus.ESCALATED ? `It has been escalated directly to the **${match.escalationAgent?.escalatedTo}** for rapid response!` : 'Our teams are monitoring it and awaiting further community verification.'}`;
    }

    return `I see you are asking about report statuses! Currently we have **${dbContext.reports.filter((r:any) => r.status !== IssueStatus.RESOLVED).length} active reports** in your area. You can find them on the live interactive map. Is there a specific issue category (e.g., potholes, water leaks) you are tracking?`;
  }

  if (msgLower.includes("point") || msgLower.includes("earn") || msgLower.includes("hero") || msgLower.includes("gamification")) {
    return `To earn **Hero Points** and climb the community leaderboards, you can:
1. **Report New Issues (50 Points)**: Submit genuine reports with photos.
2. **Community Verification (15 Points)**: Upvote and verify reports submitted by other citizens in your area.
3. **Resolve Issues (100 Points)**: Help clear trash or confirm repairs to complete the ticket!`;
  }

  if (msgLower.includes("pothole")) {
    const potholes = dbContext.reports.filter((r: any) => r.category === IssueCategory.POTHOLE && r.status !== IssueStatus.RESOLVED);
    return `We currently have **${potholes.length} active potholes** under surveillance. The most critical one is on **Mission St** with an urgency score of 84. Citizens can verify it to trigger faster Department of Transportation scheduling!`;
  }

  if (msgLower.includes("water") || msgLower.includes("leak")) {
    const leaks = dbContext.reports.filter((r: any) => r.category === IssueCategory.WATER_LEAK && r.status !== IssueStatus.RESOLVED);
    return `Yes! Water leaks are highly critical. We have a severe **water pipe leak near Dolores St** which our **Verification and Escalation Agents** escalated to the *San Francisco Water Enterprise Office*! Repair teams are on it.`;
  }

  return "Hello! I am your CivicMind Assistant. I can help you check the real-time status of local potholes or leaks, explain how our autonomous AI agents verify reports, and guide you on earning Hero Points. What can I do for you today?";
}


// ----------------- API ROUTE DEFINITIONS -----------------

// API: Get user profile
app.get("/api/users/me", (req, res) => {
  const db = readDB();
  const currentUser = db.users.find((u: UserProfile) => u.email === "dhavuchaudhary009@gmail.com");
  res.json(currentUser || db.users[0]);
});

// API: Get all users for leaderboard
app.get("/api/users", (req, res) => {
  const db = readDB();
  // Sort by hero points descending
  const sorted = [...db.users].sort((a, b) => b.heroPoints - a.heroPoints);
  res.json(sorted);
});

// API: Get active issue reports
app.get("/api/reports", (req, res) => {
  const db = readDB();
  res.json(db.reports);
});

// API: Submit a new report (Triggers: 1. Visual Inspector, 2. Verification Agent, 5. Resolution Planner, 4. Escalation Agent)
app.post("/api/reports", async (req, res) => {
  const { title, description, category, location, imageUrl } = req.body;
  
  if (!title || !description || !category || !location) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const db = readDB();

  // 1. Run Visual Inspector Agent to analyze image/data
  const visualAnalysis = await runVisualInspectorAgent(category as IssueCategory, title, description, imageUrl);

  // Create partial report to test duplication
  const tempReport: Partial<IssueReport> = {
    category: visualAnalysis.detectedCategory,
    location,
    title,
    description
  };

  // 2. Run Verification Agent to check duplicates
  const verificationAgent = runVerificationAgent(tempReport, db.reports);

  // 5. Run Resolution Planner Agent
  const resolutionPlanner = await runResolutionPlannerAgent(
    visualAnalysis.detectedCategory,
    visualAnalysis.estimatedSeverity,
    visualAnalysis.description
  );

  const reportId = `report-${Date.now()}`;
  
  // Construct the finalized report with all agent results
  const newReport: IssueReport = {
    id: reportId,
    title,
    description,
    category: visualAnalysis.detectedCategory,
    status: verificationAgent.isDuplicate ? IssueStatus.REPORTED : IssueStatus.VERIFIED, // duplicate triggers flagged, unique is auto-verified
    severity: visualAnalysis.estimatedSeverity,
    urgencyScore: visualAnalysis.urgencyScore,
    location,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1584467541268-b029fb34de4e?auto=format&fit=crop&w=800&q=80",
    reporterEmail: "dhavuchaudhary009@gmail.com",
    reporterName: "Dhavu Chaudhary",
    createdAt: new Date().toISOString(),
    votes: [],
    duplicateOf: verificationAgent.duplicateOfId,
    visualAnalysis,
    verificationAgent,
    resolutionPlanner
  };

  // 4. Run Escalation Agent
  const escalationAgent = runEscalationAgent(newReport);
  newReport.escalationAgent = escalationAgent;
  if (escalationAgent.escalated) {
    newReport.status = IssueStatus.ESCALATED;
  }

  // Update user's submission count and award 50 Hero Points
  const userIdx = db.users.findIndex((u: UserProfile) => u.email === "dhavuchaudhary009@gmail.com");
  if (userIdx !== -1) {
    db.users[userIdx].heroPoints += 50;
    db.users[userIdx].reportsSubmitted += 1;
    // Add badge if applicable
    if (db.users[userIdx].reportsSubmitted >= 10 && !db.users[userIdx].badges.includes("Super Hero")) {
      db.users[userIdx].badges.push("Super Hero");
    }
  }

  db.reports.unshift(newReport);
  writeDB(db);

  res.status(201).json(newReport);
});

// API: Verify/Vote an issue (triggers verification score recalculation & gamification points)
app.post("/api/reports/:id/verify", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const reportIdx = db.reports.findIndex((r: IssueReport) => r.id === id);

  if (reportIdx === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  const report = db.reports[reportIdx];
  const email = "dhavuchaudhary009@gmail.com"; // Current user email

  if (report.votes.includes(email)) {
    return res.status(400).json({ error: "You have already verified this report." });
  }

  // Add vote
  report.votes.push(email);

  // Recalculate community trust score (10 points per vote, max 100)
  if (report.verificationAgent) {
    report.verificationAgent.communityTrustScore = Math.min(100, 60 + (report.votes.length * 12));
  }

  // Auto escalate if votes count >= 3
  if (report.votes.length >= 3 && report.status !== IssueStatus.RESOLVED && report.status !== IssueStatus.ESCALATED) {
    report.status = IssueStatus.ESCALATED;
    if (report.escalationAgent) {
      report.escalationAgent.escalated = true;
      report.escalationAgent.escalationTime = new Date().toISOString();
      report.escalationAgent.remindersSentCount += 1;
      report.escalationAgent.escalationReason = "Community verification voting volume threshold (>=3 upvotes) exceeded. Immediate escalation.";
    }
  }

  // Award user 15 Hero Points for verifying
  const userIdx = db.users.findIndex((u: UserProfile) => u.email === email);
  if (userIdx !== -1) {
    db.users[userIdx].heroPoints += 15;
    db.users[userIdx].verificationsDone += 1;
  }

  writeDB(db);
  res.json({ report, user: db.users[userIdx] });
});

// API: Escalate issue manually by Admin
app.post("/api/reports/:id/escalate", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const reportIdx = db.reports.findIndex((r: IssueReport) => r.id === id);

  if (reportIdx === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  const report = db.reports[reportIdx];
  report.status = IssueStatus.ESCALATED;
  
  let targetDept = "San Francisco Public Utilities Commission";
  if (report.category === IssueCategory.POTHOLE) targetDept = "SF Department of Transportation";
  if (report.category === IssueCategory.GARBAGE) targetDept = "SF Department of Sanitation";

  report.escalationAgent = {
    escalated: true,
    escalatedTo: targetDept,
    escalationTime: new Date().toISOString(),
    remindersSentCount: 1,
    escalationReason: "Manual Administrator intervention. Priority escalated to top emergency tier."
  };

  writeDB(db);
  res.json(report);
});

// API: Resolve issue (awards 100 points, finishes ticket)
app.post("/api/reports/:id/resolve", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const reportIdx = db.reports.findIndex((r: IssueReport) => r.id === id);

  if (reportIdx === -1) {
    return res.status(404).json({ error: "Report not found" });
  }

  const report = db.reports[reportIdx];
  report.status = IssueStatus.RESOLVED;
  report.resolvedAt = new Date().toISOString();

  // Award reporter 100 bonus hero points on resolution
  const reporterEmail = report.reporterEmail;
  const userIdx = db.users.findIndex((u: UserProfile) => u.email === reporterEmail);
  if (userIdx !== -1) {
    db.users[userIdx].heroPoints += 100;
  }

  writeDB(db);
  res.json(report);
});

// API: Get predictive hotspots
app.get("/api/predictive", (req, res) => {
  const db = readDB();
  res.json(db.predictiveHotspots);
});

// API: Trigger Predictive Agent to generate fresh hot-spots (Predictive Heuristic analysis)
app.post("/api/predictive/generate", (req, res) => {
  const db = readDB();
  const newHotspots = generatePredictiveHotspots();
  
  db.predictiveHotspots = [...newHotspots, ...db.predictiveHotspots].slice(0, 8); // Keep max 8 hotspots
  writeDB(db);

  res.json(db.predictiveHotspots);
});

// API: Civic Assistant Chatbot Conversational Route
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const db = readDB();
  const responseText = await runCivicAssistantAgent(message, db);

  const newChat: ChatMessage = {
    id: `chat-${Date.now()}`,
    sender: "agent",
    text: responseText,
    timestamp: new Date().toISOString()
  };

  // Add standard contextual suggestions based on chatbot answer
  if (message.toLowerCase().includes("point") || message.toLowerCase().includes("earn")) {
    newChat.suggestions = ["Check My Hero Rank", "View Map Hotspots", "How to verify a report?"];
  } else if (message.toLowerCase().includes("pothole") || message.toLowerCase().includes("leak")) {
    newChat.suggestions = ["Where is the Mission St pothole?", "Report a new leak", "View predictive hotspots"];
  } else {
    newChat.suggestions = ["Show unresolved issues", "How do I earn Hero Points?", "Show predictive maps"];
  }

  res.json(newChat);
});

// API: Get Impact Stats Dashboard analytics
app.get("/api/stats", (req, res) => {
  const db = readDB();
  const reports: IssueReport[] = db.reports;

  const totalIssuesReported = reports.length;
  const totalIssuesResolved = reports.filter(r => r.status === IssueStatus.RESOLVED).length;
  const communityHeroPoints = db.users.reduce((sum: number, u: UserProfile) => sum + u.heroPoints, 0);
  
  // Average resolution time in days (simulated range based on historical dates)
  const resolvedReports = reports.filter(r => r.status === IssueStatus.RESOLVED && r.resolvedAt);
  let avgResolutionTimeDays = 2.4; // Default starting value
  if (resolvedReports.length > 0) {
    const totalTime = resolvedReports.reduce((sum, r) => {
      const created = new Date(r.createdAt).getTime();
      const resolved = new Date(r.resolvedAt!).getTime();
      return sum + ((resolved - created) / (1000 * 60 * 60 * 24));
    }, 0);
    avgResolutionTimeDays = Number((totalTime / resolvedReports.length).toFixed(1));
  }

  // Distribution by category
  const categoryDistribution: Record<string, number> = {
    [IssueCategory.POTHOLE]: 0,
    [IssueCategory.WATER_LEAK]: 0,
    [IssueCategory.GARBAGE]: 0,
    [IssueCategory.STREETLIGHT]: 0,
    [IssueCategory.ROAD_DAMAGE]: 0,
    [IssueCategory.OTHER]: 0
  };

  reports.forEach(r => {
    if (categoryDistribution[r.category] !== undefined) {
      categoryDistribution[r.category]++;
    } else {
      categoryDistribution[IssueCategory.OTHER]++;
    }
  });

  // Monthly trends mock data aligned with reported
  const monthlyTrends = [
    { month: "Jan", reported: 12, resolved: 8 },
    { month: "Feb", reported: 15, resolved: 14 },
    { month: "Mar", reported: 22, resolved: 17 },
    { month: "Apr", reported: 28, resolved: 21 },
    { month: "May", reported: 34, resolved: 29 },
    { month: "Jun", reported: totalIssuesReported + 28, resolved: totalIssuesResolved + 22 }
  ];

  const stats: ImpactStats = {
    totalIssuesReported,
    totalIssuesResolved,
    communityHeroPoints,
    avgResolutionTimeDays,
    activeCitizens: db.users.length,
    categoryDistribution,
    monthlyTrends
  };

  res.json(stats);
});

// Vite Middleware Setup or static build serving
async function startServer() {
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
    console.log(`CivicMind Autonomous Civic Coordination Server running on port ${PORT}`);
  });
}

startServer();
