import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Sparkles,
  AlertTriangle,
  FileText,
  Send,
  User,
  Award,
  TrendingUp,
  Plus,
  Check,
  Database,
  ShieldAlert,
  Wrench,
  Map,
  Cpu,
  Layers,
  Flame,
  RefreshCw,
  FileUp,
  ChevronRight,
  Info,
  Clock,
  Briefcase,
  AlertCircle,
  X,
  Volume2
} from "lucide-react";
import {
  IssueCategory,
  IssueStatus,
  IssueSeverity,
  IssueReport,
  UserProfile,
  ChatMessage,
  PredictiveHotspot,
  ImpactStats
} from "./types";

// Premade high-quality image templates for instant hackathon testing
const TEST_IMAGE_TEMPLATES = [
  {
    name: "Mission St Crater Pothole",
    category: IssueCategory.POTHOLE,
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
    description: "Deep, jagged asphalt crater collapsing near the major crosswalk. Cars swerving dangerously."
  },
  {
    name: "Dolores Main Pipe Gush",
    category: IssueCategory.WATER_LEAK,
    url: "https://images.unsplash.com/photo-1542013936693-8848e5742381?auto=format&fit=crop&w=800&q=80",
    description: "High-pressure municipal pipeline failure. Sidewalk pavement eroding fast with active water flooding."
  },
  {
    name: "Illegal Appliance Dump",
    category: IssueCategory.GARBAGE,
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    description: "Multiple refrigerators, furniture piles, and cardboard blocking the sidewalk ramp."
  },
  {
    name: "Dim Neighborhood Streetlight",
    category: IssueCategory.STREETLIGHT,
    url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80",
    description: "Completely dark intersection headlight. Frequent high-speed vehicle close-calls."
  }
];

export default function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"map" | "predictive" | "stats" | "leaderboard" | "pitch">("map");
  
  // App State
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [predictiveHotspots, setPredictiveHotspots] = useState<PredictiveHotspot[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<ImpactStats | null>(null);
  
  // Interactive Map State
  const [selectedReport, setSelectedReport] = useState<IssueReport | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<PredictiveHotspot | null>(null);
  const [mapMode, setMapMode] = useState<"reports" | "predictive" | "heatmap">("reports");
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Create Issue Form State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<IssueCategory>(IssueCategory.POTHOLE);
  const [newAddress, setNewAddress] = useState("101 Post St, San Francisco, CA 94108");
  const [newImage, setNewImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "agent",
      text: "Hello! I am your **CivicMind Assistant**. I manage our network of visual inspectors, verifiers, and resolution planning agents. How can I help you today?",
      timestamp: new Date().toISOString(),
      suggestions: ["Check Mission St Pothole", "How do I earn Hero Points?", "Show predictive maps"]
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // API trigger updates helper
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [reportsRes, predictRes, statsRes, userRes, leaderboardRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/predictive"),
          fetch("/api/stats"),
          fetch("/api/users/me"),
          fetch("/api/users")
        ]);

        if (reportsRes.ok) setReports(await reportsRes.json());
        if (predictRes.ok) setPredictiveHotspots(await predictRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (userRes.ok) setCurrentUser(await userRes.json());
        if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    loadData();
  }, [refreshTrigger]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatTyping]);

  // Handle report submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newCategory) return;

    setIsSubmitting(true);
    const lat = clickedCoords ? clickedCoords.lat : 37.7749 + (Math.random() - 0.5) * 0.03;
    const lng = clickedCoords ? clickedCoords.lng : -122.4194 + (Math.random() - 0.5) * 0.03;

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          imageUrl: newImage,
          location: {
            lat,
            lng,
            address: newAddress
          }
        })
      });

      if (res.ok) {
        const freshReport = await res.json();
        setReports(prev => [freshReport, ...prev]);
        setSelectedReport(freshReport);
        setRefreshTrigger(p => p + 1);
        setShowSubmitModal(false);
        // Reset form
        setNewTitle("");
        setNewDescription("");
        setNewCategory(IssueCategory.POTHOLE);
        setNewImage("");
        setClickedCoords(null);

        // Add automated chat alert
        setChatMessages(prev => [
          ...prev,
          {
            id: `submit-alert-${Date.now()}`,
            sender: "agent",
            text: `🚨 **New community report lodged**: "${freshReport.title}". The **Visual Inspector Agent** analyzed the image and estimated severity as **${freshReport.severity.toUpperCase()}** (urgency score of **${freshReport.urgencyScore}/100**). Plan generated for ${freshReport.resolutionPlanner?.workforceEstimate} workers.`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to submit report:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote/Verify report
  const handleVerifyReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, { method: "POST" });
      if (res.ok) {
        const { report } = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? report : r));
        if (selectedReport?.id === reportId) {
          setSelectedReport(report);
        }
        setRefreshTrigger(p => p + 1);
      }
    } catch (err) {
      console.error("Verification error:", err);
    }
  };

  // Admin Escalate
  const handleAdminEscalate = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/escalate`, { method: "POST" });
      if (res.ok) {
        const updatedReport = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));
        if (selectedReport?.id === reportId) {
          setSelectedReport(updatedReport);
        }
        setRefreshTrigger(p => p + 1);
      }
    } catch (err) {
      console.error("Admin escalation failed:", err);
    }
  };

  // Admin Resolve
  const handleAdminResolve = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/resolve`, { method: "POST" });
      if (res.ok) {
        const updatedReport = await res.json();
        setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));
        if (selectedReport?.id === reportId) {
          setSelectedReport(updatedReport);
        }
        setRefreshTrigger(p => p + 1);
      }
    } catch (err) {
      console.error("Admin resolution failed:", err);
    }
  };

  // Trigger Predictive Agent Hotspot Re-Generation
  const handleGeneratePredictive = async () => {
    try {
      const res = await fetch("/api/predictive/generate", { method: "POST" });
      if (res.ok) {
        setPredictiveHotspots(await res.json());
        setRefreshTrigger(p => p + 1);
      }
    } catch (err) {
      console.error("Predictive generation failed:", err);
    }
  };

  // Send message to Civic Chatbot
  const handleSendChat = async (textToSend?: string) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: msg,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });

      if (res.ok) {
        const agentResponse = await res.json();
        setChatMessages(prev => [...prev, agentResponse]);
      }
    } catch (err) {
      console.error("Chat backend failure:", err);
    } finally {
      setIsChatTyping(false);
    }
  };

  // Convert uploaded file to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtering reports
  const filteredReports = reports.filter(r => {
    if (categoryFilter === "all") return true;
    return r.category === categoryFilter;
  });

  return (
    <div id="civic-mind-root" className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col selection:bg-teal-500 selection:text-slate-950">
      
      {/* HEADER SECTION */}
      <header id="app-header" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl shadow-lg shadow-teal-500/20">
            <Cpu className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                CivicMind AI
              </h1>
              <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold">
                Autonomous Community Hero
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI-Powered Multi-Agent Civic Coordination & Escalation</p>
          </div>
        </div>

        {/* HERO STATUS STATS */}
        <div className="flex items-center space-x-4">
          {currentUser && (
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-1.5 flex items-center space-x-3 text-xs shadow-inner">
              <div className="flex items-center space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{currentUser.name}</p>
                  <div className="flex items-center space-x-1">
                    {currentUser.badges.slice(0, 2).map(b => (
                      <span key={b} className="text-[9px] bg-slate-700 text-teal-400 px-1 rounded">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hero Points</p>
                <div className="flex items-center justify-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span className="font-extrabold text-amber-300 font-mono text-sm">{currentUser.heroPoints}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* CORE NAVIGATION */}
      <div id="core-nav" className="bg-slate-950/80 border-b border-slate-800 px-6 py-2 flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === "map"
                ? "bg-slate-800 text-teal-400 border border-slate-700/50 shadow-md font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Interactive Map & Live Reports</span>
          </button>
          <button
            onClick={() => setActiveTab("predictive")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === "predictive"
                ? "bg-slate-800 text-teal-400 border border-slate-700/50 shadow-md font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>AI Predictive Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === "stats"
                ? "bg-slate-800 text-teal-400 border border-slate-700/50 shadow-md font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Impact Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === "leaderboard"
                ? "bg-slate-800 text-teal-400 border border-slate-700/50 shadow-md font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Leaderboard & Badges</span>
          </button>
          <button
            onClick={() => setActiveTab("pitch")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === "pitch"
                ? "bg-slate-800 text-emerald-400 border border-slate-700/50 shadow-md font-semibold animate-pulse"
                : "text-emerald-400/80 hover:text-emerald-300 hover:bg-slate-900/60"
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span>Pitch Deck & Architecture</span>
          </button>
        </div>

        {/* Global Stats bar */}
        {stats && (
          <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-400">
            <div>
              Active Incidents: <span className="text-amber-400 font-mono font-bold">{reports.filter(r=>r.status!==IssueStatus.RESOLVED).length}</span>
            </div>
            <div>
              Total Resolved: <span className="text-emerald-400 font-mono font-bold">{stats.totalIssuesResolved}</span>
            </div>
            <div>
              Verification Rate: <span className="text-teal-400 font-mono font-bold">94%</span>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTAINER */}
      <main id="main-content" className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* LEFT/PRIMARY COLUMN (8 COLS ON LARGE SCREEN) */}
        <section className="lg:col-span-8 flex flex-col space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-2">
          
          {/* TAB 1: INTERACTIVE MAP & REPORT SUBMISSION */}
          {activeTab === "map" && (
            <div className="space-y-6">
              
              {/* INTERACTIVE MAP CONTAINER */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Map className="w-5 h-5 text-teal-400" />
                    <h2 className="font-bold text-slate-200">Interactive Community Vector Map (SF District)</h2>
                  </div>
                  
                  {/* Map Layer Controls */}
                  <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg text-xs">
                    <button
                      onClick={() => { setMapMode("reports"); setSelectedHotspot(null); }}
                      className={`px-3 py-1.5 rounded-md transition-all ${mapMode === "reports" ? "bg-slate-800 text-teal-400 font-semibold" : "text-slate-400"}`}
                    >
                      Active Issues ({filteredReports.length})
                    </button>
                    <button
                      onClick={() => { setMapMode("predictive"); setSelectedReport(null); }}
                      className={`px-3 py-1.5 rounded-md transition-all ${mapMode === "predictive" ? "bg-slate-800 text-teal-400 font-semibold" : "text-slate-400"}`}
                    >
                      AI Predictive Risk Zones
                    </button>
                    <button
                      onClick={() => { setMapMode("heatmap"); }}
                      className={`px-3 py-1.5 rounded-md transition-all ${mapMode === "heatmap" ? "bg-slate-800 text-teal-400 font-semibold" : "text-slate-400"}`}
                    >
                      AI Heatmap
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3">
                  💡 *Click anywhere on the map to pin coords and draft a new Civic issue report instantly! Drag/Hover pin points for details.*
                </p>

                {/* VISUAL MAP CANVAS */}
                <div 
                  className="relative w-full h-[400px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-crosshair"
                  onClick={(e) => {
                    // Approximate lat/lng from click on SF SVG bounding box
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;
                    
                    // SF bounds mapping approx: Lat 37.74 to 37.80, Lng -122.46 to -122.40
                    const lat = 37.80 - (y * 0.06);
                    const lng = -122.46 + (x * 0.06);
                    
                    setClickedCoords({ lat, lng });
                    setNewAddress(`District Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                    setShowSubmitModal(true);
                  }}
                >
                  {/* Grid Lines background */}
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                  
                  {/* Visual Roads Overlay (Simulated District Grid) */}
                  <svg className="absolute inset-0 w-full h-full text-slate-800/40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    {/* Diagonal Roads */}
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
                    <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
                    {/* Horizontal Lanes */}
                    <line x1="0" y1="20%" x2="100%" y2="20%" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="3" />
                    <line x1="0" y1="80%" x2="100%" y2="80%" stroke="currentColor" strokeWidth="1.5" />
                    {/* Vertical Lanes */}
                    <line x1="25%" y1="0" x2="25%" y2="100%" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="3" />
                    <line x1="75%" y1="0" x2="75%" y2="100%" stroke="currentColor" strokeWidth="1.5" />

                    {/* SF Dolores / Mission Districts Water Bay line simulation */}
                    <path d="M 0,50 Q 150,80 300,40 T 600,60" fill="none" stroke="#0e7490" strokeWidth="4" opacity="0.15" />
                  </svg>

                  {/* HEATMAP LAYER */}
                  {mapMode === "heatmap" && (
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-cyan-950/20 via-rose-950/40 to-teal-900/20 animate-pulse duration-5000">
                      {/* Gradient Blobs */}
                      <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
                      <div className="absolute top-2/3 left-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
                      <div className="absolute top-1/3 left-2/3 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl" />
                    </div>
                  )}

                  {/* ACTIVE REPORTS DOTS */}
                  {mapMode === "reports" && filteredReports.map((report) => {
                    // Map Lat/Lng to X/Y inside map
                    // SF bounds mapping approx: Lat 37.74 to 37.80, Lng -122.46 to -122.40
                    const x = ((report.location.lng - (-122.46)) / 0.06) * 100;
                    const y = ((37.80 - report.location.lat) / 0.06) * 100;

                    // Skip negative percentages
                    if (x < 0 || x > 100 || y < 0 || y > 100) return null;

                    // Color based on status & category
                    let color = "bg-rose-500 ring-rose-400";
                    if (report.category === IssueCategory.WATER_LEAK) color = "bg-cyan-500 ring-cyan-400";
                    if (report.category === IssueCategory.GARBAGE) color = "bg-amber-500 ring-amber-400";
                    if (report.category === IssueCategory.STREETLIGHT) color = "bg-yellow-400 ring-yellow-300";

                    return (
                      <button
                        key={report.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full ring-4 ring-opacity-30 hover:scale-125 transition-all z-10 ${color} ${
                          selectedReport?.id === report.id ? "scale-150 ring-teal-400 animate-bounce" : ""
                        }`}
                        title={report.title}
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-950 stroke-[3px]" />
                      </button>
                    );
                  })}

                  {/* PREDICTIVE HOTSPOTS MAP DOTS */}
                  {mapMode === "predictive" && predictiveHotspots.map((hotspot) => {
                    const x = ((hotspot.lng - (-122.46)) / 0.06) * 100;
                    const y = ((37.80 - hotspot.lat) / 0.06) * 100;

                    if (x < 0 || x > 100 || y < 0 || y > 100) return null;

                    return (
                      <button
                        key={hotspot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHotspot(hotspot);
                        }}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full ring-8 ring-amber-500/10 hover:scale-125 transition-all z-10 animate-pulse duration-1000 ${
                          selectedHotspot?.id === hotspot.id ? "ring-teal-400 scale-150" : ""
                        }`}
                        title={`Predictive ${hotspot.category}`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-950 font-bold" />
                      </button>
                    );
                  })}

                  {/* PLACED NEW PIN INDICATOR */}
                  {clickedCoords && (
                    <div
                      style={{
                        left: `${((clickedCoords.lng - (-122.46)) / 0.06) * 100}%`,
                        top: `${((37.80 - clickedCoords.lat) / 0.06) * 100}%`
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-none"
                    >
                      <span className="bg-teal-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-teal-300 animate-bounce">
                        New Report Pin
                      </span>
                      <MapPin className="w-6 h-6 text-teal-400 animate-pulse" />
                    </div>
                  )}

                  {/* MAP LEGEND OVERLAY */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-lg text-[10px] space-y-1 text-slate-300 pointer-events-none">
                    <p className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-200">District Legend</p>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                      <span>Roads/Potholes</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
                      <span>Water Leaks</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      <span>Waste Dumping</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                      <span>Streetlights</span>
                    </div>
                  </div>

                  {/* ACTIVE VIEW CARD POPUP ON MAP */}
                  {selectedReport && (
                    <div className="absolute top-3 right-3 max-w-xs bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl space-y-2 pointer-events-auto text-xs z-30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/20">
                          {selectedReport.category}
                        </span>
                        <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-200">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-100 truncate">{selectedReport.title}</h4>
                      <p className="text-slate-400 text-[11px] line-clamp-2">{selectedReport.description}</p>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-400 font-bold">Severity: {selectedReport.severity.toUpperCase()}</span>
                        <span className="text-slate-400">Urgency: {selectedReport.urgencyScore}/100</span>
                      </div>
                      <div className="flex items-center space-x-1.5 pt-1.5 border-t border-slate-800">
                        <button
                          onClick={() => handleVerifyReport(selectedReport.id)}
                          disabled={selectedReport.votes.includes("dhavuchaudhary009@gmail.com")}
                          className="flex-1 py-1 px-2 rounded bg-teal-500 text-slate-950 font-bold text-center hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
                        >
                          {selectedReport.votes.includes("dhavuchaudhary009@gmail.com") ? "Verified" : "Verify (+15 XP)"}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedHotspot && (
                    <div className="absolute top-3 right-3 max-w-xs bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl space-y-2 pointer-events-auto text-xs z-30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          Predictive Warning
                        </span>
                        <button onClick={() => setSelectedHotspot(null)} className="text-slate-400 hover:text-slate-200">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-100 uppercase">Potential {selectedHotspot.category} Zone</h4>
                      <p className="text-slate-400 text-[11px]">{selectedHotspot.description}</p>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-orange-400 font-bold">AI Risk score: {selectedHotspot.riskScore}%</span>
                        <span className="text-slate-300">Trend: {selectedHotspot.trend.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* REPORT DIRECTORY / INCIDENTS LOG */}
              <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-teal-400" />
                      <span>Active Incidents & Multi-Agent Evaluations ({filteredReports.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">Real-time status updates of autonomous council tasks</p>
                  </div>

                  {/* Filter category bar */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-teal-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="pothole">Potholes Only</option>
                    <option value="water_leak">Water Leaks Only</option>
                    <option value="garbage">Garbage Dumping</option>
                    <option value="streetlight">Streetlight Burnout</option>
                  </select>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`group border rounded-xl p-4 transition-all cursor-pointer flex flex-col space-y-3 ${
                        selectedReport?.id === report.id
                          ? "bg-slate-800/80 border-teal-500 shadow-lg"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/80"
                      }`}
                    >
                      {/* Image and status header */}
                      <div className="relative h-32 rounded-lg overflow-hidden border border-slate-800">
                        <img
                          src={report.imageUrl}
                          alt={report.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                        
                        {/* Status tag */}
                        <div className="absolute top-2 left-2">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            report.status === IssueStatus.RESOLVED ? "bg-emerald-500 text-slate-950" :
                            report.status === IssueStatus.ESCALATED ? "bg-rose-500 text-slate-100 animate-pulse" :
                            report.status === IssueStatus.VERIFIED ? "bg-teal-500 text-slate-950" :
                            "bg-slate-700 text-slate-300"
                          }`}>
                            {report.status}
                          </span>
                        </div>

                        {/* Category tag */}
                        <div className="absolute bottom-2 left-2">
                          <p className="text-[10px] font-semibold text-slate-200 uppercase tracking-wide">
                            {report.category}
                          </p>
                        </div>

                        {/* Urgency Score */}
                        <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono text-amber-400">
                          Urgency: {report.urgencyScore}
                        </div>
                      </div>

                      {/* Content details */}
                      <div>
                        <h4 className="font-bold text-slate-200 line-clamp-1 group-hover:text-teal-400 transition-colors">
                          {report.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {report.description}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-600" />
                          <span className="truncate">{report.location.address}</span>
                        </p>
                      </div>

                      {/* Multi-Agent Diagnostic results */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                        <div>
                          <p className="text-slate-500 uppercase tracking-wider font-semibold">Visual Agent</p>
                          <p className="text-slate-300 truncate font-mono">{report.visualAnalysis?.detectedCategory || "Assigned"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-wider font-semibold">Verifier Agent</p>
                          <p className="text-slate-300 truncate font-mono">Trust: {report.verificationAgent?.communityTrustScore || 60}%</p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-wider font-semibold">Escalation Agent</p>
                          <p className="text-slate-300 truncate font-mono">
                            {report.escalationAgent?.escalated ? "🚨 Escalated" : "✓ In Queue"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-wider font-semibold">Resolution Plan</p>
                          <p className="text-slate-300 truncate font-mono">${report.resolutionPlanner?.costEstimate || "Pending"}</p>
                        </div>
                      </div>

                      {/* Action verification buttons */}
                      <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifyReport(report.id);
                          }}
                          disabled={report.votes.includes("dhavuchaudhary009@gmail.com") || report.status === IssueStatus.RESOLVED}
                          className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg border border-teal-500/30 text-[11px] font-semibold text-teal-400 hover:bg-teal-500/10 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{report.votes.includes("dhavuchaudhary009@gmail.com") ? "Verified" : `Upvote/Verify (${report.votes.length})`}</span>
                        </button>

                        {/* Admin Action Menu */}
                        {report.status !== IssueStatus.RESOLVED && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminResolve(report.id);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-bold hover:bg-emerald-400 transition-all"
                          >
                            Resolve
                          </button>
                        )}
                        {report.status !== IssueStatus.ESCALATED && report.status !== IssueStatus.RESOLVED && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminEscalate(report.id);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[11px] font-semibold hover:bg-rose-500/20 transition-all"
                          >
                            Escalate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: AI PREDICTIVE RISK ANALYTICS */}
          {activeTab === "predictive" && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-teal-400" />
                    <span>Predictive Maintenance & Asset Fatigue Intelligence</span>
                  </h3>
                  <p className="text-xs text-slate-400">Autonomous risk models predicting physical infrastructure collapses before they impact drivers.</p>
                </div>
                <button
                  onClick={handleGeneratePredictive}
                  className="px-4 py-2 bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/10 hover:scale-105 transition-all flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulate Fresh Predictions</span>
                </button>
              </div>

              {/* Predictor Dashboard Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Preemptive Warning Window</span>
                  <div className="text-2xl font-bold font-mono text-teal-400">14-30 Days</div>
                  <p className="text-[10px] text-slate-400 mt-1">Average forecast timeline before critical asset collapse</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Budget Protected Preemptively</span>
                  <div className="text-2xl font-bold font-mono text-amber-300">$18,450</div>
                  <p className="text-[10px] text-slate-400 mt-1">Cost savings relative to emergency crisis repair</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Risk Models Active</span>
                  <div className="text-2xl font-bold font-mono text-rose-400">4 Core Models</div>
                  <p className="text-[10px] text-slate-400 mt-1">Sonic main leaks, structural scan pothole overlays</p>
                </div>
              </div>

              {/* Hotspot list */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-200">Current AI-Detected Pre-Failure Hotspots</h4>
                <div className="space-y-3">
                  {predictiveHotspots.map((hotspot) => (
                    <div
                      key={hotspot.id}
                      className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700/60 transition-all"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-500">
                          <AlertTriangle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-200 uppercase">
                              PRE-FAIL: {hotspot.category}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              hotspot.trend === "increasing" ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-400"
                            }`}>
                              Trend: {hotspot.trend.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{hotspot.description}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Coordinates: ({hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}) • Forecast Collapse Date: {new Date(hotspot.estimatedOccurrenceDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 md:self-center">
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 uppercase">Risk Level</p>
                          <p className="text-base font-bold text-amber-400 font-mono">{hotspot.riskScore}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 uppercase">Est. Saving</p>
                          <p className="text-base font-bold text-teal-400 font-mono">${hotspot.predictedResolutionCost}</p>
                        </div>
                        <button
                          onClick={() => {
                            // Turn predictive hotspot into actual report with pre-filled content
                            setNewTitle(`Pre-Emptive Repair: Identified ${hotspot.category}`);
                            setNewDescription(`Pre-emptive civic dispatch requested for predictive hotspot. ${hotspot.description}`);
                            setNewCategory(hotspot.category);
                            setClickedCoords({ lat: hotspot.lat, lng: hotspot.lng });
                            setShowSubmitModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700/60 text-xs font-bold rounded-lg transition-all"
                        >
                          Dispatch Crew
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMPACT ANALYTICS DASHBOARD */}
          {activeTab === "stats" && stats && (
            <div className="space-y-6">
              
              {/* Stat Bento Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Total Issues Filed</span>
                    <FileText className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-slate-100">{stats.totalIssuesReported}</div>
                  <span className="text-[10px] text-teal-400 font-medium">100% evaluated by AI Agent</span>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Issues Resolved</span>
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-emerald-400">{stats.totalIssuesResolved}</div>
                  <span className="text-[10px] text-slate-400">Avg Resolution: {stats.avgResolutionTimeDays} days</span>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Active Responders</span>
                    <User className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-purple-400">{stats.activeCitizens}</div>
                  <span className="text-[10px] text-slate-400">SF Bay Area Citizens</span>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Community Hero XP</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-amber-300">{stats.communityHeroPoints}</div>
                  <span className="text-[10px] text-amber-400">Earned via civic task validations</span>
                </div>
              </div>

              {/* Charts container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Chart 1: Category Distribution */}
                <div className="bg-slate-800/30 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="font-bold text-sm text-slate-200 mb-4">Incident Distribution by Category</h4>
                  
                  <div className="space-y-3">
                    {Object.entries(stats.categoryDistribution).map(([category, count]) => {
                      const total = (Object.values(stats.categoryDistribution) as number[]).reduce((a, b) => a + b, 0) || 1;
                      const percentage = Math.round(((count as number) / total) * 100);
                      
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span className="capitalize font-semibold">{category.replace("_", " ")}</span>
                            <span className="font-mono">{count} reports ({percentage}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${percentage}%` }}
                              className="h-full bg-teal-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 2: Monthly Trends Bar representation */}
                <div className="bg-slate-800/30 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="font-bold text-sm text-slate-200 mb-4">Monthly Community Report Activity</h4>
                  
                  <div className="flex h-48 items-end justify-between px-4 pt-4 border-b border-slate-800">
                    {stats.monthlyTrends.map((trend) => {
                      const maxVal = Math.max(...stats.monthlyTrends.map(t=>t.reported)) || 1;
                      const reportedHeight = (trend.reported / maxVal) * 100;
                      const resolvedHeight = (trend.resolved / maxVal) * 100;

                      return (
                        <div key={trend.month} className="flex flex-col items-center space-y-2 w-12">
                          <div className="flex items-end space-x-1.5 h-32 w-full justify-center">
                            {/* Reported bar */}
                            <div 
                              style={{ height: `${reportedHeight}%` }} 
                              className="w-3 bg-teal-500/80 rounded-t"
                              title={`Reported in ${trend.month}: ${trend.reported}`}
                            />
                            {/* Resolved bar */}
                            <div 
                              style={{ height: `${resolvedHeight}%` }} 
                              className="w-3 bg-emerald-400 rounded-t"
                              title={`Resolved in ${trend.month}: ${trend.resolved}`}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{trend.month}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center space-x-4 mt-3 text-[10px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-teal-500 rounded" />
                      <span>Reported</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded" />
                      <span>Resolved</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: GAMIFIED LEADERBOARDS */}
          {activeTab === "leaderboard" && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-teal-400" />
                  <span>CivicMind Community Hero Board</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Compete with fellow citizens to earn Hero Points (XP) by filing high-fidelity reports and verifying neighbor alerts!
                </p>
              </div>

              {/* Hero Rank list */}
              <div className="space-y-3">
                {leaderboard.map((user, idx) => (
                  <div
                    key={user.email}
                    className={`p-4 rounded-xl flex items-center justify-between border transition-all ${
                      user.email === "dhavuchaudhary009@gmail.com"
                        ? "bg-gradient-to-r from-teal-950/40 to-slate-900 border-teal-500/80 scale-[1.01] shadow-lg"
                        : "bg-slate-900/60 border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Placement crown / rank badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold font-mono text-sm ${
                        idx === 0 ? "bg-amber-400 text-slate-950 shadow-md ring-4 ring-amber-400/20" :
                        idx === 1 ? "bg-slate-300 text-slate-950" :
                        idx === 2 ? "bg-amber-600 text-slate-100" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-100 text-sm">
                            {user.name}
                          </span>
                          {user.email === "dhavuchaudhary009@gmail.com" && (
                            <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded border border-teal-500/30">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.badges.map(badge => (
                            <span key={badge} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                              🎖️ {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-right">
                      <div className="hidden sm:block">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Activities</p>
                        <p className="text-slate-300 font-mono">
                          {user.reportsSubmitted} Reports • {user.verificationsDone} Verifications
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-amber-400 uppercase font-bold tracking-wider">Points</p>
                        <div className="flex items-center justify-end space-x-1">
                          <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                          <span className="font-bold font-mono text-sm text-slate-100">{user.heroPoints} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: HACKATHON PITCH DECK & DETAILED ARCHITECTURE */}
          {activeTab === "pitch" && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              
              {/* Pitch Deck Header */}
              <div className="border-b border-slate-700 pb-4">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-xl font-extrabold text-slate-100">
                    Google Hackathon Winner: Pitch Deck & System Architecture
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Complete blueprint of CivicMind AI - ready for the final showcase presentation.
                </p>
              </div>

              {/* Slide 1: Problem & Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-teal-400 text-sm uppercase tracking-wider mb-2">01. The Problem & Tragedy</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Local community reporting mechanisms are broken. Potholes sit untouched for months, wasting municipal budgets on emergency repairs while endangering cyclists. 
                    Standard report platforms rely on slow, manual city routing queues, while duplicate filings overwhelm municipal back-office staff.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-400 text-sm uppercase tracking-wider mb-2">02. Autonomous Agentic Solution</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    CivicMind AI transforms passive reporting into a **dynamic, multi-agent dispatch mesh**. 
                    A cluster of autonomous LLM agents (Visual, Verification, Predictive, Escalation, Resolution Planner, and Assistant) collaborate asynchronously on municipal reports to identify duplicates, evaluate severity, draft engineering procedures, auto-schedule dispatch, and warn citizens of failure risk zones before they collapse.
                  </p>
                </div>
              </div>

              {/* Interactive Agentic Architecture workflow diagram */}
              <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center space-x-1">
                  <Cpu className="w-4 h-4 text-teal-400" />
                  <span>Agent Collaborative Pipeline Mesh</span>
                </h4>
                
                <div className="relative p-4 bg-slate-950 rounded-lg border border-slate-850 overflow-x-auto">
                  <div className="flex items-center justify-between min-w-[700px] text-xs font-mono">
                    
                    {/* Step 1 */}
                    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 p-2.5 rounded-lg w-32 text-center">
                      <span className="text-[10px] text-slate-500">Citizen Submission</span>
                      <span className="font-bold text-slate-300 text-[11px] mt-1">Photo Upload</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

                    {/* Step 2 */}
                    <div className="flex flex-col items-center bg-slate-900 border border-teal-500/30 p-2.5 rounded-lg w-32 text-center ring-2 ring-teal-500/10">
                      <span className="text-[10px] text-teal-400">Agent 1: Visual</span>
                      <span className="font-bold text-slate-300 text-[11px] mt-1">Gemini Vision</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

                    {/* Step 3 */}
                    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 p-2.5 rounded-lg w-32 text-center">
                      <span className="text-[10px] text-amber-400">Agent 2: Verifier</span>
                      <span className="font-bold text-slate-300 text-[11px] mt-1">Duplicate check</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

                    {/* Step 4 */}
                    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 p-2.5 rounded-lg w-32 text-center">
                      <span className="text-[10px] text-purple-400">Agent 5: Planner</span>
                      <span className="font-bold text-slate-300 text-[11px] mt-1">Budget & Steps</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

                    {/* Step 5 */}
                    <div className="flex flex-col items-center bg-slate-900 border border-rose-500/30 p-2.5 rounded-lg w-32 text-center">
                      <span className="text-[10px] text-rose-400">Agent 4: Escalation</span>
                      <span className="font-bold text-slate-300 text-[11px] mt-1">Automatic Dispatch</span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-2">
                  <h5 className="font-bold text-xs text-slate-200 uppercase flex items-center space-x-1">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Database Schema</span>
                  </h5>
                  <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                    <li>- Collection: reports</li>
                    <li>  - id: String</li>
                    <li>  - status: Enum</li>
                    <li>  - visualAnalysis: JSON</li>
                    <li>  - verificationAgent: JSON</li>
                    <li>  - resolutionPlanner: JSON</li>
                  </ul>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-2">
                  <h5 className="font-bold text-xs text-slate-200 uppercase flex items-center space-x-1">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>API Endpoint Design</span>
                  </h5>
                  <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                    <li>- GET /api/reports</li>
                    <li>- POST /api/reports</li>
                    <li>- POST /api/reports/:id/verify</li>
                    <li>- GET /api/predictive</li>
                    <li>- POST /api/chat (Assistant)</li>
                  </ul>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-2">
                  <h5 className="font-bold text-xs text-slate-200 uppercase flex items-center space-x-1">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Google Technologies</span>
                  </h5>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• **Gemini 2.5 Pro / Flash**: Multimodal visual diagnostics & structured plan outputs.</li>
                    <li>• **Cloud Run**: Low-latency auto-scaling deployment container.</li>
                    <li>• **BigQuery**: Municipal report frequency logs database.</li>
                  </ul>
                </div>
              </div>

              {/* Deployment Guide */}
              <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-850 space-y-2">
                <h4 className="font-bold text-xs text-slate-200 uppercase">Google Cloud Production Deployment Guide</h4>
                <div className="text-[11px] text-slate-400 space-y-2 leading-relaxed">
                  <p>
                    1. **Prepare Docker Container**: Dockerfile triggers node production build compiling server and frontend to `dist/server.cjs`.
                  </p>
                  <pre className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto">
                    gcloud builds submit --tag gcr.io/&lt;project-id&gt;/civicmind-app
                  </pre>
                  <p>
                    2. **Deploy to Cloud Run**: Expose port 3000 mapping standard production environment. Pass Gemini Secrets safely.
                  </p>
                  <pre className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto">
                    gcloud run deploy civicmind-service --image gcr.io/&lt;project-id&gt;/civicmind-app --platform managed --allow-unauthenticated --set-env-vars=GEMINI_API_KEY=YOUR_KEY
                  </pre>
                </div>
              </div>

            </div>
          )}

        </section>

        {/* RIGHT COLUMN (4 COLS ON LARGE SCREEN - CHATBOT & REPORT LODGING PANEL) */}
        <section className="lg:col-span-4 flex flex-col space-y-6 max-h-[calc(100vh-180px)] overflow-hidden">
          
          {/* QUICK REPORT SUBMISSION SHORTCUT */}
          <div className="bg-gradient-to-tr from-slate-850 to-slate-900 border border-slate-750 p-4 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-extrabold text-teal-400 tracking-wider">
                Autonomous Report Core
              </h3>
              <span className="text-[10px] font-mono bg-teal-500/10 text-teal-300 px-1.5 rounded">
                XP Bonus +50
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Submit local potholes, leaks, or garbage to activate visual inspector and planning agents instantly.
            </p>
            <button
              onClick={() => {
                setClickedCoords(null);
                setShowSubmitModal(true);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-extrabold rounded-xl transition-all shadow-md shadow-teal-500/10"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3px]" />
              <span>Report Community Issue</span>
            </button>
          </div>

          {/* CHATBOT: CIVIC ASSISTANT AGENT (AGENT 6) */}
          <div className="flex-1 bg-slate-800/40 border border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[300px]">
            
            {/* Chatbot Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span className="text-xs font-extrabold text-slate-200">Civic Assistant Agent</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">Autonomous Council DB online</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs scrollbar-thin">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl space-y-1 ${
                    msg.sender === "user"
                      ? "bg-teal-500 text-slate-950 rounded-tr-none font-medium"
                      : "bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none leading-relaxed"
                  }`}>
                    {/* Render basic formatting with strong markdown */}
                    <p className="whitespace-pre-line">
                      {msg.text.split("**").map((part, i) => i % 2 === 1 ? <strong key={i} className={msg.sender === "user" ? "text-slate-950" : "text-teal-400"}>{part}</strong> : part)}
                    </p>

                    {/* Suggestions */}
                    {msg.suggestions && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {msg.suggestions.map((sug) => (
                          <button
                            key={sug}
                            onClick={() => handleSendChat(sug)}
                            className="bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700/60 text-[10px] px-2 py-1 rounded transition-colors text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isChatTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-slate-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce duration-300" />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce duration-300 [animation-delay:100ms]" />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce duration-300 [animation-delay:200ms]" />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask about pothole status, or how to earn XP..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChat();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600"
              />
              <button
                onClick={() => handleSendChat()}
                className="p-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </section>

      </main>

      {/* CREATE REPORT SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-xl rounded-2xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-slate-100 text-base">File New Community Incident Report</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Image Quick Select Templates */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                💡 Hackathon Testing: Select a Premium Asset Template (Simulate Camera)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEST_IMAGE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      setNewTitle(tmpl.name);
                      setNewDescription(tmpl.description);
                      setNewCategory(tmpl.category);
                      setNewImage(tmpl.url);
                    }}
                    className={`p-1.5 border rounded-lg text-[10px] text-left transition-all flex flex-col space-y-1 ${
                      newImage === tmpl.url
                        ? "bg-teal-500/10 border-teal-500 text-teal-400 font-semibold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <img src={tmpl.url} alt={tmpl.name} className="h-12 w-full object-cover rounded" />
                    <span className="truncate block">{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category select */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Incident Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as IssueCategory)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-lg p-2.5 outline-none text-slate-200"
                  >
                    <option value="pothole">Pothole (Roadway Depression)</option>
                    <option value="water_leak">Water Leak / Gush</option>
                    <option value="garbage">Garbage / Litter Dump</option>
                    <option value="streetlight">Streetlight Outage</option>
                    <option value="road_damage">Structural Road Damage</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Issue Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broken water valve"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-lg p-2.5 outline-none text-slate-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Description & Damage Summary</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize coordinates, damage impact, risk to neighborhood traffic or pedestrians..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-lg p-2.5 outline-none text-slate-200 leading-relaxed"
                />
              </div>

              {/* Address / Location */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Incident Address / GPS Mapping Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 550 Dolores St, SF"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-lg p-2.5 outline-none text-slate-200 font-mono"
                />
              </div>

              {/* Custom Image Upload */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Or Upload Live Camera Evidence (optional)</label>
                <div className="flex items-center justify-center border-2 border-dashed border-slate-800 hover:border-slate-700/60 rounded-lg p-4 bg-slate-950 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="file-selector"
                  />
                  <label htmlFor="file-selector" className="text-center cursor-pointer space-y-1">
                    <FileUp className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-slate-400 text-[10px]">Drag & drop or Click to choose image</p>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-800 hover:bg-slate-800/40 text-slate-400 font-bold text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 font-extrabold rounded-lg hover:scale-[1.01] transition-all flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Agents Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                      <span>Submit and Run Agents (+50 XP)</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
