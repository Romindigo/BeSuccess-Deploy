const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './server/database/challenges.db';
const migrationsPath = path.join(__dirname, 'migrations.sql');

console.log('🔄 Début de la migration de la base de données...');

try {
    const db = new Database(dbPath);
    
    // Lire le fichier de migrations
    const migrations = fs.readFileSync(migrationsPath, 'utf8');
    
    // Exécuter toutes les migrations
    db.exec(migrations);
    
    console.log('✅ Migration réussie !');
    console.log('');
    console.log('📊 Nouvelles tables créées :');
    console.log('  - comments (commentaires sur photos/vidéos)');
    console.log('  - photo_likes (likes)');
    console.log('  - user_follows (système de suivi)');
    console.log('  - app_settings (personnalisation couleurs)');
    console.log('  - user_badges (badges et achievements)');
    console.log('');
    console.log('🎨 Nouvelles colonnes ajoutées :');
    console.log('  - challenge_photos: media_type, video_duration, thumbnail_filename');
    console.log('  - users: avatar_url, bio, location, website, followers_count, following_count');
    
    db.close();
    
    console.log('');
    console.log('🎉 Base de données mise à jour avec succès !');
} catch (error) {
    // Si l'erreur est "duplicate column name", c'est que la migration a déjà été faite
    if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  La migration a déjà été appliquée');
    } else {
        console.error('❌ Erreur lors de la migration:', error.message);
        process.exit(1);
    }
}
