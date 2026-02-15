import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Shield,
    Activity,
    Bell
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VideoInput from "@/components/dashboard/VideoInput";
import { dbService } from "@/services/database";

const Dashboard = () => {
    // Risk State - Track per camera
    const [cameraRisks, setCameraRisks] = useState<Record<number, { level: string, score: number }>>({});
    const [activeCameras, setActiveCameras] = useState<number>(0);

    // Track stats for each camera
    const [cameraStatuses, setCameraStatuses] = useState<Record<number, string>>({});

    useEffect(() => {
        const active = Object.values(cameraStatuses).filter(s => s === "active").length;
        setActiveCameras(active);
    }, [cameraStatuses]);

    // Derived Global State
    const calculateGlobalStats = () => {
        const risks = Object.values(cameraRisks);

        // 1. Current Risk: Priority (CRITICAL > HIGH > LOW)
        let level = "LOW";
        if (risks.some(r => r.level === "CRITICAL")) level = "CRITICAL";
        else if (risks.some(r => r.level === "HIGH")) level = "HIGH";

        // 2. System Confidence: Mean Score
        const totalScore = risks.reduce((acc, r) => acc + (r.score || 0), 0);
        const avgScore = risks.length > 0 ? totalScore / risks.length : 0;

        return { level, score: avgScore };
    };

    const globalStats = calculateGlobalStats();

    // User Customization State
    const [expandedCamera, setExpandedCamera] = useState<number | null>(null);
    const [cameraNames, setCameraNames] = useState<Record<number, string>>({
        1: "Main Entrance",
        2: "Parking Lot A",
        3: "Warehouse Interior",
        4: "Assembly Line"
    });

    const toggleExpand = (id: number) => {
        setExpandedCamera(prev => prev === id ? null : id);
    };

    const handleNameChange = (id: number, newName: string) => {
        setCameraNames(prev => ({ ...prev, [id]: newName }));
    };

    const handleStatusChange = (id: number, status: string) => {
        setCameraStatuses(prev => ({ ...prev, [id]: status }));
    };

    const handleRiskUpdate = async (id: number, risk: any) => {
        // console.log(`[Dashboard] Risk update for Cam ${id}:`, risk);
        setCameraRisks(prev => ({
            ...prev,
            [id]: { level: risk.level, score: risk.score }
        }));

        // CRITICAL FIX: Save to History (Supabase)
        // Only save if risk is HIGH or CRITICAL to prevent spamming the DB
        if (risk.level === "HIGH" || risk.level === "CRITICAL") {
            try {
                // Rate limit: Check if we just saved this camera's risk? 
                // For now, let's just save it. The DB service handles alert de-duplication logic if needed.
                await dbService.insertLog({
                    camera_id: `CAM-${id}`,
                    risk_level: risk.level,
                    risk_score: risk.score,
                    detected_objects: risk.factors || [],
                    activity: 'Unsafe',
                    timestamp: new Date().toISOString()
                });
            } catch (err) {
                console.error("Failed to save detection log:", err);
            }
        }
    };

    // Helper to get color based on risk level
    const getRiskColor = (level: string) => {
        switch (level) {
            case "CRITICAL": return "text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
            case "HIGH": return "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]";
            case "MEDIUM": return "text-yellow-500";
            default: return "text-green-500";
        }
    };

    const riskColor = getRiskColor(globalStats.level);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Active Cameras", value: `${activeCameras}/4`, icon: Activity, color: "text-green-500" },
                        { label: "Current Risk", value: globalStats.level, icon: Shield, color: riskColor },
                        { label: "System Confidence", value: `${(globalStats.score * 100).toFixed(1)}%`, icon: Bell, color: "text-blue-400" },
                        { label: "System Status", value: "ONLINE", icon: Activity, color: "text-green-500" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                        >
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                                <h3 className={`text-2xl font-display font-bold mt-1 ${stat.color} group-hover:scale-105 transition-transform`}>{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl bg-muted/50 ${stat.color} bg-opacity-10`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Video Grid - REAL FUNCTIONALITY */}
                <div className={`grid gap-4 transition-all duration-300 ${expandedCamera ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2"
                    }`}>
                    {[1, 2, 3, 4].map((id) => {
                        const isExpanded = expandedCamera === id;
                        // Determine grid classes based on expansion state
                        // If expanded: The expanded one takes 3 cols & 3 rows. Others take 1 col.
                        // If not expanded: Everyone takes 1 col (in a 2-col grid).
                        let gridClass = "";

                        if (expandedCamera) {
                            if (isExpanded) {
                                gridClass = "lg:col-span-3 lg:row-span-3 order-first"; // Main view
                            } else {
                                gridClass = "lg:col-span-1 lg:row-span-1"; // Side view
                            }
                        }

                        return (
                            <div key={id} className={`transition-all duration-300 ${gridClass}`}>
                                <VideoInput
                                    id={id}
                                    label={cameraNames[id]}
                                    isExpanded={isExpanded}
                                    onToggleExpand={() => toggleExpand(id)}
                                    onRename={(newName) => handleNameChange(id, newName)}
                                    onRiskUpdate={(risk) => handleRiskUpdate(id, risk)}
                                    onStatusChange={(s) => handleStatusChange(id, s)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
