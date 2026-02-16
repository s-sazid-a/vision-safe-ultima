import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Camera,
    Upload,
    X,
    Maximize2,
    Minimize2,
    AlertTriangle,
    Edit2,
    Check
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDetectionContext } from "@/store/DetectionContext";
import { useAuth } from "@/store/AuthContext";

// Smart WebSocket URL derivation
const getWebSocketUrl = () => {
    // 1. Explicit Env Var
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;

    // 2. Derive from API URL
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        // Replace http/https with ws/wss and append /ws/stream if not present
        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const cleanUrl = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''); // Remove protocol and trailing slash
        return `${wsProtocol}://${cleanUrl}/ws/stream`;
    }

    // 3. Localhost Fallback
    return 'ws://localhost:8000/ws/stream';
};

const WS_URL = getWebSocketUrl();

interface Detection {
    label: string;
    confidence: number;
    bbox?: [number, number, number, number]; // x1, y1, x2, y2 (pixel or normalized)
    bbox_normalized?: [number, number, number, number];
    // Size of image on server that produced pixel bboxes (width, height)
    serverImageSize?: { width: number; height: number };
    type?: 'safe' | 'unsafe';
}

interface Risk {
    level: 'LOW' | 'HIGH' | 'CRITICAL';
    score: number;
    factors: string[];
}

interface WebSocketResponse {
    safe: { detections: Detection[] };
    unsafe: { detections: Detection[] };
    image_size?: { width: number; height: number };
    risk: Risk;
    inference_time_ms: number;
    error?: string;
}

interface VideoInputProps {
    id: number;
    label: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onRename: (newName: string) => void;
    onRiskUpdate?: (risk: Risk) => void;
    onStatusChange?: (status: "active" | "connecting" | "offline") => void;
}

const VideoInput = ({ id, label, isExpanded, onToggleExpand, onRename, onRiskUpdate, onStatusChange }: VideoInputProps) => {
    const { addDetection, updateCameraStatus } = useDetectionContext();
    const { currentProfile } = useAuth();
    // Force refresh check
    useEffect(() => { console.log("VideoInput: Unlocked Version Loaded"); }, []);
    const [mode, setMode] = useState<"webcam" | "file" | "idle">("idle");
    const [stream, setStream] = useState<MediaStream | null>(null);

    const [wsConnected, setWsConnected] = useState(false);
    const [wsError, setWsError] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(label);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const requestRef = useRef<number | null>(null);

    const detectionsRef = useRef<Detection[]>([]);
    const sessionIdRef = useRef<number | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        // REMOVED: Don't close WebSocket on unmount - keep persistent connection
        // This allows camera to continue streaming when navigating between pages
        return () => {
            // Only cancel animation frame on unmount, don't close WebSocket or stop stream
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    // Rehydrate persisted streams/urls across route changes using a window-scoped store
    useEffect(() => {
        const store = (window as any).__VSU_streams || {};
        const entry = store[id];
        if (entry) {
            if (entry.mode === 'webcam' && entry.stream) {
                setStream(entry.stream as MediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = entry.stream as MediaStream;
                    videoRef.current.play().catch(() => { });
                }
                setMode('webcam');
                connectWebSocket();
            } else if (entry.mode === 'file' && entry.url) {
                setMode('file');
                if (videoRef.current) {
                    videoRef.current.src = entry.url;
                    videoRef.current.loop = true;
                    videoRef.current.play().catch(() => { });
                }
                connectWebSocket();
            }
        }
    }, [id]);

    const stopStream = () => {
        // Manual stop only - called when user clicks close button
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.src = "";
        }
        // Close WebSocket on manual stop
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }
        // Invalidate session to ignore any in-flight messages
        sessionIdRef.current = null;
        setMode("idle");
        setWsConnected(false);
        onStatusChange?.("offline");
        updateCameraStatus(id, { isConnected: false, mode: "idle" });
        detectionsRef.current = [];
        // Remove persisted store entry when user explicitly stops
        try {
            const store = (window as any).__VSU_streams || {};
            if (store[id]) {
                delete store[id];
            }
            (window as any).__VSU_streams = store;
        } catch (e) {
            // ignore
        }
    };

    const handleWebcamStart = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
            setMode("webcam");
            // Persist stream so it can be reattached after route changes
            try {
                const store = (window as any).__VSU_streams || {};
                store[id] = { mode: 'webcam', stream: mediaStream };
                (window as any).__VSU_streams = store;
            } catch (e) {
                // ignore
            }
            connectWebSocket();
            // mark a new session so stale messages are discarded
            sessionIdRef.current = Date.now();
        } catch (err) {
            console.error("Error accessing webcam:", err);
            setWsError("Camera access denied");
            onStatusChange?.("offline");
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setMode("file");
            if (videoRef.current) {
                videoRef.current.src = url;
                videoRef.current.loop = true;
                videoRef.current.play();
            }
            // Persist uploaded file URL so it remains visible across navigation
            try {
                const store = (window as any).__VSU_streams || {};
                store[id] = { mode: 'file', url };
                (window as any).__VSU_streams = store;
            } catch (e) {
                // ignore
            }
            connectWebSocket();
            // mark a new session so stale messages are discarded
            sessionIdRef.current = Date.now();
        }
    };

    const connectWebSocket = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        onStatusChange?.("connecting");

        try {
            // Append profile_id if available
            let wsUrl = WS_URL;
            if (currentProfile?.id) {
                const separator = wsUrl.includes('?') ? '&' : '?';
                wsUrl += `${separator}profile_id=${currentProfile.id}`;
            }

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log(`[CAM-${id}] ✅ WebSocket Connected to ${WS_URL}`);
                setWsConnected(true);
                setWsError(null);
                onStatusChange?.("active");
                // UPDATE GLOBAL CAMERA STATUS
                updateCameraStatus(id, { isConnected: true, mode });
                // Start sending frames immediately
                requestRef.current = requestAnimationFrame(processFrame);
            };

            ws.onmessage = (event) => {
                // Ignore messages that do not belong to current session
                if (!sessionIdRef.current) return;
                try {
                    const data: WebSocketResponse = JSON.parse(event.data);

                    // Check for errors in response
                    if (data.error) {
                        console.warn(`[CAM-${id}] Server error: ${data.error}`);
                    }

                    const newDetections: Detection[] = [];

                    const serverImage = data.image_size && typeof data.image_size.width === 'number' && typeof data.image_size.height === 'number'
                        ? { width: data.image_size.width, height: data.image_size.height }
                        : undefined;

                    // Unsafe Detections (Car, Motorbike, Fire)
                    if (data.unsafe?.detections && Array.isArray(data.unsafe.detections)) {
                        newDetections.push(...data.unsafe.detections.map((d: any) => ({
                            ...d,
                            type: 'unsafe' as const,
                            // preserve both formats if provided by server
                            bbox: Array.isArray(d.bbox) ? d.bbox as [number, number, number, number] : undefined,
                            bbox_normalized: Array.isArray(d.bbox_normalized) ? d.bbox_normalized as [number, number, number, number] : undefined,
                            serverImageSize: serverImage
                        })));
                    }

                    // Safe Detections (Sitting, Standing, Walking, Yoga)
                    if (data.safe?.detections && Array.isArray(data.safe.detections)) {
                        newDetections.push(...data.safe.detections.map((d: any) => ({
                            ...d,
                            type: 'safe' as const,
                            bbox: Array.isArray(d.bbox) ? d.bbox as [number, number, number, number] : undefined,
                            bbox_normalized: Array.isArray(d.bbox_normalized) ? d.bbox_normalized as [number, number, number, number] : undefined,
                            serverImageSize: serverImage
                        })));
                    }

                    // If session changed while message in-flight, ignore
                    if (!sessionIdRef.current) return;
                    detectionsRef.current = newDetections;

                    // Update risk
                    if (data.risk) {
                        console.debug(`[CAM-${id}] Risk: ${data.risk.level} (${(data.risk.score * 100).toFixed(0)}%)`);
                        onRiskUpdate?.(data.risk);

                        // SAVE TO GLOBAL CONTEXT FOR HISTORY
                        const mapToContext = (d: any) => {
                            // Normalize to DetectionContext.Detection shape with pixel bbox when possible
                            let bbox: [number, number, number, number] = [0, 0, 0, 0];
                            try {
                                if (Array.isArray(d.bbox) && d.bbox.length === 4) {
                                    // If server provided image size, and bbox appears normalized, scale to pixels
                                    if (serverImage && d.bbox.every((n: any) => Math.abs(n) <= 1)) {
                                        bbox = [
                                            Math.round(d.bbox[0] * serverImage.width),
                                            Math.round(d.bbox[1] * serverImage.height),
                                            Math.round(d.bbox[2] * serverImage.width),
                                            Math.round(d.bbox[3] * serverImage.height)
                                        ];
                                    } else {
                                        bbox = [
                                            Number(d.bbox[0]) || 0,
                                            Number(d.bbox[1]) || 0,
                                            Number(d.bbox[2]) || 0,
                                            Number(d.bbox[3]) || 0
                                        ];
                                    }
                                } else if (Array.isArray(d.bbox_normalized) && d.bbox_normalized.length === 4 && serverImage) {
                                    bbox = [
                                        Math.round(d.bbox_normalized[0] * serverImage.width),
                                        Math.round(d.bbox_normalized[1] * serverImage.height),
                                        Math.round(d.bbox_normalized[2] * serverImage.width),
                                        Math.round(d.bbox_normalized[3] * serverImage.height)
                                    ];
                                }
                            } catch (err) {
                                bbox = [0, 0, 0, 0];
                            }

                            return {
                                label: d.label || 'unknown',
                                confidence: typeof d.confidence === 'number' ? d.confidence : Number(d.confidence) || 0,
                                bbox: bbox as [number, number, number, number],
                                type: d.type as ('safe' | 'unsafe') | undefined
                            };
                        };

                        const safeMapped = (data.safe?.detections || []).map((d: any) => mapToContext(d));
                        const unsafeMapped = (data.unsafe?.detections || []).map((d: any) => mapToContext(d));

                        // Only add to global context if session is still current
                        if (sessionIdRef.current) {
                            addDetection({
                                cameraId: id,
                                cameraLabel: label,
                                timestamp: new Date(),
                                safeDetections: safeMapped,
                                unsafeDetections: unsafeMapped,
                                riskLevel: data.risk.level,
                                riskScore: data.risk.score,
                                inferenceTime: data.inference_time_ms || 0
                            });
                        }
                    }

                } catch (e) {
                    console.error(`[CAM-${id}] Error parsing WebSocket data:`, e);
                }
            };

            ws.onclose = () => {
                console.log(`[CAM-${id}] ❌ WebSocket Disconnected`);
                setWsConnected(false);
                onStatusChange?.("offline");
            };

            ws.onerror = (error) => {
                console.error(`[CAM-${id}] WebSocket error:`, error);
                setWsError("Connection failed - check if backend is running");
                onStatusChange?.("offline");
            };

        } catch (err) {
            console.error(`[CAM-${id}] Failed to create WebSocket:`, err);
            setWsError("Failed to connect to backend");
            onStatusChange?.("offline");
        }
    };

    // Configuration: max send dimension and send FPS can be tuned via env
    const MAX_SEND_DIM = Number(import.meta.env.VITE_MAX_SEND_DIM) || 640;
    const SEND_FPS = Number(import.meta.env.VITE_SEND_FPS) || 10; // max frames per second to send
    const lastSendRef = useRef<number>(0);

    const processFrame = useCallback(() => {
        requestRef.current = requestAnimationFrame(processFrame);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ws = wsRef.current;
        if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Display size and DPR-aware canvas sizing
        const rect = canvas.getBoundingClientRect();
        const displayW = Math.max(1, Math.round(rect.width));
        const displayH = Math.max(1, Math.round(rect.height));
        const dpr = window.devicePixelRatio || 1;

        // Set internal pixel size for crisp rendering on hi-dpi
        canvas.width = Math.round(displayW * dpr);
        canvas.height = Math.round(displayH * dpr);
        // Use CSS pixel coordinate system for drawing
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clear using CSS pixels
        ctx.clearRect(0, 0, displayW, displayH);

        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;

        // Compute how the video is fit into the element (object-fit: contain)
        const scale = Math.min(displayW / videoWidth, displayH / videoHeight);
        const drawW = videoWidth * scale;
        const drawH = videoHeight * scale;
        const offsetX = (displayW - drawW) / 2;
        const offsetY = (displayH - drawH) / 2;

        // Throttle frame sending by FPS and downscale before sending to reduce bandwidth
        const now = performance.now();
        const sendInterval = 1000 / SEND_FPS;
        if (now - lastSendRef.current >= sendInterval) {
            lastSendRef.current = now;
            const sendW = videoWidth > videoHeight ? MAX_SEND_DIM : Math.round(MAX_SEND_DIM * (videoWidth / videoHeight));
            const sendH = videoWidth > videoHeight ? Math.round(MAX_SEND_DIM * (videoHeight / videoWidth)) : MAX_SEND_DIM;
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = sendW;
            tempCanvas.height = sendH;
            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
                // Draw the video frame into the downscaled canvas preserving aspect
                tempCtx.drawImage(video, 0, 0, sendW, sendH);
                tempCanvas.toBlob((blob) => {
                    if (blob && ws.readyState === WebSocket.OPEN) {
                        try {
                            ws.send(blob);
                        } catch (err) {
                            console.debug(`[CAM-${id}] Error sending frame:`, err);
                        }
                    }
                }, "image/jpeg", 0.8);
            }
        }

        // Draw latest frame as background (for crisp look we don't redraw video pixels here, only overlays)
        // Draw overlays using detection coordinates transformed to displayed video area.
        // Prefer server-provided `bbox_normalized`; fall back to pixel `bbox` scaled by server `image_size` if available; otherwise maintain legacy heuristic.
        detectionsRef.current.forEach(det => {
            try {
                let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

                if (det.bbox_normalized && det.bbox_normalized.length === 4) {
                    const nb = det.bbox_normalized;
                    x1 = nb[0] * videoWidth;
                    y1 = nb[1] * videoHeight;
                    x2 = nb[2] * videoWidth;
                    y2 = nb[3] * videoHeight;
                } else if (det.bbox && det.bbox.length === 4) {
                    const pb = det.bbox;
                    if (det.serverImageSize && det.serverImageSize.width > 0 && det.serverImageSize.height > 0) {
                        const sxFactor = videoWidth / det.serverImageSize.width;
                        const syFactor = videoHeight / det.serverImageSize.height;
                        x1 = pb[0] * sxFactor;
                        y1 = pb[1] * syFactor;
                        x2 = pb[2] * sxFactor;
                        y2 = pb[3] * syFactor;
                    } else {
                        const maybeNormalized = pb.every(n => Math.abs(n) <= 1);
                        if (maybeNormalized) {
                            x1 = pb[0] * videoWidth;
                            y1 = pb[1] * videoHeight;
                            x2 = pb[2] * videoWidth;
                            y2 = pb[3] * videoHeight;
                        } else {
                            x1 = pb[0];
                            y1 = pb[1];
                            x2 = pb[2];
                            y2 = pb[3];
                        }
                    }
                }

                // Scale to displayed area
                const sx = (x1 * scale) + offsetX;
                const sy = (y1 * scale) + offsetY;
                const sw = ((x2 - x1) * scale);
                const sh = ((y2 - y1) * scale);

                if (sw <= 0 || sh <= 0) return;

                const isSafe = det.type === 'safe' || ["walking", "sitting", "standing", "yoga"].some(s => det.label.toLowerCase().includes(s));
                const color = isSafe ? "#22c55e" : "#ef4444";
                const shadowColor = isSafe ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)";

                // Shadow / glow
                ctx.save();
                ctx.strokeStyle = shadowColor;
                ctx.lineWidth = Math.max(3, 6 * (displayW / 640));
                ctx.strokeRect(sx, sy, sw, sh);
                ctx.restore();

                // Foreground box
                ctx.strokeStyle = color;
                ctx.lineWidth = Math.max(2, 3 * (displayW / 640));
                ctx.strokeRect(sx, sy, sw, sh);

                // Label
                const labelText = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
                const fontSize = Math.max(12, Math.round(14 * (displayW / 640)));
                ctx.font = `bold ${fontSize}px Arial`;
                const textMetrics = ctx.measureText(labelText);
                const padding = 8;
                const textW = textMetrics.width + padding;
                const textH = fontSize + 6;
                const labelX = Math.max(0, sx);
                const labelY = Math.max(textH, sy);

                ctx.fillStyle = color;
                ctx.globalAlpha = 0.9;
                ctx.fillRect(labelX, labelY - textH, textW, textH);
                ctx.globalAlpha = 1;
                ctx.fillStyle = "#ffffff";
                ctx.textBaseline = "middle";
                ctx.fillText(labelText, labelX + padding / 2, labelY - (textH / 2));

            } catch (err) {
                console.debug(`[CAM-${id}] Error drawing detection:`, err);
            }
        });

    }, [id]);

    const handleSaveName = () => {
        onRename(tempName);
        setIsEditingName(false);
    };

    return (
        <div className={`relative bg-black/40 rounded-xl overflow-hidden group border border-border/50 shadow-lg transition-all duration-300 ${isExpanded ? 'h-full' : 'aspect-video'}`}>
            {/* Video Element */}
            <video
                ref={videoRef}
                className={`w-full h-full object-contain bg-black ${mode === "idle" ? "hidden" : "block"}`}
                muted
                playsInline
            />

            {/* Overlay Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Idle State / Controls */}
            {mode === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 transition-all hover:bg-black/50">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/20 hover:text-primary">
                                <Camera className="w-4 h-4" /> Add Source
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Connect Video Source</DialogTitle>
                            </DialogHeader>
                            <Tabs defaultValue="webcam" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="webcam">Webcam</TabsTrigger>
                                    <TabsTrigger value="upload">Upload</TabsTrigger>
                                    <TabsTrigger value="url">URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="webcam" className="space-y-4 pt-4">
                                    <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed rounded-lg">
                                        <Camera className="w-12 h-12 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Use your local camera device</p>
                                        <Button onClick={handleWebcamStart}>Start Webcam</Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="upload" className="space-y-4 pt-4">
                                    <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed rounded-lg">
                                        <Upload className="w-12 h-12 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Select a video file (MP4, WEBM)</p>
                                        <Input type="file" accept="video/*" onChange={handleFileUpload} />
                                    </div>
                                </TabsContent>
                                <TabsContent value="url" className="space-y-4 pt-4">
                                    <div className="flex flex-col gap-4 py-4">
                                        <Input placeholder="rtsp://... or http://..." disabled />
                                        <p className="text-xs text-muted-foreground">RTSP/HTTP handling requires backend proxy. Currently disabled.</p>
                                        <Button disabled>Connect Stream</Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                    {/* Camera Name (Idle) */}
                    <div className="mt-4 flex items-center gap-2">
                        {isEditingName ? (
                            <div className="flex gap-2">
                                <Input
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="h-8 w-32 bg-black/50 border-white/20"
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={handleSaveName}>
                                    <Check className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={() => setIsEditingName(true)}>
                                <p className="text-xs text-muted-foreground font-mono">{label} | OFFLINE</p>
                                <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Active Overlays */}
            {mode !== "idle" && (
                <>
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 items-start">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-red-500 animate-pulse" : "bg-yellow-500"}`} />
                            {isEditingName ? (
                                <div className="flex gap-2 pointer-events-auto">
                                    <Input
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="h-6 w-32 text-xs bg-black/80 border-white/20 text-white"
                                    />
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500 hover:bg-white/10" onClick={handleSaveName}>
                                        <Check className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/10" onClick={() => setIsEditingName(false)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ) : (
                                <span className="text-xs font-mono bg-black/60 px-2 py-1 rounded backdrop-blur-md text-white/90 border border-white/10 flex items-center gap-2 group/label cursor-pointer hover:bg-black/80 transition-colors"
                                    onClick={() => { setTempName(label); setIsEditingName(true); }}>
                                    {label} | {mode.toUpperCase()}
                                    <Edit2 className="w-3 h-3 opacity-0 group-hover/label:opacity-100 transition-opacity" />
                                </span>
                            )}
                        </div>
                    </div>

                    {wsError && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 p-4 rounded-xl flex flex-col items-center gap-2 z-30 border border-destructive/50">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                            <p className="text-destructive font-bold">Connection Failed</p>
                            <Button size="sm" variant="secondary" onClick={connectWebSocket}>Retry</Button>
                        </div>
                    )}

                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                        {/* Convert Toggle Expand button */}
                        <Button
                            size="icon"
                            variant="secondary"
                            className="bg-black/60 hover:bg-black/80 text-white border border-white/10 shadow-lg"
                            onClick={onToggleExpand}
                        >
                            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>

                        <Button
                            size="icon"
                            variant="destructive"
                            className="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={stopStream}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default VideoInput;
