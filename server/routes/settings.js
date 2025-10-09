const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Middleware admin uniquement
const adminOnly = (req, res, next) => {
    const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
    db.close();
    
    if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Accès interdit - Admin uniquement' });
    }
    
    next();
};

// Récupérer tous les paramètres (public)
router.get('/', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const settings = db.prepare('SELECT setting_key, setting_value FROM app_settings').all();
        
        db.close();
        
        // Convertir en objet
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
        });
        
        res.json(settingsObj);
    } catch (error) {
        console.error('Erreur récupération paramètres:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Mettre à jour un paramètre (admin uniquement)
router.put('/:key', authMiddleware, adminOnly, (req, res) => {
    try {
        const { value } = req.body;
        const { key } = req.params;
        
        if (!value) {
            return res.status(400).json({ error: 'Valeur requise' });
        }
        
        // Valider les codes couleur
        if (key.includes('color') && !/^#[0-9A-F]{6}$/i.test(value)) {
            return res.status(400).json({ error: 'Code couleur invalide (format: #RRGGBB)' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que la clé existe
        const setting = db.prepare('SELECT id FROM app_settings WHERE setting_key = ?').get(key);
        
        if (!setting) {
            db.close();
            return res.status(404).json({ error: 'Paramètre non trouvé' });
        }
        
        // Mettre à jour
        db.prepare(`
            UPDATE app_settings 
            SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = ?
        `).run(value, req.user.id, key);
        
        db.close();
        
        res.json({ message: 'Paramètre mis à jour', key, value });
    } catch (error) {
        console.error('Erreur mise à jour paramètre:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Mettre à jour plusieurs paramètres en une fois (admin uniquement)
router.post('/bulk', authMiddleware, adminOnly, (req, res) => {
    try {
        const { settings } = req.body;
        
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Paramètres invalides' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const updateStmt = db.prepare(`
            UPDATE app_settings 
            SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = ?
        `);
        
        const transaction = db.transaction((settingsObj, userId) => {
            for (const [key, value] of Object.entries(settingsObj)) {
                // Valider les codes couleur
                if (key.includes('color') && !/^#[0-9A-F]{6}$/i.test(value)) {
                    throw new Error(`Code couleur invalide pour ${key}: ${value}`);
                }
                updateStmt.run(value, userId, key);
            }
        });
        
        try {
            transaction(settings, req.user.id);
            db.close();
            res.json({ message: 'Paramètres mis à jour', count: Object.keys(settings).length });
        } catch (error) {
            db.close();
            throw error;
        }
    } catch (error) {
        console.error('Erreur mise à jour bulk:', error);
        res.status(400).json({ error: error.message });
    }
});

// Réinitialiser aux valeurs par défaut (admin uniquement)
router.post('/reset', authMiddleware, adminOnly, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const defaultSettings = [
            ['primary_color', '#D4AF37'],
            ['secondary_color', '#000000'],
            ['accent_color', '#FFFFFF'],
            ['background_color', '#0A0A0A'],
            ['card_background', '#1A1A1A'],
            ['text_primary', '#FFFFFF'],
            ['text_secondary', '#CCCCCC'],
            ['success_color', '#10B981'],
            ['warning_color', '#F59E0B'],
            ['danger_color', '#EF4444']
        ];
        
        const updateStmt = db.prepare(`
            UPDATE app_settings 
            SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = ?
        `);
        
        const transaction = db.transaction((settings, userId) => {
            settings.forEach(([key, value]) => {
                updateStmt.run(value, userId, key);
            });
        });
        
        transaction(defaultSettings, req.user.id);
        db.close();
        
        res.json({ message: 'Paramètres réinitialisés aux valeurs par défaut' });
    } catch (error) {
        console.error('Erreur réinitialisation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
