const express = require('express');
const Database = require('better-sqlite3');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sanitizeInput } = require('../utils/validation');

const router = express.Router();

// Upload photo/vidéo pour un défi
router.post('/upload/:challengeId', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }
        
        const { challengeId } = req.params;
        const { caption } = req.body;
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        // Vérifier que le défi existe
        const challenge = db.prepare('SELECT id, points FROM challenges WHERE id = ?').get(challengeId);
        if (!challenge) {
            db.close();
            fs.unlinkSync(req.file.path); // Supprimer le fichier uploadé
            return res.status(404).json({ error: 'Défi non trouvé' });
        }
        
        // Déterminer le type de média
        const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
        let thumbnailFilename = null;
        
        // Traitement selon le type
        if (mediaType === 'image') {
            // Redimensionner l'image avec Sharp
            const resizedPath = req.file.path.replace(path.extname(req.file.path), '_resized' + path.extname(req.file.path));
            
            await sharp(req.file.path)
                .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toFile(resizedPath);
            
            // Supprimer l'original et renommer le redimensionné
            fs.unlinkSync(req.file.path);
            fs.renameSync(resizedPath, req.file.path);
        } else {
            // Pour les vidéos, générer une miniature (optionnel, nécessite ffmpeg)
            // Pour l'instant, on stocke juste la vidéo
            thumbnailFilename = null; // TODO: Générer avec ffmpeg si disponible
        }
        
        // Enregistrer le média en base
        const result = db.prepare(`
            INSERT INTO challenge_photos (challenge_id, user_id, filename, caption, status, media_type, thumbnail_filename)
            VALUES (?, ?, ?, ?, 'visible', ?, ?)
        `).run(challengeId, req.user.id, req.file.filename, sanitizeInput(caption) || null, mediaType, thumbnailFilename);
        
        const photoId = result.lastInsertRowid;
        
        // Vérifier si l'utilisateur a déjà complété ce défi
        const progress = db.prepare(`
            SELECT id FROM user_progress 
            WHERE user_id = ? AND challenge_id = ?
        `).get(req.user.id, challengeId);
        
        if (!progress) {
            // Marquer le défi comme complété
            db.prepare(`
                INSERT INTO user_progress (user_id, challenge_id, completed, completed_at, photo_id)
                VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?)
            `).run(req.user.id, challengeId, photoId);
            
            // Ajouter les points
            db.prepare(`
                UPDATE users 
                SET total_points = total_points + ?
                WHERE id = ?
            `).run(challenge.points, req.user.id);
        } else {
            // Mettre à jour la photo associée
            db.prepare(`
                UPDATE user_progress 
                SET photo_id = ?
                WHERE user_id = ? AND challenge_id = ?
            `).run(photoId, req.user.id, challengeId);
        }
        
        db.close();
        
        res.json({
            message: mediaType === 'video' ? 'Vidéo uploadée avec succès' : 'Photo uploadée avec succès',
            photo: {
                id: photoId,
                filename: req.file.filename,
                caption: sanitizeInput(caption) || null,
                media_type: mediaType,
                thumbnail_filename: thumbnailFilename
            }
        });
    } catch (error) {
        console.error('Erreur upload photo:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }
});

// Récupérer les photos d'un défi (galerie publique)
router.get('/challenge/:challengeId', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const photos = db.prepare(`
            SELECT 
                cp.id,
                cp.filename,
                cp.caption,
                cp.created_at,
                cp.media_type,
                cp.thumbnail_filename,
                u.username,
                u.id as user_id,
                (SELECT COUNT(*) FROM photo_likes WHERE photo_id = cp.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE photo_id = cp.id AND status = 'visible') as comments_count
            FROM challenge_photos cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.challenge_id = ? AND cp.status = 'visible'
            ORDER BY cp.created_at DESC
        `).all(req.params.challengeId);
        
        db.close();
        
        res.json(photos);
    } catch (error) {
        console.error('Erreur récupération photos:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer une photo spécifique (pour partage social avec OG tags)
router.get('/:photoId', (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const photo = db.prepare(`
            SELECT 
                cp.*,
                u.username,
                c.title as challenge_title,
                c.description as challenge_description,
                t.name as theme_name
            FROM challenge_photos cp
            JOIN users u ON cp.user_id = u.id
            JOIN challenges c ON cp.challenge_id = c.id
            JOIN themes t ON c.theme_id = t.id
            WHERE cp.id = ?
        `).get(req.params.photoId);
        
        db.close();
        
        if (!photo) {
            return res.status(404).json({ error: 'Photo non trouvée' });
        }
        
        res.json(photo);
    } catch (error) {
        console.error('Erreur récupération photo:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Signaler une photo (flag)
router.post('/:photoId/flag', authMiddleware, (req, res) => {
    try {
        const { reason } = req.body;
        
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const photo = db.prepare('SELECT id, flag_count FROM challenge_photos WHERE id = ?').get(req.params.photoId);
        
        if (!photo) {
            db.close();
            return res.status(404).json({ error: 'Photo non trouvée' });
        }
        
        // Incrémenter le compteur de signalements
        db.prepare(`
            UPDATE challenge_photos 
            SET flag_count = flag_count + 1,
                flagged_at = CURRENT_TIMESTAMP,
                flag_reason = COALESCE(flag_reason || ' | ', '') || ?
            WHERE id = ?
        `).run(sanitizeInput(reason) || 'Non spécifié', req.params.photoId);
        
        // Si plus de 3 signalements, masquer automatiquement
        if (photo.flag_count + 1 >= 3) {
            db.prepare(`
                UPDATE challenge_photos 
                SET status = 'hidden'
                WHERE id = ?
            `).run(req.params.photoId);
        }
        
        db.close();
        
        res.json({ 
            message: 'Photo signalée avec succès',
            flag_count: photo.flag_count + 1
        });
    } catch (error) {
        console.error('Erreur signalement photo:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer les photos de l'utilisateur connecté
router.get('/user/me', authMiddleware, (req, res) => {
    try {
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const photos = db.prepare(`
            SELECT 
                cp.*,
                c.title as challenge_title,
                t.name as theme_name
            FROM challenge_photos cp
            JOIN challenges c ON cp.challenge_id = c.id
            JOIN themes t ON c.theme_id = t.id
            WHERE cp.user_id = ?
            ORDER BY cp.created_at DESC
        `).all(req.user.id);
        
        db.close();
        
        res.json(photos);
    } catch (error) {
        console.error('Erreur récupération photos utilisateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
