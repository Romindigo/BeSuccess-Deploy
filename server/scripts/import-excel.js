const XLSX = require('xlsx');
const path = require('path');

// Lire le fichier Excel
const filePath = path.join(__dirname, '../../defis-besuccess.xlsx');
console.log('📂 Lecture du fichier:', filePath);

try {
    const workbook = XLSX.readFile(filePath);
    
    console.log('\n📊 Informations du fichier:');
    console.log('- Nombre de feuilles:', workbook.SheetNames.length);
    console.log('- Noms des feuilles:', workbook.SheetNames.join(', '));
    
    // Lire chaque feuille
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📄 Feuille ${index + 1}: "${sheetName}"`);
        console.log('='.repeat(60));
        
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        console.log(`✅ Nombre de lignes: ${data.length}`);
        
        if (data.length > 0) {
            console.log('\n📋 Colonnes disponibles:');
            Object.keys(data[0]).forEach((col, i) => {
                console.log(`   ${i + 1}. ${col}`);
            });
            
            console.log('\n🔍 Aperçu des 3 premières lignes:');
            data.slice(0, 3).forEach((row, i) => {
                console.log(`\n--- Ligne ${i + 1} ---`);
                Object.entries(row).forEach(([key, value]) => {
                    const displayValue = String(value).length > 50 
                        ? String(value).substring(0, 50) + '...' 
                        : value;
                    console.log(`${key}: ${displayValue}`);
                });
            });
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Analyse terminée !');
    
} catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier:', error.message);
    process.exit(1);
}
