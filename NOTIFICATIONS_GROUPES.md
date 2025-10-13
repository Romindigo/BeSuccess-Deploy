# 🔔 Système de Notifications pour les Groupes

## 📋 Spécifications

Les groupes doivent permettre aux membres de recevoir des **notifications** lorsqu'il y a de nouvelles activités.

---

## 🎯 Types de Notifications Nécessaires

### 1. Notifications Nouveaux Messages
- **Trigger** : Quand un nouveau message est posté dans un groupe
- **Destinataires** : Tous les membres du groupe SAUF l'auteur
- **Contenu** :
  - Nom du groupe
  - Auteur du message
  - Prévisualisation du contenu (100 caractères max)
  - Lien direct vers le groupe

### 2. Notifications Nouveau Membre
- **Trigger** : Quand quelqu'un rejoint le groupe
- **Destinataires** : Tous les membres existants
- **Contenu** :
  - Nom du nouveau membre
  - Nom du groupe

### 3. Notifications Mention
- **Trigger** : Quand un utilisateur est mentionné (@username)
- **Destinataires** : L'utilisateur mentionné
- **Contenu** :
  - Qui a mentionné
  - Dans quel groupe
  - Contexte du message

---

## 🏗️ Architecture Proposée

### Base de Données

Créer une table `notifications` :

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('group_message', 'group_join', 'mention', 'reaction')),
    group_id INTEGER,
    related_user_id INTEGER,
    message TEXT NOT NULL,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES discussion_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
```

### Routes API

#### Backend (`/api/notifications`)

```javascript
// GET /api/notifications - Liste des notifications
router.get('/', authMiddleware, async (req, res) => {
    // Retourner les notifications de l'utilisateur
    // Paramètres: limit, offset, unread_only
});

// GET /api/notifications/unread-count - Nombre non lues
router.get('/unread-count', authMiddleware, async (req, res) => {
    // Retourner le compteur de notifications non lues
});

// PATCH /api/notifications/:id/read - Marquer comme lue
router.patch('/:id/read', authMiddleware, async (req, res) => {
    // Marquer une notification comme lue
});

// PATCH /api/notifications/mark-all-read - Tout marquer lu
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
    // Marquer toutes les notifications comme lues
});

// DELETE /api/notifications/:id - Supprimer
router.delete('/:id', authMiddleware, async (req, res) => {
    // Supprimer une notification
});
```

### Logique de Création

#### Dans `server/routes/groups.js`

Modifier la route POST `/:groupId/messages` :

```javascript
// Après insertion du message
const members = db.prepare(`
    SELECT user_id FROM group_members 
    WHERE group_id = ? AND user_id != ?
`).all(groupId, req.user.id);

// Créer une notification pour chaque membre
const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, type, group_id, related_user_id, message, link)
    VALUES (?, 'group_message', ?, ?, ?, ?)
`);

members.forEach(member => {
    insertNotif.run(
        member.user_id,
        groupId,
        req.user.id,
        `${req.user.username} a posté dans ${groupName}`,
        `/groups/${groupId}`
    );
});
```

---

## 🎨 Interface Utilisateur

### Icône de Notification

Dans le header de l'app (`index.html`) :

```html
<button id="notificationBtn" class="btn-icon" title="Notifications">
    🔔
    <span id="notificationBadge" class="notification-badge hidden">0</span>
</button>
```

### Dropdown Notifications

```html
<div id="notificationDropdown" class="dropdown hidden">
    <div class="dropdown-header">
        <h3>Notifications</h3>
        <button id="markAllRead">Tout marquer comme lu</button>
    </div>
    <div id="notificationsList">
        <!-- Liste des notifications -->
    </div>
</div>
```

### Styles CSS

```css
.notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #EF4444;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 0.75rem;
    font-weight: bold;
}

.notification-item {
    padding: 1rem;
    border-bottom: 1px solid #333;
    cursor: pointer;
    transition: background 0.2s;
}

.notification-item:hover {
    background: #2a2a2a;
}

.notification-item.unread {
    background: rgba(212, 175, 55, 0.1);
    border-left: 3px solid #D4AF37;
}

.notification-time {
    font-size: 0.8rem;
    color: #666;
}
```

---

## ⚡ Temps Réel (Option WebSocket)

### Pour des notifications en temps réel :

```javascript
// server/websocket.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Map user_id -> WebSocket connection
const connections = new Map();

wss.on('connection', (ws, req) => {
    const userId = authenticateUser(req); // Extraire du token
    connections.set(userId, ws);
    
    ws.on('close', () => {
        connections.delete(userId);
    });
});

// Fonction pour envoyer notification
function sendNotification(userId, notification) {
    const ws = connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'notification',
            data: notification
        }));
    }
}

module.exports = { sendNotification };
```

### Côté client :

```javascript
// public/js/notifications.js
let ws = null;

function connectNotifications() {
    const token = localStorage.getItem('token');
    ws = new WebSocket(`ws://localhost:8080?token=${token}`);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
            showNotificationToast(data.data);
            updateNotificationBadge();
        }
    };
    
    ws.onclose = () => {
        setTimeout(connectNotifications, 3000); // Reconnect
    };
}
```

---

## 📱 Alternative : Polling

Si WebSocket est trop complexe, utiliser du polling :

```javascript
// Vérifier toutes les 30 secondes
setInterval(async () => {
    const response = await fetch(API_URL + '/api/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    updateNotificationBadge(data.count);
}, 30000);
```

---

## 🎯 Implémentation par Étapes

### Phase 1 : Base (Essentiel)
1. ✅ Créer table `notifications`
2. ✅ Routes API notifications
3. ✅ Créer notifications pour nouveaux messages
4. ✅ Interface badge + dropdown
5. ✅ Marquer comme lu

### Phase 2 : Améliorations
1. Notifications pour nouveau membre
2. Notifications pour réactions
3. Notifications pour mentions @
4. Paramètres utilisateur (activer/désactiver)

### Phase 3 : Temps Réel
1. WebSocket pour notifications instantanées
2. Son de notification (optionnel)
3. Notifications browser (Push API)

---

## 🔧 Commandes Utiles

### Migration notifications

```bash
sqlite3 server/database/challenges.db < server/database/notifications-migration.sql
```

### Tester les notifications

```sql
-- Créer une notification test
INSERT INTO notifications (user_id, type, group_id, message, link)
VALUES (2, 'group_message', 1, 'Test notification', '/groups/1');

-- Voir mes notifications
SELECT * FROM notifications WHERE user_id = 2 ORDER BY created_at DESC;

-- Compter non lues
SELECT COUNT(*) FROM notifications WHERE user_id = 2 AND is_read = 0;
```

---

## 📊 Métriques à Suivre

- Nombre de notifications créées par jour
- Taux de lecture des notifications
- Temps moyen avant lecture
- Notifications par type
- Utilisateurs les plus actifs

---

## 🚀 Prochaines Étapes Recommandées

1. **Créer la migration** : `notifications-migration.sql`
2. **Créer les routes API** : `/server/routes/notifications.js`
3. **Modifier routes groupes** : Ajouter création notif dans messages
4. **Créer interface** : Badge + dropdown notifications
5. **Tester** : Créer messages et vérifier notifications

---

## 📝 Notes Importantes

- ⚠️ Nettoyer les anciennes notifications (> 30 jours)
- ⚠️ Limiter le nombre de notifications stockées par utilisateur
- ⚠️ Prévoir désactivation notifications par groupe
- ⚠️ Respecter les préférences utilisateur
- ⚠️ Optimiser les requêtes (index sur user_id + is_read)

---

**Status** : 📋 Spécifications prêtes  
**Priorité** : 🔴 Haute  
**Effort estimé** : 4-6 heures  
**Dépendances** : Groupes de discussion (✅ Déjà implémenté)

---

**Prêt pour implémentation ! 🚀**
