import { supabase } from '@/lib/supabaseClient';

// ==================== TYPES ====================
// Standardized risk levels (3 levels only: LOW, HIGH, CRITICAL)
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

// ==================== CONSTANTS ====================
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// ==================== UTILITY FUNCTIONS ====================
async function retryAsync<T>(
    fn: () => Promise<T>,
    attempts = MAX_RETRY_ATTEMPTS
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (i < attempts - 1) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }
    
    throw lastError || new Error('Max retries reached');
}

// ==================== DATABASE SERVICE ====================
export const dbService = {
    /**
     * Get all detection logs from Supabase, sorted by timestamp (newest first)
     */
    getLogs: async (limit = 100): Promise<DetectionLog[]> => {
        try {
            return await retryAsync(async () => {
                const { data, error } = await supabase
                    .from('detection_logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(limit);

                if (error) {
                    console.error('Supabase error fetching logs:', error);
                    throw new Error(`Failed to fetch logs: ${error.message}`);
                }

                return (data || []).map(log => ({
                    id: log.id,
                    camera_id: log.camera_id,
                    risk_level: log.risk_level as RiskLevel,
                    risk_score: log.risk_score,
                    detected_objects: log.detected_objects || [],
                    activity: log.activity || 'None',
                    snapshot_url: log.snapshot_url,
                    timestamp: log.timestamp,
                }));
            });
        } catch (error) {
            console.error('Database service error (getLogs):', error);
            return []; // Return empty array on error
        }
    },

    /**
     * Get logs for a specific camera
     */
    getLogsByCamera: async (cameraId: string, limit = 50): Promise<DetectionLog[]> => {
        try {
            return await retryAsync(async () => {
                const { data, error } = await supabase
                    .from('detection_logs')
                    .select('*')
                    .eq('camera_id', cameraId)
                    .order('timestamp', { ascending: false })
                    .limit(limit);

                if (error) {
                    throw new Error(`Failed to fetch camera logs: ${error.message}`);
                }

                return (data || []).map(log => ({
                    id: log.id,
                    camera_id: log.camera_id,
                    risk_level: log.risk_level as RiskLevel,
                    risk_score: log.risk_score,
                    detected_objects: log.detected_objects || [],
                    activity: log.activity || 'None',
                    snapshot_url: log.snapshot_url,
                    timestamp: log.timestamp,
                }));
            });
        } catch (error) {
            console.error(`Database service error (getLogsByCamera ${cameraId}):`, error);
            return [];
        }
    },

    /**
     * Get all alerts with joined detection log data
     */
    getAlerts: async (limit = 100): Promise<Alert[]> => {
        try {
            return await retryAsync(async () => {
                const { data, error } = await supabase
                    .from('alerts')
                    .select(`
                        *,
                        log:detection_logs(*)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) {
                    throw new Error(`Failed to fetch alerts: ${error.message}`);
                }

                return (data || []).map(alert => ({
                    id: alert.id,
                    log_id: alert.log_id,
                    type: alert.type as AlertType,
                    status: alert.status as AlertStatus,
                    assigned_to: alert.assigned_to,
                    created_at: alert.created_at,
                    log: alert.log ? {
                        id: alert.log.id,
                        camera_id: alert.log.camera_id,
                        risk_level: alert.log.risk_level as RiskLevel,
                        risk_score: alert.log.risk_score,
                        detected_objects: alert.log.detected_objects || [],
                        activity: alert.log.activity || 'None',
                        snapshot_url: alert.log.snapshot_url,
                        timestamp: alert.log.timestamp,
                    } : undefined,
                }));
            });
        } catch (error) {
            console.error('Database service error (getAlerts):', error);
            return [];
        }
    },

    /**
     * Update alert status
     */
    updateAlertStatus: async (alertId: string, status: AlertStatus): Promise<boolean> => {
        try {
            return await retryAsync(async () => {
                const { error } = await supabase
                    .from('alerts')
                    .update({ status })
                    .eq('id', alertId);

                if (error) {
                    throw new Error(`Failed to update alert: ${error.message}`);
                }

                return true;
            });
        } catch (error) {
            console.error('Database service error (updateAlertStatus):', error);
            return false;
        }
    },

    /**
     * Insert a new detection log
     * Automatically creates an alert if risk is HIGH or CRITICAL
     */
    insertLog: async (log: Omit<DetectionLog, 'id'>): Promise<DetectionLog | null> => {
        try {
            return await retryAsync(async () => {
                // Validate risk level
                if (!['LOW', 'HIGH', 'CRITICAL'].includes(log.risk_level)) {
                    throw new Error(`Invalid risk level: ${log.risk_level}`);
                }

                // Insert the detection log
                const { data: insertedLog, error: logError } = await supabase
                    .from('detection_logs')
                    .insert({
                        camera_id: log.camera_id,
                        risk_level: log.risk_level,
                        risk_score: Math.min(Math.max(log.risk_score, 0), 1), // Clamp 0-1
                        detected_objects: log.detected_objects,
                        activity: log.activity,
                        snapshot_url: log.snapshot_url,
                        timestamp: log.timestamp,
                    })
                    .select()
                    .single();

                if (logError) {
                    throw new Error(`Failed to insert log: ${logError.message}`);
                }

                // Auto-create alert if HIGH or CRITICAL risk
                if (log.risk_level !== 'LOW') {
                    const alertType = determineAlertType(log.detected_objects);
                    
                    const { error: alertError } = await supabase
                        .from('alerts')
                        .insert({
                            log_id: insertedLog.id,
                            type: alertType,
                            status: 'NEW',
                            created_at: log.timestamp,
                        })
                        .select()
                        .single();

                    if (alertError) {
                        console.warn('Warning: Alert creation failed, but log was saved:', alertError);
                        // Don't throw - log was successfully inserted
                    }
                }

                return insertedLog;
            });
        } catch (error) {
            console.error('Database service error (insertLog):', error);
            return null;
        }
    },

    /**
     * Delete a log and its associated alerts
     */
    deleteLog: async (logId: string): Promise<boolean> => {
        try {
            return await retryAsync(async () => {
                // Delete alerts first
                await supabase
                    .from('alerts')
                    .delete()
                    .eq('log_id', logId);

                // Delete log
                const { error } = await supabase
                    .from('detection_logs')
                    .delete()
                    .eq('id', logId);

                if (error) {
                    throw new Error(`Failed to delete log: ${error.message}`);
                }

                return true;
            });
        } catch (error) {
            console.error('Database service error (deleteLog):', error);
            return false;
        }
    },

    /**
     * Check database connection
     */
    healthCheck: async (): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('detection_logs')
                .select('id')
                .limit(1);

            return !error;
        } catch {
            return false;
        }
    },
};

// ==================== HELPER FUNCTIONS ====================
function determineAlertType(detectedObjects: string[]): AlertType {
    const objectsStr = detectedObjects.join(' ').toLowerCase();
    
    if (objectsStr.includes('fire')) {
        return 'FIRE';
    }
    if (objectsStr.includes('weapon')) {
        return 'WEAPON';
    }
    if (objectsStr.includes('violence') || objectsStr.includes('fight')) {
        return 'VIOLENCE';
    }
    if (objectsStr.includes('vehicle') || objectsStr.includes('car') || objectsStr.includes('motorbike')) {
        return 'UNAUTHORIZED';
    }
    
    return 'SAFETY_VIOLATION';
}
