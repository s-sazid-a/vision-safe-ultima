import { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from "recharts";
import { motion } from "framer-motion";
import { useDetectionContext } from "@/store/DetectionContext";
import { Card } from "@/components/ui/card";

const Analytics = () => {
    const { detectionHistory, activeCameras, systemConfidence } = useDetectionContext();

    // Calculate stats
    const stats = useMemo(() => {
        const total = detectionHistory.length;
        const lowRisk = detectionHistory.filter(d => d.riskLevel === "LOW").length;
        const highRisk = detectionHistory.filter(d => d.riskLevel === "HIGH").length;
        const critical = detectionHistory.filter(d => d.riskLevel === "CRITICAL").length;
        
        return { total, lowRisk, highRisk, critical };
    }, [detectionHistory]);

    // Risk distribution chart data
    const riskDistribution = useMemo(() => {
        return [
            { name: "Low Risk", value: stats.lowRisk, fill: "#22c55e" },
            { name: "High Risk", value: stats.highRisk, fill: "#f97316" },
            { name: "Critical", value: stats.critical, fill: "#ef4444" },
        ].filter(d => d.value > 0);
    }, [stats]);

    // Camera detection count
    const cameraStats = useMemo(() => {
        const cameraMap: Record<string, number> = {};
        detectionHistory.forEach(d => {
            cameraMap[d.cameraLabel] = (cameraMap[d.cameraLabel] || 0) + 1;
        });
        return Object.entries(cameraMap).map(([name, count]) => ({
            name,
            detections: count
        }));
    }, [detectionHistory]);

    // Timeline data (last 10 detections)
    const timelineData = useMemo(() => {
        return detectionHistory.slice(0, 10).reverse().map((d) => ({
            time: d.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            risk: d.riskLevel === "CRITICAL" ? 3 : d.riskLevel === "HIGH" ? 2 : 1,
            label: d.cameraLabel
        }));
    }, [detectionHistory]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-display font-bold">Analytics Overview</h2>
                    <p className="text-muted-foreground">Deep insights into safety metrics and trends.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Total Detections</p>
                        <p className="text-3xl font-bold mt-2">{stats.total}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Critical Alerts</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">{stats.critical}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">High Risk</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">{stats.highRisk}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Low Risk</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">{stats.lowRisk}</p>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Risk Distribution Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card p-6 rounded-lg border"
                    >
                        <h3 className="font-semibold text-lg mb-4">Risk Distribution</h3>
                        {riskDistribution.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={riskDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {riskDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No data yet
                            </div>
                        )}
                    </motion.div>

                    {/* Camera Detections Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card p-6 rounded-lg border"
                    >
                        <h3 className="font-semibold text-lg mb-4">Detections by Camera</h3>
                        {cameraStats.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cameraStats}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="detections" fill="#8b5cf6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No camera data yet
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Timeline Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card p-6 rounded-lg border"
                >
                    <h3 className="font-semibold text-lg mb-4">Recent Detections Timeline</h3>
                    {timelineData.length > 0 ? (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timelineData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="time" fontSize={12} />
                                    <YAxis domain={[0, 3]} fontSize={12} />
                                    <Tooltip 
                                        formatter={(value) => {
                                            const riskMap = { 1: "Low", 2: "High", 3: "Critical" };
                                            return riskMap[value as keyof typeof riskMap] || "Unknown";
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="risk" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={2}
                                        dot={{ fill: "#8b5cf6", r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                            No timeline data yet
                        </div>
                    )}
                </motion.div>

                {/* Summary Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Active Cameras</p>
                        <p className="text-2xl font-bold mt-2">{activeCameras}/4</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Current System Confidence</p>
                        <p className="text-2xl font-bold mt-2">{systemConfidence}%</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Alert Ratio</p>
                        <p className="text-2xl font-bold mt-2">
                            {stats.total > 0 ? (((stats.critical + stats.highRisk) / stats.total) * 100).toFixed(1) : "0"}%
                        </p>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Analytics;
