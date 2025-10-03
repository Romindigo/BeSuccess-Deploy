const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const challengesRoutes = require('./routes/challenges');
const photosRoutes = require('./routes/photos');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.USER_PORT || 3000;

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour permettre les inline scripts
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
});

app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/users', usersRoutes);

// Route pour le partage social avec OG tags
app.get('/p/:photoId', async (req, res) => {
    try {
        const Database = require('better-sqlite3');
        const db = new Database(process.env.DB_PATH || './server/database/challenges.db');
        
        const photo = db.prepare(`
            SELECT 
                cp.*,
                u.username,
                c.title as challenge_title,
                c.description as challenge_description
            FROM challenge_photos cp
            JOIN users u ON cp.user_id = u.id
            JOIN challenges c ON cp.challenge_id = c.id
            WHERE cp.id = ?
        `).get(req.params.photoId);
        
        db.close();
        
        if (!photo) {
            return res.redirect('/');
        }
        
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${photo.filename}`;
        const pageUrl = `${req.protocol}://${req.get('host')}/p/${photo.id}`;
        const title = `${photo.username} a relevé le défi: ${photo.challenge_title}`;
        const description = photo.caption || photo.challenge_description;
        
        res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 100 Challenges BeSuccess</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${pageUrl}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${imageUrl}">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #000;
            color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            width: 100%;
            text-align: center;
        }
        .logo {
            color: #D4AF37;
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 2rem;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(212, 175, 55, 0.3);
            margin-bottom: 2rem;
        }
        h1 {
            color: #D4AF37;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        p {
            color: #ccc;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            background: #D4AF37;
            color: #000;
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: scale(1.05);
        }
    </style>
    <script>
        // Redirection automatique après 3 secondes
        setTimeout(() => {
            window.location.href = '/?photo=${photo.id}';
        }, 3000);
    </script>
</head>
<body>
    <div class="container">
        <div class="logo">🏆 100 Challenges</div>
        <img src="${imageUrl}" alt="${photo.challenge_title}">
        <h1>${photo.challenge_title}</h1>
        <p>${description}</p>
        <p style="color: #D4AF37;">Par ${photo.username}</p>
        <a href="/" class="btn">Rejoindre les défis</a>
    </div>
</body>
</html>
        `);
    } catch (error) {
        console.error('Erreur page partage:', error);
        res.redirect('/');
    }
});

// Fallback vers index.html pour SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur interne' });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur utilisateur démarré sur http://localhost:${PORT}`);
    console.log(`📁 Uploads: ${process.env.UPLOAD_DIR || './uploads'}`);
    console.log(`🗄️  Database: ${process.env.DB_PATH || './server/database/challenges.db'}`);
});
