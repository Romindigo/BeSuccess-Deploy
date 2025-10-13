const express = require('express');
const Database = require('better-sqlite3');
const authMiddleware = require('../middleware/auth');
const { sanitizeInput } = require('../utils/validation');

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Lister les groupes publics
router.get('/', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const groups = db.prepare(`
            SELECT 
                dg.*,
                u.username as creator_name,
                COUNT(DISTINCT gm.id) as members_count,
                (SELECT COUNT(*) FROM group_members WHERE group_id = dg.id AND user_id = ?) as is_member
            FROM discussion_groups dg
            LEFT JOIN users u ON dg.created_by = u.id
            LEFT JOIN group_members gm ON dg.id = gm.group_id
            WHERE dg.is_public = 1 OR EXISTS (
                SELECT 1 FROM group_members WHERE group_id = dg.id AND user_id = ?
            )
            GROUP BY dg.id
            ORDER BY dg.created_at DESC
        `).all(req.user.id, req.user.id);
        
        db.close();
        
        res.json(groups);
    } catch (error) {
        console.error('Erreur liste groupes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Mes groupes
router.get('/my-groups', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const groups = db.prepare(`
            SELECT 
                dg.*,
                u.username as creator_name,
                gm.role as my_role,
                COUNT(DISTINCT gm2.id) as members_count,
                (SELECT content FROM group_messages WHERE group_id = dg.id AND status = 'visible' ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM group_messages WHERE group_id = dg.id AND status = 'visible' ORDER BY created_at DESC LIMIT 1) as last_message_at
            FROM group_members gm
            JOIN discussion_groups dg ON gm.group_id = dg.id
            LEFT JOIN users u ON dg.created_by = u.id
            LEFT JOIN group_members gm2 ON dg.id = gm2.group_id
            WHERE gm.user_id = ?
            GROUP BY dg.id
            ORDER BY last_message_at DESC NULLS LAST
        `).all(req.user.id);
        
        db.close();
        
        res.json(groups);
    } catch (error) {
        console.error('Erreur mes groupes:', error);
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
                (SELECT role FROM group_members WHERE group_id = dg.id AND user_id = ?) as my_role
            FROM discussion_groups dg
            LEFT JOIN users u ON dg.created_by = u.id
            LEFT JOIN group_members gm ON dg.id = gm.group_id
            WHERE dg.id = ?
            GROUP BY dg.id
        `).get(req.user.id, req.params.groupId);
        
        if (!group) {
            db.close();
            return res.status(404).json({ error: 'Groupe non trouvé' });
        }
        
        // Vérifier si l'utilisateur a accès au groupe
        if (!group.is_public && !group.my_role) {
            db.close();
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        
        db.close();
        
        res.json(group);
    } catch (error) {
        console.error('Erreur détails groupe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Rejoindre un groupe
router.post('/:groupId/join', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const group = db.prepare('SELECT id, is_public, max_members FROM discussion_groups WHERE id = ?').get(req.params.groupId);
        if (!group) {
            db.close();
            return res.status(404).json({ error: 'Groupe non trouvé' });
        }
        
        // Vérifier si le groupe est public
        if (!group.is_public) {
            db.close();
            return res.status(403).json({ error: 'Ce groupe est privé' });
        }
        
        // Vérifier si déjà membre
        const existingMember = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.groupId, req.user.id);
        if (existingMember) {
            db.close();
            return res.status(400).json({ error: 'Vous êtes déjà membre de ce groupe' });
        }
        
        // Vérifier le nombre maximum de membres
        if (group.max_members > 0) {
            const memberCount = db.prepare('SELECT COUNT(*) as count FROM group_members WHERE group_id = ?').get(req.params.groupId).count;
            if (memberCount >= group.max_members) {
                db.close();
                return res.status(400).json({ error: 'Ce groupe a atteint le nombre maximum de membres' });
            }
        }
        
        db.prepare(`
            INSERT INTO group_members (group_id, user_id, role)
            VALUES (?, ?, 'member')
        `).run(req.params.groupId, req.user.id);
        
        db.close();
        
        res.json({ message: 'Vous avez rejoint le groupe avec succès' });
    } catch (error) {
        console.error('Erreur rejoindre groupe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Quitter un groupe
router.post('/:groupId/leave', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const membership = db.prepare('SELECT id, role FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.groupId, req.user.id);
        if (!membership) {
            db.close();
            return res.status(400).json({ error: 'Vous n\'êtes pas membre de ce groupe' });
        }
        
        // Vérifier si c'est le dernier admin
        if (membership.role === 'admin') {
            const adminCount = db.prepare('SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND role = "admin"').get(req.params.groupId).count;
            if (adminCount === 1) {
                db.close();
                return res.status(400).json({ error: 'Vous ne pouvez pas quitter le groupe car vous êtes le dernier admin. Veuillez nommer un autre admin d\'abord.' });
            }
        }
        
        db.prepare('DELETE FROM group_members WHERE id = ?').run(membership.id);
        
        db.close();
        
        res.json({ message: 'Vous avez quitté le groupe' });
    } catch (error) {
        console.error('Erreur quitter groupe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer les messages d'un groupe
router.get('/:groupId/messages', (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que l'utilisateur est membre du groupe ou que le groupe est public
        const group = db.prepare('SELECT is_public FROM discussion_groups WHERE id = ?').get(req.params.groupId);
        if (!group) {
            db.close();
            return res.status(404).json({ error: 'Groupe non trouvé' });
        }
        
        const isMember = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.groupId, req.user.id);
        if (!group.is_public && !isMember) {
            db.close();
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        
        const messages = db.prepare(`
            SELECT 
                gme.*,
                u.username,
                u.avatar_url,
                (SELECT COUNT(*) FROM message_reactions WHERE message_id = gme.id) as reactions_count
            FROM group_messages gme
            JOIN users u ON gme.user_id = u.id
            WHERE gme.group_id = ? AND gme.status = 'visible'
            ORDER BY gme.created_at DESC
            LIMIT ? OFFSET ?
        `).all(req.params.groupId, parseInt(limit), parseInt(offset));
        
        // Récupérer les réactions pour chaque message
        const messagesWithReactions = messages.map(msg => {
            const reactions = db.prepare(`
                SELECT emoji, COUNT(*) as count
                FROM message_reactions
                WHERE message_id = ?
                GROUP BY emoji
            `).all(msg.id);
            
            return { ...msg, reactions };
        });
        
        db.close();
        
        res.json(messagesWithReactions.reverse());
    } catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Poster un message dans un groupe
router.post('/:groupId/messages', (req, res) => {
    try {
        const { content, message_type, attachment_url } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Le message ne peut pas être vide' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que l'utilisateur est membre du groupe
        const isMember = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.groupId, req.user.id);
        if (!isMember) {
            db.close();
            return res.status(403).json({ error: 'Vous devez être membre du groupe pour poster un message' });
        }
        
        const result = db.prepare(`
            INSERT INTO group_messages (group_id, user_id, content, message_type, attachment_url)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            req.params.groupId,
            req.user.id,
            sanitizeInput(content),
            message_type || 'text',
            attachment_url || null
        );
        
        // Récupérer le message créé avec les infos de l'utilisateur
        const message = db.prepare(`
            SELECT 
                gme.*,
                u.username,
                u.avatar_url
            FROM group_messages gme
            JOIN users u ON gme.user_id = u.id
            WHERE gme.id = ?
        `).get(result.lastInsertRowid);
        
        db.close();
        
        res.json({
            message: 'Message posté avec succès',
            data: message
        });
    } catch (error) {
        console.error('Erreur poster message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Réagir à un message
router.post('/messages/:messageId/react', (req, res) => {
    try {
        const { emoji } = req.body;
        
        if (!emoji) {
            return res.status(400).json({ error: 'Emoji requis' });
        }
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que le message existe
        const message = db.prepare('SELECT group_id FROM group_messages WHERE id = ?').get(req.params.messageId);
        if (!message) {
            db.close();
            return res.status(404).json({ error: 'Message non trouvé' });
        }
        
        // Vérifier que l'utilisateur est membre du groupe
        const isMember = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(message.group_id, req.user.id);
        if (!isMember) {
            db.close();
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        
        // Vérifier si l'utilisateur a déjà réagi avec cet emoji
        const existingReaction = db.prepare('SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').get(req.params.messageId, req.user.id, emoji);
        
        if (existingReaction) {
            // Retirer la réaction
            db.prepare('DELETE FROM message_reactions WHERE id = ?').run(existingReaction.id);
            db.close();
            return res.json({ message: 'Réaction retirée', action: 'removed' });
        } else {
            // Ajouter la réaction
            db.prepare(`
                INSERT INTO message_reactions (message_id, user_id, emoji)
                VALUES (?, ?, ?)
            `).run(req.params.messageId, req.user.id, emoji);
            db.close();
            return res.json({ message: 'Réaction ajoutée', action: 'added' });
        }
    } catch (error) {
        console.error('Erreur réaction message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Membres d'un groupe
router.get('/:groupId/members', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que le groupe existe et que l'utilisateur a accès
        const group = db.prepare('SELECT is_public FROM discussion_groups WHERE id = ?').get(req.params.groupId);
        if (!group) {
            db.close();
            return res.status(404).json({ error: 'Groupe non trouvé' });
        }
        
        const isMember = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.groupId, req.user.id);
        if (!group.is_public && !isMember) {
            db.close();
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        
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
            ORDER BY 
                CASE gm.role 
                    WHEN 'admin' THEN 1 
                    WHEN 'moderator' THEN 2 
                    ELSE 3 
                END,
                gm.joined_at ASC
        `).all(req.params.groupId);
        
        db.close();
        
        res.json(members);
    } catch (error) {
        console.error('Erreur membres groupe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
