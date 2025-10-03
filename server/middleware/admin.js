const Database = require('better-sqlite3');
const path = require('path');

const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    
    const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
    const user = db.prepare('SELECT is_admin, is_banned FROM users WHERE id = ?').get(req.user.id);
    db.close();
    
    if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Accès refusé - Droits admin requis' });
    }
    
    if (user.is_banned) {
        return res.status(403).json({ error: 'Compte banni' });
    }
    
    next();
};

// Middleware pour logger les actions admin
const auditLog = (action, targetType) => {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        
        res.json = (data) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
                const targetId = req.params.id || req.params.userId || req.params.photoId || 0;
                
                db.prepare(`
                    INSERT INTO admin_audit (admin_id, action, target_type, target_id, details, ip_address)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    req.user.id,
                    action,
                    targetType,
                    targetId,
                    JSON.stringify(req.body || {}),
                    req.ip
                );
                
                db.close();
            }
            
            return originalJson(data);
        };
        
        next();
    };
};

module.exports = { adminMiddleware, auditLog };
