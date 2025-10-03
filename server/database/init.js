const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './server/database/challenges.db';
const schemaPath = path.join(__dirname, 'schema.sql');

// Créer le dossier database s'il n'existe pas
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Créer le dossier uploads s'il n'existe pas
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

console.log('📦 Initialisation de la base de données...');

const db = new Database(dbPath);

// Lire et exécuter le schéma
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

console.log('✅ Schéma créé avec succès');

// Données initiales - Thématiques
const themes = [
    { name: 'Animaux', description: 'Défis avec nos amis les bêtes', color: '#10B981', icon: '🐾' },
    { name: 'Prise de parole', description: 'Sortez de votre zone de confort', color: '#F59E0B', icon: '🎤' },
    { name: 'Dingueries en public', description: 'Osez l\'extraordinaire', color: '#EF4444', icon: '🎭' },
    { name: 'Sport & Aventure', description: 'Dépassez vos limites', color: '#8B5CF6', icon: '⛰️' },
    { name: 'Créativité', description: 'Exprimez votre talent', color: '#06B6D4', icon: '🎨' }
];

const insertTheme = db.prepare('INSERT OR IGNORE INTO themes (name, description, color, icon) VALUES (?, ?, ?, ?)');
themes.forEach(theme => {
    insertTheme.run(theme.name, theme.description, theme.color, theme.icon);
});

console.log('✅ Thématiques créées');

// Données initiales - Défis
const challenges = [
    // Animaux (theme_id: 1)
    { theme_id: 1, title: 'Caresser un animal inconnu', description: 'Approchez un animal que vous ne connaissez pas et caressez-le (avec permission du propriétaire)', difficulty: 1, points: 10 },
    { theme_id: 1, title: 'Nourrir des oiseaux sauvages', description: 'Donnez à manger à des oiseaux dans un parc', difficulty: 2, points: 15 },
    { theme_id: 1, title: 'Visiter un refuge animalier', description: 'Passez du temps dans un refuge et partagez votre expérience', difficulty: 2, points: 15 },
    { theme_id: 1, title: 'Monter à cheval', description: 'Faites une balade à cheval (même courte)', difficulty: 3, points: 20 },
    { theme_id: 1, title: 'Nager avec des dauphins', description: 'Vivez une expérience aquatique inoubliable', difficulty: 5, points: 30 },
    
    // Prise de parole (theme_id: 2)
    { theme_id: 2, title: 'Parler à un inconnu', description: 'Engagez une conversation de 5 minutes avec quelqu\'un que vous ne connaissez pas', difficulty: 1, points: 10 },
    { theme_id: 2, title: 'Poser une question en public', description: 'Posez une question lors d\'une conférence ou réunion publique', difficulty: 2, points: 15 },
    { theme_id: 2, title: 'Faire un compliment sincère', description: 'Complimentez 5 personnes différentes dans la journée', difficulty: 2, points: 15 },
    { theme_id: 2, title: 'Présentation devant 10 personnes', description: 'Faites une présentation de 5 minutes minimum', difficulty: 4, points: 25 },
    { theme_id: 2, title: 'Stand-up comedy amateur', description: 'Montez sur scène lors d\'une soirée open mic', difficulty: 5, points: 30 },
    
    // Dingueries en public (theme_id: 3)
    { theme_id: 3, title: 'Danser en public', description: 'Dansez pendant 1 minute dans un lieu public', difficulty: 2, points: 15 },
    { theme_id: 3, title: 'Chanter à tue-tête', description: 'Chantez fort dans un lieu public (parc, rue)', difficulty: 3, points: 20 },
    { theme_id: 3, title: 'Porter un déguisement toute la journée', description: 'Sortez déguisé et assumez pendant 24h', difficulty: 3, points: 20 },
    { theme_id: 3, title: 'Flash mob improvisé', description: 'Organisez ou participez à un flash mob', difficulty: 4, points: 25 },
    { theme_id: 3, title: 'Demander en mariage un inconnu', description: 'Fausse demande en mariage dans un lieu public (avec consentement)', difficulty: 5, points: 30 },
    
    // Sport & Aventure (theme_id: 4)
    { theme_id: 4, title: 'Courir 5km', description: 'Complétez une course de 5 kilomètres', difficulty: 2, points: 15 },
    { theme_id: 4, title: 'Randonnée en montagne', description: 'Faites une randonnée de minimum 3h en montagne', difficulty: 3, points: 20 },
    { theme_id: 4, title: 'Sport extrême', description: 'Essayez un sport que vous n\'avez jamais fait (escalade, surf, etc.)', difficulty: 3, points: 20 },
    { theme_id: 4, title: 'Saut en parachute', description: 'Sautez d\'un avion (tandem accepté)', difficulty: 5, points: 30 },
    { theme_id: 4, title: 'Marathon ou triathlon', description: 'Complétez un marathon ou triathlon', difficulty: 5, points: 30 },
    
    // Créativité (theme_id: 5)
    { theme_id: 5, title: 'Dessiner un portrait', description: 'Dessinez le portrait d\'un inconnu (avec permission)', difficulty: 2, points: 15 },
    { theme_id: 5, title: 'Écrire un poème', description: 'Écrivez et partagez un poème original', difficulty: 2, points: 15 },
    { theme_id: 5, title: 'Créer une œuvre d\'art', description: 'Créez une œuvre (peinture, sculpture, etc.) et exposez-la', difficulty: 3, points: 20 },
    { theme_id: 5, title: 'Composer une chanson', description: 'Écrivez et enregistrez une chanson originale', difficulty: 4, points: 25 },
    { theme_id: 5, title: 'Court-métrage', description: 'Réalisez un court-métrage de minimum 3 minutes', difficulty: 5, points: 30 }
];

const insertChallenge = db.prepare('INSERT INTO challenges (theme_id, title, description, difficulty, points) VALUES (?, ?, ?, ?, ?)');
challenges.forEach(challenge => {
    insertChallenge.run(challenge.theme_id, challenge.title, challenge.description, challenge.difficulty, challenge.points);
});

console.log('✅ 25 défis créés');

// Créer l'admin par défaut
const adminEmail = process.env.ADMIN_EMAIL || 'admin@besuccess.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
const adminHash = bcrypt.hashSync(adminPassword, 10);

const insertAdmin = db.prepare('INSERT OR IGNORE INTO users (email, password_hash, username, is_admin) VALUES (?, ?, ?, 1)');
insertAdmin.run(adminEmail, adminHash, 'Admin BeSuccess');

console.log('✅ Admin créé');
console.log(`📧 Email: ${adminEmail}`);
console.log(`🔑 Mot de passe: ${adminPassword}`);
console.log('⚠️  Changez le mot de passe admin en production !');

db.close();

console.log('\n🎉 Base de données initialisée avec succès !');
console.log('📍 Emplacement:', path.resolve(dbPath));
