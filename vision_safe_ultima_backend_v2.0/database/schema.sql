-- Vision Safe Ultima - Database Schema (Turso/SQLite)
-- SQLite-compatible version

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- UUID from Clerk
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    organization TEXT,
    subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise')),
    trial_end_date TEXT,  -- ISO 8601 format
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'trial_expired', 'cancelled')),
    max_cameras INTEGER DEFAULT 2,
    max_monitoring_hours_per_month INTEGER DEFAULT 10,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Cameras table
CREATE TABLE IF NOT EXISTS cameras (
    camera_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    camera_name TEXT NOT NULL,
    camera_description TEXT,
    camera_location TEXT,
    camera_type TEXT NOT NULL CHECK (camera_type IN ('webcam', 'ip_camera', 'rtsp_stream', 'uploaded_video')),
    rtsp_url TEXT,
    is_active INTEGER DEFAULT 1,  -- SQLite uses INTEGER for boolean
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'maintenance')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Profiles table (Sub-accounts)
CREATE TABLE IF NOT EXISTS profiles (
    profile_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,         -- Links to main Clerk account (users.id)
    name TEXT NOT NULL,
    avatar_url TEXT,
    is_main INTEGER DEFAULT 0,     -- 1 for the main account holder
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    profile_id TEXT,               -- Link to specific profile
    camera_id TEXT NOT NULL,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    duration_seconds INTEGER,
    session_type TEXT DEFAULT 'live' CHECK (session_type IN ('live', 'recorded', 'scheduled')),
    total_frames_processed INTEGER DEFAULT 0,
    frames_with_detections INTEGER DEFAULT 0,
    total_alerts_triggered INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'error', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE SET NULL,
    FOREIGN KEY (camera_id) REFERENCES cameras(camera_id) ON DELETE CASCADE
);

-- Detections table
CREATE TABLE IF NOT EXISTS detections (
    detection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    profile_id TEXT,               -- Link to specific profile
    timestamp TEXT DEFAULT (datetime('now')),
    frame_number INTEGER NOT NULL,
    detection_category TEXT NOT NULL CHECK (detection_category IN ('safe', 'unsafe')),
    activity_type TEXT CHECK (activity_type IN ('person_walking', 'person_sitting', 'person_standing', 'person_yoga', NULL)),
    activity_confidence REAL,
    hazard_type TEXT CHECK (hazard_type IN ('fire', 'vehicle_car', 'vehicle_motorbike', NULL)),
    hazard_confidence REAL,
    bbox_x_min REAL,
    bbox_y_min REAL,
    bbox_x_max REAL,
    bbox_y_max REAL,
    risk_score REAL,
    risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE SET NULL
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    detection_id INTEGER,
    user_id TEXT NOT NULL,
    profile_id TEXT,               -- Link to specific profile
    timestamp TEXT DEFAULT (datetime('now')),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_at TEXT,
    resolved INTEGER DEFAULT 0,
    resolved_at TEXT,
    snapshot_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cameras_user_id ON cameras(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_profile_id ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_camera_id ON sessions(camera_id);
CREATE INDEX IF NOT EXISTS idx_detections_session_id ON detections(session_id);
CREATE INDEX IF NOT EXISTS idx_detections_profile_id ON detections(profile_id);
CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_profile_id ON alerts(profile_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
