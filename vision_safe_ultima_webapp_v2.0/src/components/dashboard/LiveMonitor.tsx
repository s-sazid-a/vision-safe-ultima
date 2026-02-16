import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Activity, Zap, Video } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VideoInput from "@/components/dashboard/VideoInput";
import { Badge } from "@/components/ui/badge";
import { useDetectionContext } from "@/store/DetectionContext";

interface CameraStats {
    id: number;
    label: string;
    status: "active" | "connecting" | "offline";
    risk: { level: 'LOW' | 'HIGH' | 'CRITICAL', score: number };
}

const LiveMonitor = () => {
    const { activeCameras, currentRiskLevel, systemConfidence, notifications, clearNotifications } = useDetectionContext();



    const [cameras, setCameras] = useState<CameraStats[]>([
        { id: 1, label: "Cam 1", status: "offline", risk: { level: "LOW", score: 0 } },
        { id: 2, label: "Cam 2", status: "offline", risk: { level: "LOW", score: 0 } },
        { id: 3, label: "Cam 3", status: "offline", risk: { level: "LOW", score: 0 } },
        { id: 4, label: "Cam 4", status: "offline", risk: { level: "LOW", score: 0 } },
    ]);

    const [expandedCamera, setExpandedCamera] = useState<number | null>(null);

    const handleStatusChange = useCallback((id: number, status: "active" | "connecting" | "offline") => {
        setCameras(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    }, []);

    const handleRiskUpdate = useCallback((id: number, risk: { level: 'LOW' | 'HIGH' | 'CRITICAL', score: number }) => {
        setCameras(prev => prev.map(c => c.id === id ? { ...c, risk } : c));
    }, []);

    const handleCameraRename = useCallback((id: number, newName: string) => {
        setCameras(prev => prev.map(c => c.id === id ? { ...c, label: newName } : c));
    }, []);

    const getRiskColor = (level: 'LOW' | 'HIGH' | 'CRITICAL') => {
        switch (level) {
            case "CRITICAL": return "text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
            case "HIGH": return "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]";
            default: return "text-green-500";
        }
    };

    const getRiskBadge = (level: 'LOW' | 'HIGH' | 'CRITICAL') => {
        switch (level) {
            case "CRITICAL": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "HIGH": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            default: return "bg-green-500/10 text-green-500 border-green-500/20";
        }
    };

    const riskColor = getRiskColor(currentRiskLevel);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Stats Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: "Active Cameras",
                            value: `${activeCameras}/4`,
                            icon: Video,
                            color: activeCameras > 0 ? "text-blue-500" : "text-gray-500",
                            subtext: `${activeCameras} camera${activeCameras !== 1 ? "s" : ""} online`
                        },
                        {
                            label: "Current Risk",
                            value: currentRiskLevel,
                            icon: Shield,
                            color: riskColor,
                            subtext: "Highest priority risk"
                        },
                        {
                            label: "System Confidence",
                            value: `${systemConfidence}%`,
                            icon: Zap,
                            color: "text-yellow-500",
                            subtext: "Average detection score"
                        },
                        {
                            label: "System Status",
                            value: activeCameras > 0 ? "ONLINE" : "STANDBY",
                            icon: Activity,
                            color: activeCameras > 0 ? "text-green-500" : "text-yellow-500",
                            subtext: "All systems operational"
                        },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-5 hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        {stat.label}
                                    </p>
                                    <h3 className={`text-2xl font-display font-bold mt-2 ${stat.color} group-hover:scale-105 transition-transform`}>
                                        {stat.value}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-muted/50 ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Live Feed Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-display font-bold">Live Camera Feeds</h2>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            {cameras.filter(c => c.status === "active").length} Active
                        </Badge>
                    </div>

                    {/* Notifications (from DetectionContext) */}
                    {notifications && notifications.length > 0 && (
                        <div className="glass-card p-3 rounded-md border mb-2">
                            <h4 className="font-semibold text-sm mb-2">Alerts</h4>
                            <ul className="space-y-1">
                                {notifications.map(n => (
                                    <li key={n.id} className={`text-sm ${n.level === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`}>
                                        {n.message}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-2 flex gap-2">
                                <button className="btn btn-sm" onClick={() => clearNotifications()}>Clear</button>
                            </div>
                        </div>
                    )}

                    <div className={`grid gap-4 transition-all duration-300 ${expandedCamera ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2"
                        }`}>
                        {cameras.map((camera) => {
                            const isExpanded = expandedCamera === camera.id;
                            let gridClass = "";

                            if (expandedCamera) {
                                if (isExpanded) {
                                    gridClass = "lg:col-span-3 lg:row-span-3 order-first";
                                } else {
                                    gridClass = "lg:col-span-1 lg:row-span-1";
                                }
                            }

                            return (
                                <motion.div
                                    key={camera.id}
                                    layout
                                    className={`transition-all duration-300 ${gridClass} relative group`}
                                >
                                    <VideoInput
                                        id={camera.id}
                                        label={camera.label}
                                        isExpanded={isExpanded}
                                        onToggleExpand={() => setExpandedCamera(expandedCamera === camera.id ? null : camera.id)}
                                        onRename={(newName) => handleCameraRename(camera.id, newName)}
                                        onRiskUpdate={(risk) => handleRiskUpdate(camera.id, risk)}
                                        onStatusChange={(status) => handleStatusChange(camera.id, status)}
                                    />

                                    {/* Camera Status Overlay */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <div className={`flex items-center gap-2 px-2 py-1 rounded-md backdrop-blur-sm ${camera.status === "active" ? "bg-green-500/20 border border-green-500/40" :
                                            camera.status === "connecting" ? "bg-yellow-500/20 border border-yellow-500/40" :
                                                "bg-gray-500/20 border border-gray-500/40"
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${camera.status === "active" ? "bg-green-500 animate-pulse" :
                                                camera.status === "connecting" ? "bg-yellow-500 animate-pulse" :
                                                    "bg-gray-500"
                                                }`} />
                                            <span className="text-xs font-medium capitalize">
                                                {camera.status === "active" ? "Live" : camera.status === "connecting" ? "Connecting" : "Offline"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Camera Risk Badge */}
                                    <div className="absolute bottom-3 left-3 z-10">
                                        <Badge className={`font-bold ${getRiskBadge(camera.risk.level)} border`}>
                                            {camera.risk.level}
                                        </Badge>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>



                {/* Connection Guide */}
                {activeCameras === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-6 border-2 border-dashed border-muted-foreground/20 rounded-xl"
                    >
                        <h3 className="font-display font-bold mb-3">Getting Started</h3>
                        <ol className="space-y-2 text-sm text-muted-foreground">
                            <li>1. Click any camera to expand it</li>
                            <li>2. Select "Webcam" to use your device camera</li>
                            <li>3. Or select "File" to upload a video</li>
                            <li>4. System will start analyzing in real-time</li>
                        </ol>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default LiveMonitor;
