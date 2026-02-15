import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface Detection {
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
    type?: 'safe' | 'unsafe';
}

export interface CameraDetection {
    cameraId: number;
    cameraLabel: string;
    timestamp: Date;
    safeDetections: Detection[];
    unsafeDetections: Detection[];
    riskLevel: 'LOW' | 'HIGH' | 'CRITICAL';
    riskScore: number;
    inferenceTime: number;
}

export interface CameraStream {
    id: number;
    label: string;
    mode: 'idle' | 'webcam' | 'file';
    isConnected: boolean;
    lastDetection?: CameraDetection;
}

interface DetectionContextType {
    // History management
    detectionHistory: CameraDetection[];
    addDetection: (detection: CameraDetection) => void;
    clearHistory: () => void;
    
    // Camera status
    cameras: CameraStream[];
    updateCameraStatus: (cameraId: number, status: Partial<CameraStream>) => void;
    
    // Stats
    totalDetections: number;
    criticalAlerts: number;
    highAlerts: number;
    
    // Real-time stats for dashboard
    activeCameras: number;
    currentRiskLevel: 'LOW' | 'HIGH' | 'CRITICAL';
    systemConfidence: number;
    // Notifications
    notifications: Array<{ id: string; message: string; level: 'LOW'|'HIGH'|'CRITICAL'; ts: number }>;
    clearNotifications: () => void;

    // Alert email settings (admin)
    alertConfig: { enabled: boolean; to: string };
    setAlertConfig: (cfg: { enabled: boolean; to: string }) => Promise<void>;
}

const DetectionContext = createContext<DetectionContextType | undefined>(undefined);

const MAX_HISTORY_SIZE = 1000; // Keep last 1000 detections
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const DetectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [detectionHistory, setDetectionHistory] = useState<CameraDetection[]>([]);
    const [notifications, setNotifications] = useState<Array<{ id: string; message: string; level: 'LOW'|'HIGH'|'CRITICAL'; ts: number }>>([]);
    const [alertConfig, setAlertConfigState] = useState<{ enabled: boolean; to: string }>({ enabled: false, to: '' });
    const [cameras, setCameras] = useState<CameraStream[]>([
        { id: 1, label: 'Cam 1', mode: 'idle', isConnected: false },
        { id: 2, label: 'Cam 2', mode: 'idle', isConnected: false },
        { id: 3, label: 'Cam 3', mode: 'idle', isConnected: false },
        { id: 4, label: 'Cam 4', mode: 'idle', isConnected: false },
    ]);

    const addDetection = useCallback((detection: CameraDetection) => {
        setDetectionHistory(prev => {
            const updated = [detection, ...prev];
            // Keep only last MAX_HISTORY_SIZE detections
            return updated.slice(0, MAX_HISTORY_SIZE);
        });
    }, []);

    const clearHistory = useCallback(() => {
        setDetectionHistory([]);
    }, []);

    const updateCameraStatus = useCallback((cameraId: number, status: Partial<CameraStream>) => {
        setCameras(prev => 
            prev.map(cam => 
                cam.id === cameraId ? { ...cam, ...status } : cam
            )
        );
    }, []);

    // Calculate stats
    const totalDetections = detectionHistory.length;
    const criticalAlerts = detectionHistory.filter(d => d.riskLevel === 'CRITICAL').length;
    const highAlerts = detectionHistory.filter(d => d.riskLevel === 'HIGH').length;
    const activeCameras = cameras.filter(c => c.isConnected).length;
    
    // Current risk level (highest priority)
    const currentRiskLevel = 
        detectionHistory.some(d => d.riskLevel === 'CRITICAL') ? 'CRITICAL' :
        detectionHistory.some(d => d.riskLevel === 'HIGH') ? 'HIGH' :
        'LOW';
    
    // System confidence (average of last 10 detections)
    const systemConfidence = detectionHistory.length > 0
        ? (detectionHistory.slice(0, 10).reduce((sum, d) => {
            const avgConf = [...d.safeDetections, ...d.unsafeDetections].length > 0
                ? [...d.safeDetections, ...d.unsafeDetections].reduce((s, det) => s + det.confidence, 0) /
                  [...d.safeDetections, ...d.unsafeDetections].length
                : 0;
            return sum + avgConf;
        }, 0) / Math.min(10, detectionHistory.length)) * 100
        : 0;

    const value: DetectionContextType = {
        detectionHistory,
        addDetection,
        clearHistory,
        cameras,
        updateCameraStatus,
        totalDetections,
        criticalAlerts,
        highAlerts,
        activeCameras,
        currentRiskLevel,
        systemConfidence: Math.round(systemConfidence),
        notifications,
        clearNotifications: () => setNotifications([]),
        alertConfig,
        setAlertConfig: async (cfg) => {
            // Update backend config
            try {
                const res = await fetch(`${API_URL}/alerts/config`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cfg)
                });
                if (res.ok) {
                    setAlertConfigState(cfg);
                } else {
                    console.warn('Failed to update alert config', await res.text());
                }
            } catch (e) {
                console.debug('Error updating alert config', e);
            }
        }
    };

    // Effects inside provider: initialize alertConfig, aggregate notifications, and send emails
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}/alerts/config`);
                if (res.ok) {
                    const data = await res.json();
                    setAlertConfigState({ enabled: !!data.enabled, to: data.to || '' });
                }
            } catch (e) {
                console.debug('Failed to load alerts config', e);
            }
        })();
    }, []);

    // Notification aggregation every 20s
    useEffect(() => {
        const id = setInterval(() => {
            const now = Date.now();
            const windowStart = now - 20_000;
            const recent = detectionHistory.filter(d => new Date(d.timestamp).getTime() >= windowStart && (d.riskLevel === 'HIGH' || d.riskLevel === 'CRITICAL'));
            if (recent.length === 0) return;
            const msgs = recent.slice(0, 4).map(r => ({ id: `${r.cameraId}_${new Date(r.timestamp).getTime()}`, message: `${r.cameraLabel}: ${r.riskLevel} - ${r.safeDetections.length + r.unsafeDetections.length} events`, level: r.riskLevel, ts: new Date(r.timestamp).getTime() }));
            setNotifications(prev => {
                const combined = [...msgs, ...prev];
                const unique: typeof combined = [];
                const seen = new Set<string>();
                for (const m of combined) {
                    if (!seen.has(m.id)) {
                        unique.push(m);
                        seen.add(m.id);
                    }
                    if (unique.length >= 4) break;
                }
                return unique;
            });
        }, 20_000);
        return () => clearInterval(id);
    }, [detectionHistory]);

    // Email alerts every 30s for CRITICAL events
    useEffect(() => {
        const id = setInterval(async () => {
            try {
                if (!activeCameras || activeCameras === 0) return;
                const now = Date.now();
                const windowStart = now - 30_000;
                const recentCritical = detectionHistory.filter(d => new Date(d.timestamp).getTime() >= windowStart && d.riskLevel === 'CRITICAL');
                if (recentCritical.length === 0) return;
                if (!alertConfig.enabled) return;

                const subject = `Vision Safe - CRITICAL alert (${recentCritical.length})`;
                const body = recentCritical.map(d => `${d.cameraLabel} @ ${new Date(d.timestamp).toLocaleTimeString()}: ${d.riskLevel} (safe:${d.safeDetections.length}, unsafe:${d.unsafeDetections.length})`).join('\n');
                await fetch(`${API_URL}/notify/email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, body, to: alertConfig.to || undefined }) });
            } catch (e) {
                console.debug('Email alert dispatch failed', e);
            }
        }, 30_000);
        return () => clearInterval(id);
    }, [detectionHistory, activeCameras, alertConfig]);

    return (
        <DetectionContext.Provider value={value}>
            {children}
        </DetectionContext.Provider>
    );
};

export const useDetectionContext = (): DetectionContextType => {
    const context = useContext(DetectionContext);
    if (!context) {
        throw new Error('useDetectionContext must be used within DetectionProvider');
    }
    return context;
};
