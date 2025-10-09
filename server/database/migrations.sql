-- Migration pour ajouter les nouvelles fonctionnalités
-- Exécution: node server/database/migrate.js

-- 1. Ajouter le support vidéo
ALTER TABLE challenge_photos ADD COLUMN media_type TEXT DEFAULT 'image' CHECK(media_type IN ('image', 'video'));
ALTER TABLE challenge_photos ADD COLUMN video_duration INTEGER;
ALTER TABLE challenge_photos ADD COLUMN thumbnail_filename TEXT;

-- 2. Table des commentaires
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER,
    status TEXT DEFAULT 'visible' CHECK(status IN ('visible', 'hidden')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (photo_id) REFERENCES challenge_photos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_photo ON comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- 3. Table des likes sur les photos/vidéos
CREATE TABLE IF NOT EXISTS photo_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES challenge_photos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(photo_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_photo ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON photo_likes(user_id);

-- 4. Table pour les suivis entre utilisateurs
CREATE TABLE IF NOT EXISTS user_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);

-- 5. Table des paramètres de l'application (couleurs personnalisables)
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Paramètres par défaut
INSERT OR IGNORE INTO app_settings (setting_key, setting_value) VALUES
    ('primary_color', '#D4AF37'),
    ('secondary_color', '#000000'),
    ('accent_color', '#FFFFFF'),
    ('background_color', '#0A0A0A'),
    ('card_background', '#1A1A1A'),
    ('text_primary', '#FFFFFF'),
    ('text_secondary', '#CCCCCC'),
    ('success_color', '#10B981'),
    ('warning_color', '#F59E0B'),
    ('danger_color', '#EF4444');

-- 6. Ajouter champs pour le profil utilisateur enrichi
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN website TEXT;
ALTER TABLE users ADD COLUMN followers_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0;

-- 7. Table des badges/achievements
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);
