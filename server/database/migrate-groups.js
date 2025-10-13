const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'challenges.db');
const migrationPath = path.join(__dirname, 'groups-migration.sql');

console.log('Début de la migration des groupes de discussion...');

try {
    const db = new Database(dbPath);
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Séparer les commandes en supprimant les commentaires et en gérant correctement les blocs
    const lines = migration.split('\n');
    let currentStatement = '';
    const statements = [];
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Ignorer les commentaires
        if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
            continue;
        }
        
        currentStatement += ' ' + trimmedLine;
        
        // Si la ligne se termine par un point-virgule, c'est la fin de la commande
        if (trimmedLine.endsWith(';')) {
            statements.push(currentStatement.trim().slice(0, -1)); // Enlever le point-virgule
            currentStatement = '';
        }
    }
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    db.exec('BEGIN TRANSACTION');
    
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
            const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
            console.log(`[${i + 1}/${statements.length}] ${preview}...`);
            try {
                db.exec(statement);
            } catch (err) {
                console.error(`Error executing statement ${i + 1}:`, err.message);
                throw err;
            }
        }
    }
    
    db.exec('COMMIT');
    
    console.log('\n✓ Migration des groupes terminée avec succès!');
    
    // Vérifier les tables créées
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND (name LIKE '%group%' OR name LIKE '%message%')
        ORDER BY name
    `).all();
    
    console.log('\nTables créées:');
    tables.forEach(t => console.log('  -', t.name));
    
    db.close();
    
} catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    process.exit(1);
}
