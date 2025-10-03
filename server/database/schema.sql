-- Table utilisateurs et admins
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    is_banned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    total_points INTEGER DEFAULT 0
);

-- Table thématiques
CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table défis
CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theme_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty INTEGER NOT NULL CHECK(difficulty >= 1 AND difficulty <= 5),
    points INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);

-- Table photos avec modération
CREATE TABLE IF NOT EXISTS challenge_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    caption TEXT,
    status TEXT DEFAULT 'visible' CHECK(status IN ('visible', 'hidden', 'pending')),
    flag_count INTEGER DEFAULT 0,
    flagged_at DATETIME,
    flag_reason TEXT,
    moderated_by INTEGER,
    moderated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id)
);

-- Table progression utilisateurs
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    photo_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES challenge_photos(id) ON DELETE SET NULL,
    UNIQUE(user_id, challenge_id)
);

-- Table audit admin
CREATE TABLE IF NOT EXISTS admin_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_photos_challenge ON challenge_photos(challenge_id);
CREATE INDEX IF NOT EXISTS idx_photos_user ON challenge_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON challenge_photos(status);
CREATE INDEX IF NOT EXISTS idx_photos_flagged ON challenge_photos(flag_count) WHERE flag_count > 0;
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_challenge ON user_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit(created_at);
