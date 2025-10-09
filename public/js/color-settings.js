// Module de personnalisation des couleurs
const ColorSettings = {
    currentSettings: {},

    // Charger les paramètres actuels
    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();
            if (!response.ok) throw new Error(settings.error);
            
            this.currentSettings = settings;
            return settings;
        } catch (error) {
            console.error('Erreur chargement paramètres:', error);
            throw error;
        }
    },

    // Appliquer les couleurs à la page
    applyColors(settings = this.currentSettings) {
        const root = document.documentElement;
        
        // Appliquer chaque couleur comme variable CSS
        Object.entries(settings).forEach(([key, value]) => {
            // Convertir snake_case en kebab-case pour CSS
            const cssVar = '--' + key.replace(/_/g, '-');
            root.style.setProperty(cssVar, value);
        });
        
        console.log('✅ Couleurs appliquées:', settings);
    },

    // Mettre à jour un paramètre (admin uniquement)
    async updateSetting(key, value) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/settings/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ value })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            // Mettre à jour localement et appliquer
            this.currentSettings[key] = value;
            this.applyColors();
            
            return result;
        } catch (error) {
            console.error('Erreur mise à jour:', error);
            throw error;
        }
    },

    // Mettre à jour plusieurs paramètres en une fois
    async updateMultiple(settings) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/settings/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ settings })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            // Mettre à jour localement et appliquer
            Object.assign(this.currentSettings, settings);
            this.applyColors();
            
            return result;
        } catch (error) {
            console.error('Erreur mise à jour bulk:', error);
            throw error;
        }
    },

    // Réinitialiser aux valeurs par défaut
    async resetToDefaults() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/settings/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            // Recharger et appliquer
            await this.loadSettings();
            this.applyColors();
            
            return result;
        } catch (error) {
            console.error('Erreur réinitialisation:', error);
            throw error;
        }
    },

    // Créer l'interface de personnalisation (admin)
    renderColorEditor(container) {
        const colorInputs = [
            { key: 'primary_color', label: 'Couleur Principale', description: 'Or/Accent principal' },
            { key: 'secondary_color', label: 'Couleur Secondaire', description: 'Fond sombre' },
            { key: 'accent_color', label: 'Couleur Accent', description: 'Texte clair' },
            { key: 'background_color', label: 'Fond Principal', description: 'Arrière-plan' },
            { key: 'card_background', label: 'Fond Cartes', description: 'Cartes et conteneurs' },
            { key: 'text_primary', label: 'Texte Principal', description: 'Texte primaire' },
            { key: 'text_secondary', label: 'Texte Secondaire', description: 'Texte secondaire' },
            { key: 'success_color', label: 'Couleur Succès', description: 'Vert validations' },
            { key: 'warning_color', label: 'Couleur Attention', description: 'Orange alertes' },
            { key: 'danger_color', label: 'Couleur Danger', description: 'Rouge erreurs' }
        ];

        container.innerHTML = `
            <div class="color-editor">
                <div class="color-editor-header">
                    <h2>🎨 Personnalisation des Couleurs</h2>
                    <p>Modifiez les couleurs de la plateforme en temps réel</p>
                </div>

                <div class="color-grid">
                    ${colorInputs.map(input => `
                        <div class="color-input-group">
                            <label for="${input.key}">
                                <strong>${input.label}</strong>
                                <span class="color-description">${input.description}</span>
                            </label>
                            <div class="color-input-wrapper">
                                <input 
                                    type="color" 
                                    id="${input.key}" 
                                    class="color-picker"
                                    value="${this.currentSettings[input.key] || '#000000'}"
                                    data-key="${input.key}">
                                <input 
                                    type="text" 
                                    class="color-text"
                                    value="${this.currentSettings[input.key] || '#000000'}"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                    data-key="${input.key}">
                            </div>
                            <div class="color-preview" style="background-color: ${this.currentSettings[input.key]}"></div>
                        </div>
                    `).join('')}
                </div>

                <div class="color-editor-actions">
                    <button id="apply-colors" class="btn btn-primary">
                        ✅ Appliquer les modifications
                    </button>
                    <button id="reset-colors" class="btn btn-secondary">
                        🔄 Réinitialiser par défaut
                    </button>
                    <button id="preview-colors" class="btn btn-accent">
                        👁️ Aperçu en temps réel
                    </button>
                </div>

                <div class="color-presets">
                    <h3>Thèmes prédéfinis</h3>
                    <div class="preset-buttons">
                        <button class="btn-preset" data-preset="gold">🏆 Or (défaut)</button>
                        <button class="btn-preset" data-preset="blue">💙 Bleu</button>
                        <button class="btn-preset" data-preset="purple">💜 Violet</button>
                        <button class="btn-preset" data-preset="green">💚 Vert</button>
                        <button class="btn-preset" data-preset="dark">🖤 Sombre</button>
                    </div>
                </div>
            </div>
        `;

        this.attachColorEditorEvents();
    },

    // Attacher les événements de l'éditeur
    attachColorEditorEvents() {
        // Synchroniser color picker et text input
        document.querySelectorAll('.color-picker').forEach(picker => {
            picker.addEventListener('input', (e) => {
                const key = e.target.dataset.key;
                const value = e.target.value;
                const textInput = document.querySelector(`.color-text[data-key="${key}"]`);
                const preview = e.target.parentElement.nextElementSibling;
                
                textInput.value = value;
                preview.style.backgroundColor = value;
            });
        });

        document.querySelectorAll('.color-text').forEach(input => {
            input.addEventListener('input', (e) => {
                const key = e.target.dataset.key;
                const value = e.target.value;
                
                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    const colorPicker = document.querySelector(`.color-picker[data-key="${key}"]`);
                    const preview = e.target.parentElement.nextElementSibling;
                    
                    colorPicker.value = value;
                    preview.style.backgroundColor = value;
                }
            });
        });

        // Bouton Appliquer
        document.getElementById('apply-colors').addEventListener('click', async () => {
            const newSettings = {};
            document.querySelectorAll('.color-picker').forEach(picker => {
                newSettings[picker.dataset.key] = picker.value;
            });
            
            try {
                await this.updateMultiple(newSettings);
                alert('✅ Couleurs mises à jour avec succès !');
            } catch (error) {
                alert('❌ Erreur: ' + error.message);
            }
        });

        // Bouton Réinitialiser
        document.getElementById('reset-colors').addEventListener('click', async () => {
            if (confirm('Réinitialiser toutes les couleurs aux valeurs par défaut ?')) {
                try {
                    await this.resetToDefaults();
                    this.renderColorEditor(document.querySelector('.color-editor').parentElement);
                    alert('✅ Couleurs réinitialisées !');
                } catch (error) {
                    alert('❌ Erreur: ' + error.message);
                }
            }
        });

        // Bouton Aperçu
        document.getElementById('preview-colors').addEventListener('click', () => {
            const previewSettings = {};
            document.querySelectorAll('.color-picker').forEach(picker => {
                previewSettings[picker.dataset.key] = picker.value;
            });
            this.applyColors(previewSettings);
        });

        // Presets
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyPreset(preset);
            });
        });
    },

    // Appliquer un preset
    applyPreset(presetName) {
        const presets = {
            gold: {
                primary_color: '#D4AF37',
                secondary_color: '#000000',
                accent_color: '#FFFFFF',
                background_color: '#0A0A0A',
                card_background: '#1A1A1A'
            },
            blue: {
                primary_color: '#3B82F6',
                secondary_color: '#1E3A8A',
                accent_color: '#DBEAFE',
                background_color: '#0F172A',
                card_background: '#1E293B'
            },
            purple: {
                primary_color: '#A855F7',
                secondary_color: '#581C87',
                accent_color: '#F3E8FF',
                background_color: '#1E1B4B',
                card_background: '#312E81'
            },
            green: {
                primary_color: '#10B981',
                secondary_color: '#064E3B',
                accent_color: '#D1FAE5',
                background_color: '#0C1713',
                card_background: '#1C2E27'
            },
            dark: {
                primary_color: '#6B7280',
                secondary_color: '#000000',
                accent_color: '#F9FAFB',
                background_color: '#000000',
                card_background: '#111111'
            }
        };

        const preset = presets[presetName];
        if (preset) {
            // Mettre à jour les inputs
            Object.entries(preset).forEach(([key, value]) => {
                const picker = document.querySelector(`.color-picker[data-key="${key}"]`);
                const text = document.querySelector(`.color-text[data-key="${key}"]`);
                const preview = picker.parentElement.nextElementSibling;
                
                if (picker) picker.value = value;
                if (text) text.value = value;
                if (preview) preview.style.backgroundColor = value;
            });

            // Aperçu
            this.applyColors({ ...this.currentSettings, ...preset });
        }
    }
};

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ColorSettings.loadSettings();
        ColorSettings.applyColors();
    } catch (error) {
        console.error('Erreur initialisation couleurs:', error);
    }
});

window.ColorSettings = ColorSettings;
