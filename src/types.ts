/**
 * CivicMind AI - Application Type Definitions
 */

export enum IssueCategory {
  POTHOLE = "pothole",
  WATER_LEAK = "water_leak",
  GARBAGE = "garbage",
  STREETLIGHT = "streetlight",
  ROAD_DAMAGE = "road_damage",
  OTHER = "other"
}

export enum IssueStatus {
  REPORTED = "reported",
  VERIFIED = "verified",
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  ESCALATED = "escalated"
}

export enum IssueSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface VisualInspectorResult {
  detectedCategory: IssueCategory;
  estimatedSeverity: IssueSeverity;
  urgencyScore: number;
  description: string;
  confidenceScore: number;
}

export interface VerificationResult {
  isDuplicate: boolean;
  duplicateOfId: string | null;
  locationValid: boolean;
  authenticityCheck: string; // e.g. "Metadata confirms device match"
  communityTrustScore: number; // calculated from user levels & vote volume
  matchPercentage: number;
}

export interface ResolutionPlan {
  costEstimate: number;
  workforceEstimate: number;
  repairRecommendations: string[];
  materialsNeeded: string[];
}

export interface EscalationResult {
  escalated: boolean;
  escalatedTo: string; // e.g. "Department of Transportation"
  escalationTime: string | null;
  remindersSentCount: number;
  escalationReason: string;
}

export interface IssueReport {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: IssueSeverity;
  urgencyScore: number; // 0 - 100
  location: Location;
  imageUrl: string;
  reporterEmail: string;
  reporterName: string;
  createdAt: string;
  votes: string[]; // List of user emails who upvoted/verified
  duplicateOf: string | null; // ID of the duplicate issue
  
  // Agent evaluation details
  visualAnalysis?: VisualInspectorResult;
  verificationAgent?: VerificationResult;
  resolutionPlanner?: ResolutionPlan;
  escalationAgent?: EscalationResult;
  
  // Status updates
  verifiedAt?: string;
  scheduledAt?: string;
  resolvedAt?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  heroPoints: number;
  reportsSubmitted: number;
  verificationsDone: number;
  badges: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export interface PredictiveHotspot {
  id: string;
  category: IssueCategory;
  lat: number;
  lng: number;
  description: string;
  riskScore: number; // 0 - 100
  trend: "increasing" | "stable" | "decreasing";
  predictedResolutionCost: number;
  estimatedOccurrenceDate: string;
}

export interface ImpactStats {
  totalIssuesReported: number;
  totalIssuesResolved: number;
  communityHeroPoints: number;
  avgResolutionTimeDays: number;
  activeCitizens: number;
  categoryDistribution: Record<string, number>;
  monthlyTrends: { month: string; reported: number; resolved: number }[];
}
