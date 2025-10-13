const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/challenges.db');

console.log('🔧 Création des utilisateurs de test...\n');

try {
    const db = new Database(dbPath);
    
    // Mot de passe pour admin et utilisateur de test
    const adminPassword = 'Admin123!';
    const userPassword = 'User123!';
    
    const adminHash = bcrypt.hashSync(adminPassword, 10);
    const userHash = bcrypt.hashSync(userPassword, 10);
    
    // Vérifier si l'admin existe
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@besuccess.com');
    
    if (existingAdmin) {
        // Mettre à jour le mot de passe admin
        db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(adminHash, 'admin@besuccess.com');
        console.log('✅ Compte admin mis à jour');
    } else {
        // Créer l'admin
        db.prepare(`
            INSERT INTO users (email, password_hash, username, is_admin)
            VALUES (?, ?, ?, 1)
        `).run('admin@besuccess.com', adminHash, 'Admin BeSuccess');
        console.log('✅ Compte admin créé');
    }
    
    // Vérifier si l'utilisateur de test existe
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('user@test.com');
    
    if (existingUser) {
        // Mettre à jour le mot de passe utilisateur
        db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(userHash, 'user@test.com');
        console.log('✅ Compte utilisateur test mis à jour');
    } else {
        // Créer l'utilisateur de test
        db.prepare(`
            INSERT INTO users (email, password_hash, username, is_admin, total_points)
            VALUES (?, ?, ?, 0, 100)
        `).run('user@test.com', userHash, 'Utilisateur Test');
        console.log('✅ Compte utilisateur test créé');
    }
    
    db.close();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPTES DE TEST CRÉÉS AVEC SUCCÈS !');
    console.log('='.repeat(60));
    
    console.log('\n📝 COMPTE ADMIN:');
    console.log('   URL: http://localhost:3001/admin.html');
    console.log('   Email: admin@besuccess.com');
    console.log('   Mot de passe: Admin123!');
    
    console.log('\n👤 COMPTE UTILISATEUR:');
    console.log('   URL: http://localhost:3000');
    console.log('   Email: user@test.com');
    console.log('   Mot de passe: User123!');
    
    console.log('\n' + '='.repeat(60) + '\n');
    
} catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
}
