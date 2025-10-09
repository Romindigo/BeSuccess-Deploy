// Toggle Thème Sombre/Clair Simple

const ThemeToggle = {
    init() {
        // Récupérer le thème sauvegardé ou utiliser sombre par défaut
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.applyTheme(savedTheme);
        this.createToggleButton();
    },

    createToggleButton() {
        // Vérifier si le bouton existe déjà
        if (document.getElementById('themeToggle')) return;

        // Créer le bouton
        const button = document.createElement('button');
        button.id = 'themeToggle';
        button.className = 'theme-toggle-btn';
        button.innerHTML = this.getTheme() === 'dark' ? '☀️' : '🌙';
        button.title = this.getTheme() === 'dark' ? 'Mode Clair' : 'Mode Sombre';

        // Style du bouton
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid var(--primary-color, #D4AF37);
            background: var(--card-background, #1A1A1A);
            color: var(--text-primary, #FFFFFF);
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        // Hover effect
        button.onmouseenter = () => {
            button.style.transform = 'scale(1.1)';
        };
        button.onmouseleave = () => {
            button.style.transform = 'scale(1)';
        };

        // Click event
        button.onclick = () => {
            const currentTheme = this.getTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
            button.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
            button.title = newTheme === 'dark' ? 'Mode Clair' : 'Mode Sombre';
        };

        document.body.appendChild(button);
    },

    applyTheme(theme) {
        const root = document.documentElement;

        if (theme === 'light') {
            // Mode Clair
            root.style.setProperty('--primary-color', '#D4AF37');
            root.style.setProperty('--gold', '#c1913c');
            root.style.setProperty('--secondary-color', '#FFFFFF');
            root.style.setProperty('--accent-color', '#000000');
            root.style.setProperty('--background-color', '#F5F5F5');
            root.style.setProperty('--card-background', '#FFFFFF');
            root.style.setProperty('--text-primary', '#000000');
            root.style.setProperty('--text-secondary', '#666666');
            root.style.setProperty('--success-color', '#10B981');
            root.style.setProperty('--warning-color', '#F59E0B');
            root.style.setProperty('--danger-color', '#EF4444');
            
            // Variables spécifiques style.css
            root.style.setProperty('--white', '#000000');
            root.style.setProperty('--black', '#FFFFFF');
            root.style.setProperty('--gray-dark', '#FFFFFF');
            root.style.setProperty('--gray-medium', '#E5E5E5');
            root.style.setProperty('--gray-light', '#999999');

            // Mettre à jour le body
            document.body.style.background = '#F5F5F5';
            document.body.style.color = '#000000';
            
            // Ajouter une classe au body pour les styles CSS
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        } else {
            // Mode Sombre (défaut)
            root.style.setProperty('--primary-color', '#D4AF37');
            root.style.setProperty('--gold', '#c1913c');
            root.style.setProperty('--secondary-color', '#000000');
            root.style.setProperty('--accent-color', '#FFFFFF');
            root.style.setProperty('--background-color', '#0A0A0A');
            root.style.setProperty('--card-background', '#1A1A1A');
            root.style.setProperty('--text-primary', '#FFFFFF');
            root.style.setProperty('--text-secondary', '#CCCCCC');
            root.style.setProperty('--success-color', '#10B981');
            root.style.setProperty('--warning-color', '#F59E0B');
            root.style.setProperty('--danger-color', '#EF4444');
            
            // Variables spécifiques style.css
            root.style.setProperty('--white', '#FFFFFF');
            root.style.setProperty('--black', '#000000');
            root.style.setProperty('--gray-dark', '#1a1a1a');
            root.style.setProperty('--gray-medium', '#333333');
            root.style.setProperty('--gray-light', '#666666');

            // Mettre à jour le body
            document.body.style.background = '#0A0A0A';
            document.body.style.color = '#FFFFFF';
            
            // Ajouter une classe au body
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        }

        // Sauvegarder le thème
        localStorage.setItem('theme', theme);
    },

    getTheme() {
        return localStorage.getItem('theme') || 'dark';
    }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    ThemeToggle.init();
});

window.ThemeToggle = ThemeToggle;
console.log('✅ Toggle thème sombre/clair chargé');
