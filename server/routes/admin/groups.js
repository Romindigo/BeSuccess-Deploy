const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../../middleware/auth');
const { adminMiddleware, auditLog } = require('../../middleware/admin');
const { sanitizeInput } = require('../../utils/validation');

const router = express.Router();

// Toutes les routes nécessitent auth + admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Lister tous les groupes
router.get('/', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const groups = db.prepare(`
            SELECT 
                dg.*,
                u.username as creator_name,
                COUNT(DISTINCT gm.id) as members_count,
                COUNT(DISTINCT gme.id) as messages_count
            FROM discussion_groups dg
            LEFT JOIN users u ON dg.created_by = u.id
            LEFT JOIN group_members gm ON dg.id = gm.group_id
            LEFT JOIN group_messages gme ON dg.id = gme.group_id AND gme.status = 'visible'
            GROUP BY dg.id
            ORDER BY dg.created_at DESC
        `).all();
        
        db.close();
        
        res.json(groups);
    } catch (error) {
        console.error('Erreur liste groupes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer un nouveau groupe
router.post('/', auditLog('CREATE_GROUP', 'discussion_group'), (req, res) => {
    try {
        const { name, description, icon, color, is_public, max_members } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Le nom du groupe est requis' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const result = db.prepare(`
            INSERT INTO discussion_groups (name, description, icon, color, is_public, max_members, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            sanitizeInput(name),
            sanitizeInput(description || ''),
            sanitizeInput(icon || '💬'),
            sanitizeInput(color || '#D4AF37'),
            is_public ? 1 : 0,
            max_members || 0,
            req.user.id
        );
        
        // Ajouter automatiquement le créateur comme admin du groupe
        db.prepare(`
            INSERT INTO group_members (group_id, user_id, role)
            VALUES (?, ?, 'admin')
        `).run(result.lastInsertRowid, req.user.id);
        
        db.close();
        
        res.json({
            message: 'Groupe créé avec succès',
            group: {
                id: result.lastInsertRowid,
                name: sanitizeInput(name),
                description: sanitizeInput(description || ''),
                icon: sanitizeInput(icon || '💬'),
                color: sanitizeInput(color || '#D4AF37'),
                is_public: is_public ? 1 : 0,
                max_members: max_members || 0
            }
        });
    } catch (error) {
        console.error('Erreur création groupe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Détails d'un groupe
router.get('/:groupId', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const group = db.prepare(`
            SELECT 
                dg.*,
                u.username as creator_name,
                COUNT(DISTINCT gm.id) as members_count,
                COUNT(DISTINCT gme.id) as messages_count
            FROM discussion_groups dg
            LEFT JOIN users u ON dg.created_by = u.id
            LEFT JOIN group_members gm ON dg.id = gm.group_id
            LEFT JOIN group_messages gme ON dg.id = gme.group_id AND gme.status = 'visible'
            WHERE dg.id = ?
            GROUP BY dg.id
        `).get(req.params.groupId);
        
        if (!group) {
            db.close();
            return res.status(404).json({ error: 'Groupe non trouvé' });
        }
        
        // Récupérer les membres
        const members = db.prepare(`
            SELECT 
                gm.id,
                gm.role,
                gm.joined_at,
                u.id as user_id,
                u.username,
                u.avatar_url,
                u.total_points
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = ?
            ORDER BY gm.joined_at DESC
        `).all(req.params.groupId);
        
        group.members = members;
        
        db.close();
        
        res.json(group);
    } catch (error) {
        console.error('Erreur détails groupe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Modifier un groupe
router.patch('/:groupId', auditLog('UPDATE_GROUP', 'discussion_group'), (req, res) => {
    try {
        const { name, description, icon, color, is_public, max_members } = req.body;
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const group = db.prepare('SELECT id FROM discussion_groups WHERE id = ?').get(req.params.groupId);
        if (!group) {
            db.close();
            return res.status(404).json({ error: 'Groupe non trouvé' });
        }
        
        db.prepare(`
            UPDATE discussion_groups 
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                icon = COALESCE(?, icon),
                color = COALESCE(?, color),
                is_public = COALESCE(?, is_public),
                max_members = COALESCE(?, max_members),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            name ? sanitizeInput(name) : null,
            description !== undefined ? sanitizeInput(description) : null,
            icon ? sanitizeInput(icon) : null,
            color ? sanitizeInput(color) : null,
            is_public !== undefined ? (is_public ? 1 : 0) : null,
            max_members !== undefined ? max_members : null,
            req.params.groupId
        );
        
        db.close();
        
        res.json({ message: 'Groupe mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour groupe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un groupe
router.delete('/:groupId', auditLog('DELETE_GROUP', 'discussion_group'), (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const group = db.prepare('SELECT id FROM discussion_groups WHERE id = ?').get(req.params.groupId);
        if (!group) {
            db.close();
            return res.status(404).json({ error: 'Groupe non trouvé' });
        }
        
        db.prepare('DELETE FROM discussion_groups WHERE id = ?').run(req.params.groupId);
        
        db.close();
        
        res.json({ message: 'Groupe supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression groupe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Ajouter un membre à un groupe
router.post('/:groupId/members', auditLog('ADD_GROUP_MEMBER', 'group_member'), (req, res) => {
    try {
        const { user_id, role } = req.body;
        
        if (!user_id) {
            return res.status(400).json({ error: 'ID utilisateur requis' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que le groupe existe
        const group = db.prepare('SELECT id, max_members FROM discussion_groups WHERE id = ?').get(req.params.groupId);
        if (!group) {
            db.close();
            return res.status(404).json({ error: 'Groupe non trouvé' });
        }
        
        // Vérifier que l'utilisateur existe
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
        if (!user) {
            db.close();
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Vérifier si le groupe a atteint le nombre maximum de membres
        if (group.max_members > 0) {
            const memberCount = db.prepare('SELECT COUNT(*) as count FROM group_members WHERE group_id = ?').get(req.params.groupId).count;
            if (memberCount >= group.max_members) {
                db.close();
                return res.status(400).json({ error: 'Le groupe a atteint le nombre maximum de membres' });
            }
        }
        
        // Vérifier si l'utilisateur est déjà membre
        const existingMember = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.groupId, user_id);
        if (existingMember) {
            db.close();
            return res.status(400).json({ error: 'Cet utilisateur est déjà membre du groupe' });
        }
        
        db.prepare(`
            INSERT INTO group_members (group_id, user_id, role)
            VALUES (?, ?, ?)
        `).run(req.params.groupId, user_id, role || 'member');
        
        db.close();
        
        res.json({ message: 'Membre ajouté avec succès' });
    } catch (error) {
        console.error('Erreur ajout membre:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Retirer un membre d'un groupe
router.delete('/:groupId/members/:memberId', auditLog('REMOVE_GROUP_MEMBER', 'group_member'), (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const member = db.prepare('SELECT id FROM group_members WHERE id = ? AND group_id = ?').get(req.params.memberId, req.params.groupId);
        if (!member) {
            db.close();
            return res.status(404).json({ error: 'Membre non trouvé' });
        }
        
        db.prepare('DELETE FROM group_members WHERE id = ?').run(req.params.memberId);
        
        db.close();
        
        res.json({ message: 'Membre retiré avec succès' });
    } catch (error) {
        console.error('Erreur retrait membre:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Statistiques des groupes
router.get('/stats/overview', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const stats = {
            total_groups: db.prepare('SELECT COUNT(*) as count FROM discussion_groups').get().count,
            total_members: db.prepare('SELECT COUNT(*) as count FROM group_members').get().count,
            total_messages: db.prepare('SELECT COUNT(*) as count FROM group_messages WHERE status = "visible"').get().count,
            public_groups: db.prepare('SELECT COUNT(*) as count FROM discussion_groups WHERE is_public = 1').get().count,
            private_groups: db.prepare('SELECT COUNT(*) as count FROM discussion_groups WHERE is_public = 0').get().count
        };
        
        db.close();
        
        res.json(stats);
    } catch (error) {
        console.error('Erreur stats groupes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
