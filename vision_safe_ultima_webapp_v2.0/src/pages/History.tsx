import { useState, useMemo } from "react";
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

const History = () => {
    const { detectionHistory, clearHistory } = useDetectionContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRisk, setFilterRisk] = useState<string>("all");
    const [filterCamera, setFilterCamera] = useState<string>("all");

    // Get unique cameras from history
    const uniqueCameras = useMemo(() => {
        return [...new Set(detectionHistory.map(d => d.cameraLabel))];
    }, [detectionHistory]);

    // Filter detections
    const filteredDetections = useMemo(() => {
        return detectionHistory.filter(detection => {
            const matchesSearch = 
                detection.cameraLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                detection.safeDetections.some(d => d.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
                detection.unsafeDetections.some(d => d.label.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesRisk = filterRisk === "all" || detection.riskLevel === filterRisk;
            const matchesCamera = filterCamera === "all" || detection.cameraLabel === filterCamera;
            
            return matchesSearch && matchesRisk && matchesCamera;
        });
    }, [detectionHistory, searchTerm, filterRisk, filterCamera]);

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
            ...filteredDetections.map(d => [
                format(d.timestamp, "yyyy-MM-dd HH:mm:ss"),
                d.cameraLabel,
                d.riskLevel,
                d.riskScore.toFixed(3),
                d.safeDetections.map(s => `${s.label}(${(s.confidence*100).toFixed(0)}%)`).join("; "),
                d.unsafeDetections.map(u => `${u.label}(${(u.confidence*100).toFixed(0)}%)`).join("; "),
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
                            {filteredDetections.length} detections recorded
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
                            disabled={detectionHistory.length === 0}
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
                                {uniqueCameras.map(cam => (
                                    <SelectItem key={cam} value={cam}>{cam}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card rounded-lg border overflow-hidden">
                    {filteredDetections.length > 0 ? (
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
                                {filteredDetections.map((detection, idx) => (
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
                                                        Safe: {detection.safeDetections.map(d => d.label).join(", ")}
                                                    </div>
                                                )}
                                                {detection.unsafeDetections.length > 0 && (
                                                    <div className="text-red-600">
                                                        Unsafe: {detection.unsafeDetections.map(d => d.label).join(", ")}
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
                                                    ? ((allDets.reduce((sum, d) => sum + d.confidence, 0) / allDets.length) * 100).toFixed(0)
                                                    : "0";
                                            })()}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            {detectionHistory.length === 0 
                                ? "No detections recorded yet. Start monitoring from Live Monitor to see detections here."
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
