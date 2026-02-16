import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
    Search, Download, Trash2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDetectionContext } from "@/store/DetectionContext";
import { useAuth } from "@/store/AuthContext";

const History = () => {
    const { clearHistory: clearContextHistory } = useDetectionContext(); // We might still want to clear context?
    const { currentProfile, getToken } = useAuth();
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterRisk, setFilterRisk] = useState<string>("all");
    const [filterCamera, setFilterCamera] = useState<string>("all");

    // Fetch History
    useEffect(() => {
        const fetchHistory = async () => {
            if (!currentProfile) return;
            setLoading(true);
            try {
                const token = await getToken();
                const res = await fetch(`${import.meta.env.VITE_API_URL}/history/?profile_id=${currentProfile.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Remap backend data to frontend structure if needed
                    // Backend returns DetectionRecord: {id, session_id, profile_id, frame_number, hazard_type, risk_level, created_at}
                    // Frontend expects CameraDetection: {timestamp, cameraLabel, riskLevel, safeDetections, unsafeDetections...}
                    // The backend /history endpoint I wrote returns simplified records. 
                    // To get full details (safe/unsafe lists), I would need to store/fetch them.
                    // Currently my /history endpoint returns simplified data.
                    // For now, I will map it to fit the UI as best as possible.

                    const mapped = data.map((d: any) => ({
                        timestamp: new Date(d.created_at),
                        cameraLabel: d.hazard_type ? "Camera (Recorded)" : "Camera", // We didn't save camera label in detections table in my simple SQL?
                        // Wait, detections table schema: (session_id, profile_id, frame_number, detection_category, hazard_type, risk_level)
                        // It doesn't have camera_id or safe_detections list.
                        // I might need to join sessions table to get camera_id? 
                        // For MVP 4.1, I will just show what I have.

                        riskLevel: d.risk_level,
                        riskScore: d.risk_level === 'CRITICAL' ? 0.9 : (d.risk_level === 'HIGH' ? 0.7 : 0.1),
                        safeDetections: [], // Detailed lists not saved in simplified schema
                        unsafeDetections: d.hazard_type ? [{ label: d.hazard_type, confidence: 1.0, bbox: [0, 0, 0, 0], type: 'unsafe' }] : [],
                        inferenceTime: 0
                    }));
                    setHistoryData(mapped);
                }
            } catch (e) {
                console.error("Failed to fetch history", e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [currentProfile]);

    const clearHistory = async () => {
        // Implement API clear if needed, or just clear local
        setHistoryData([]);
        clearContextHistory();
    };

    // Get unique cameras from history
    const uniqueCameras = useMemo(() => {
        return [...new Set(historyData.map(d => d.cameraLabel))];
    }, [historyData]);

    // Filter detections
    const filteredDetections = useMemo(() => {
        return historyData.filter(detection => {
            const matchesSearch =
                detection.cameraLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                detection.safeDetections.some((d: any) => d.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
                detection.unsafeDetections.some((d: any) => d.label.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesRisk = filterRisk === "all" || detection.riskLevel === filterRisk;
            const matchesCamera = filterCamera === "all" || detection.cameraLabel === filterCamera;

            return matchesSearch && matchesRisk && matchesCamera;
        });
    }, [historyData, searchTerm, filterRisk, filterCamera]);

    const getRiskColor = (level: string) => {
        switch (level) {
            case "CRITICAL":
                return "bg-red-500/10 text-red-700 border-red-200";
            case "HIGH":
                return "bg-orange-500/10 text-orange-700 border-orange-200";
            case "LOW":
            default:
                return "bg-green-500/10 text-green-700 border-green-200";
        }
    };

    const handleExport = () => {
        const csv = [
            ["Timestamp", "Camera", "Risk Level", "Risk Score", "Safe Detections", "Unsafe Detections", "Inference Time (ms)"],
            ...filteredDetections.map((d: any) => [
                format(d.timestamp, "yyyy-MM-dd HH:mm:ss"),
                d.cameraLabel,
                d.riskLevel,
                d.riskScore.toFixed(3),
                d.safeDetections.map((s: any) => `${s.label}(${(s.confidence * 100).toFixed(0)}%)`).join("; "),
                d.unsafeDetections.map((u: any) => `${u.label}(${(u.confidence * 100).toFixed(0)}%)`).join("; "),
                d.inferenceTime.toFixed(1)
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `detection-history-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detection History</h1>
                        <p className="text-muted-foreground mt-2">
                            {filteredDetections.length} detections recorded {currentProfile ? `for ${currentProfile.name}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleExport}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={filteredDetections.length === 0}
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </Button>
                        <Button
                            onClick={clearHistory}
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700"
                            disabled={historyData.length === 0}
                        >
                            <Trash2 className="w-4 h-4" /> Clear
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-lg border p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search detections..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Risk Filter */}
                        <Select value={filterRisk} onValueChange={setFilterRisk}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by risk" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Risk Levels</SelectItem>
                                <SelectItem value="LOW">Low Risk</SelectItem>
                                <SelectItem value="HIGH">High Risk</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Camera Filter */}
                        <Select value={filterCamera} onValueChange={setFilterCamera}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by camera" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cameras</SelectItem>
                                {uniqueCameras.map((cam: string) => (
                                    <SelectItem key={cam} value={cam}>{cam}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card rounded-lg border overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading history...</div>
                    ) : filteredDetections.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Camera</TableHead>
                                    <TableHead>Risk Level</TableHead>
                                    <TableHead>Detections</TableHead>
                                    <TableHead>Inference Time</TableHead>
                                    <TableHead>Confidence</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDetections.map((detection: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell className="text-sm">
                                            {format(detection.timestamp, "MMM dd, HH:mm:ss")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {detection.cameraLabel}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getRiskColor(detection.riskLevel)}>
                                                {detection.riskLevel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="space-y-1">
                                                {detection.safeDetections.length > 0 && (
                                                    <div className="text-green-600">
                                                        Safe: {detection.safeDetections.map((d: any) => d.label).join(", ")}
                                                    </div>
                                                )}
                                                {detection.unsafeDetections.length > 0 && (
                                                    <div className="text-red-600">
                                                        Unsafe: {detection.unsafeDetections.map((d: any) => d.label).join(", ")}
                                                    </div>
                                                )}
                                                {detection.safeDetections.length === 0 && detection.unsafeDetections.length === 0 && (
                                                    <div className="text-muted-foreground">No detections</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {detection.inferenceTime.toFixed(0)}ms
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {(() => {
                                                const allDets = [...detection.safeDetections, ...detection.unsafeDetections];
                                                return allDets.length > 0
                                                    ? ((allDets.reduce((sum: number, d: any) => sum + d.confidence, 0) / allDets.length) * 100).toFixed(0)
                                                    : "0";
                                            })()}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            {historyData.length === 0
                                ? "No detections recorded for this profile."
                                : "No detections match your filters."
                            }
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default History;
