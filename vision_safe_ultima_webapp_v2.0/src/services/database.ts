
// Mock database service for build pass
// TODO: Connect to FastAPI backend

// ==================== TYPES ====================
export type RiskLevel = 'LOW' | 'HIGH' | 'CRITICAL';
export type AlertType = 'FIRE' | 'VIOLENCE' | 'UNAUTHORIZED' | 'WEAPON' | 'SAFETY_VIOLATION';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
export type ActivityType = 'Safe' | 'Unsafe' | 'None';

export interface DetectionLog {
    id: string;
    camera_id: string;
    risk_level: RiskLevel;
    risk_score: number;
    detected_objects: string[];
    activity: ActivityType;
    snapshot_url?: string;
    timestamp: string; // ISO string
}

export interface Alert {
    id: string;
    log_id: string;
    type: AlertType;
    status: AlertStatus;
    assigned_to?: string; // User ID
    created_at: string; // ISO string
    log?: DetectionLog;
}

// ==================== DATABASE SERVICE ====================
export const dbService = {
    getLogs: async (_limit = 100): Promise<DetectionLog[]> => {
        return [];
    },

    getLogsByCamera: async (_cameraId: string, _limit = 50): Promise<DetectionLog[]> => {
        return [];
    },

    getAlerts: async (_limit = 100): Promise<Alert[]> => {
        return [];
    },

    updateAlertStatus: async (_alertId: string, _status: AlertStatus): Promise<boolean> => {
        return true;
    },

    insertLog: async (log: Omit<DetectionLog, 'id'>): Promise<DetectionLog | null> => {
        return {
            id: 'mock-id',
            ...log
        };
    },

    deleteLog: async (_logId: string): Promise<boolean> => {
        return true;
    },

    healthCheck: async (): Promise<boolean> => {
        return true;
    },
};
