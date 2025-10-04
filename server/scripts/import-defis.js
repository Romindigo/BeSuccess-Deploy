const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const path = require('path');

// Configuration
const excelPath = path.join(__dirname, '../../defis-besuccess.xlsx');
const dbPath = path.join(__dirname, '../database/challenges.db');

console.log('🚀 Import des défis depuis Excel vers la base de données');
console.log('='.repeat(60));

// Mapping des catégories avec leurs couleurs et icônes
const categoriesConfig = {
    'Activités hors du commun': { color: '#EF4444', icon: '🎭', description: 'Osez l\'extraordinaire' },
    'Communication': { color: '#F59E0B', icon: '🎤', description: 'Développez votre aisance relationnelle' },
    'En Public !': { color: '#EC4899', icon: '🎪', description: 'Sortez de votre zone de confort' },
    'Générosité': { color: '#10B981', icon: '💝', description: 'Partagez et donnez' },
    'Au boulot !': { color: '#3B82F6', icon: '💼', description: 'Dépassez-vous professionnellement' },
    'Sensations fortes': { color: '#8B5CF6', icon: '⚡', description: 'Vivez l\'adrénaline' },
    'A l\'institut': { color: '#06B6D4', icon: '💆', description: 'Prenez soin de vous' },
    'Le coin culinaire': { color: '#F97316', icon: '🍽️', description: 'Explorez de nouvelles saveurs' },
    'Voyage Voyage': { color: '#14B8A6', icon: '✈️', description: 'Découvrez le monde' },
    'Animaux intriguants': { color: '#84CC16', icon: '🐾', description: 'Rencontrez nos amis les bêtes' }
};

try {
    // Lire le fichier Excel
    console.log('📂 Lecture du fichier Excel...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    console.log(`✅ ${data.length} lignes lues`);
    
    // Connexion à la base de données
    console.log('\n📦 Connexion à la base de données...');
    const db = new Database(dbPath);
    
    // Désactiver temporairement les foreign keys
    db.exec('PRAGMA foreign_keys = OFF');
    
    // Nettoyer les anciennes données (seulement challenges et themes)
    console.log('🧹 Nettoyage des anciennes données...');
    db.exec('DELETE FROM challenges');
    db.exec('DELETE FROM themes');
    
    // Réinitialiser les compteurs auto-increment (si la table existe)
    try {
        db.exec('DELETE FROM sqlite_sequence WHERE name IN ("challenges", "themes")');
    } catch (e) {
        // La table sqlite_sequence n'existe pas encore, pas grave
    }
    
    // Préparer les requêtes
    const insertTheme = db.prepare('INSERT INTO themes (name, description, color, icon) VALUES (?, ?, ?, ?)');
    const insertChallenge = db.prepare('INSERT INTO challenges (theme_id, title, description, difficulty, points) VALUES (?, ?, ?, ?, ?)');
    
    let totalChallenges = 0;
    let themeCount = 0;
    let themeId = 0;
    
    // Utiliser une transaction pour tout insérer d'un coup
    const importAll = db.transaction(() => {
        // Traiter chaque catégorie
        Object.entries(categoriesConfig).forEach(([categoryName, config]) => {
            themeCount++;
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📁 Catégorie: ${categoryName} ${config.icon}`);
        
        // Insérer le thème et récupérer son ID
        const result = insertTheme.run(categoryName, config.description, config.color, config.icon);
        themeId = result.lastInsertRowid;
        console.log(`   ✅ Thème créé (ID: ${themeId})`);
        
        // Extraire les défis de cette colonne (ignorer la première ligne qui contient le nombre)
        const defis = data
            .slice(1) // Ignorer la première ligne
            .map(row => row[categoryName])
            .filter(defi => defi && defi.trim() !== ''); // Filtrer les vides
        
        console.log(`   📝 ${defis.length} défis trouvés`);
        
        // Insérer chaque défi
        defis.forEach((defi, index) => {
            // Calculer difficulté et points (distribution équilibrée)
            const position = index / defis.length;
            let difficulty, points;
            
            if (position < 0.2) {
                difficulty = 1; points = 10;
            } else if (position < 0.4) {
                difficulty = 2; points = 15;
            } else if (position < 0.6) {
                difficulty = 3; points = 20;
            } else if (position < 0.8) {
                difficulty = 4; points = 25;
            } else {
                difficulty = 5; points = 30;
            }
            
            // Nettoyer et limiter la longueur
            const title = defi.length > 100 ? defi.substring(0, 97) + '...' : defi;
            const description = defi.length > 200 ? defi : `Relevez ce défi: ${defi}`;
            
            insertChallenge.run(themeId, title, description, difficulty, points);
            totalChallenges++;
        });
        
        console.log(`   ✅ ${defis.length} défis insérés`);
        });
    });
    
    // Exécuter la transaction
    importAll();
    
    // Réactiver les foreign keys
    db.exec('PRAGMA foreign_keys = ON');
    
    db.close();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Import terminé avec succès !');
    console.log(`📊 Statistiques:`);
    console.log(`   - Thèmes créés: ${themeCount}`);
    console.log(`   - Défis importés: ${totalChallenges}`);
    console.log('='.repeat(60));
    
} catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message);
    console.error(error);
    process.exit(1);
}
