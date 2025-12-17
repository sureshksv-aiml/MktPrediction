-- ADK DatabaseSessionService required tables
-- These tables are used by Google ADK for session persistence

-- App states table (stores global app state)
CREATE TABLE IF NOT EXISTS app_states (
    app_name VARCHAR(255) PRIMARY KEY,
    state JSONB DEFAULT '{}',
    update_time TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (stores user sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    state JSONB DEFAULT '{}',
    create_time TIMESTAMPTZ DEFAULT NOW(),
    update_time TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (app_name, user_id, id)
);

-- Events table (stores session events/messages)
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(255) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    invocation_id VARCHAR(255),
    author VARCHAR(255),
    branch VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    content JSONB,
    actions JSONB,
    PRIMARY KEY (app_name, user_id, session_id, id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_app ON sessions(app_name);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_invocation ON events(invocation_id);
