const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminUsersRoutes = require('./routes/admin/users');
const adminPhotosRoutes = require('./routes/admin/photos');
const adminDashboardRoutes = require('./routes/admin/dashboard');
const adminContentRoutes = require('./routes/admin/content');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: '*',
    credentials: true
}));

// Rate limiting plus strict pour l'admin
const limiter = rateLimit({
    windowMs: 900000, // 15 minutes
    max: 50,
    message: 'Trop de requêtes admin, veuillez réessayer plus tard'
});

app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques admin
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API Admin
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/photos', adminPhotosRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/content', adminContentRoutes);

// Servir la page admin
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur serveur admin:', err);
    res.status(500).json({ error: err.message || 'Erreur serveur interne' });
});

app.listen(PORT, () => {
    console.log(`🔐 Serveur admin démarré sur http://localhost:${PORT}`);
    console.log(`📊 Dashboard admin accessible`);
});
