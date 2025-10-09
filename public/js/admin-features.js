// Intégration des nouvelles fonctionnalités admin

// Attendre que l'admin soit chargé
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeAdminFeatures();
    }, 500);
});

function initializeAdminFeatures() {
    // Ajouter l'event listener pour la section couleurs
    const colorsButton = document.querySelector('[data-section="colors"]');
    
    if (colorsButton) {
        colorsButton.addEventListener('click', async () => {
            await showColorEditor();
        });
    }
}

async function showColorEditor() {
    const container = document.getElementById('colorEditorContainer');
    if (!container) return;
    
    try {
        // Charger les paramètres
        await ColorSettings.loadSettings();
        
        // Afficher l'éditeur
        ColorSettings.renderColorEditor(container);
        
        console.log('✅ Éditeur de couleurs chargé');
    } catch (error) {
        console.error('Erreur chargement éditeur:', error);
        container.innerHTML = '<p style="color: var(--danger-color); padding: 40px; text-align: center;">❌ Erreur de chargement de l\'éditeur</p>';
    }
}

console.log('✅ Fonctionnalités admin chargées');
