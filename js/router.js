class Router {
    constructor() {
        this.currentGroup = null;
    }

    init() {
        window.addEventListener('load', () => {
            this.handleRoute();
        });

        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });
    }

    handleRoute() {
        const hash = window.location.hash;
        
        if (hash.startsWith('#@')) {
            const groupUsername = hash.replace('#@', '');
            this.loadGroup(groupUsername);
        } else {
            this.showWelcomeScreen();
        }
    }

    loadGroup(groupUsername) {
        if (!db) {
            console.error('DB mavjud emas');
            return;
        }

        this.currentGroup = groupUsername;
        
        db.collection('groups').doc(groupUsername).get()
            .then(doc => {
                if (doc.exists) {
                    const groupData = doc.data();
                    this.displayGroup(groupData, groupUsername);
                    this.loadMessages(groupUsername);
                } else {
                    showToast('Guruh topilmadi!', 'error');
                    this.showWelcomeScreen();
                }
            })
            .catch(error => {
                console.error('Xato:', error);
                showToast('Guruhni yuklashda xatolik!', 'error');
            });
    }

    displayGroup(groupData, username) {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('chatHeader').style.display = 'flex';
        document.getElementById('inputArea').style.display = 'flex';
        
        document.getElementById('groupPhoto').src = groupData.photo || 'https://via.placeholder.com/40';
        document.getElementById('groupName').textContent = groupData.name;
        document.getElementById('groupMembers').textContent = `${groupData.members || 0} ta a'zo`;
        document.getElementById('shareBtn').dataset.username = username;
    }

    loadMessages(groupUsername) {
        if (!db) {
            console.error('DB mavjud emas');
            return;
        }

        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '<div class="loading">Yuklanmoqda...</div>';

        db.collection('groups').doc(groupUsername)
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .limit(100)
          .onSnapshot(snapshot => {
              messagesContainer.innerHTML = '';
              
              if (snapshot.empty) {
                  messagesContainer.innerHTML = '<div class="no-messages">Xabarlar yo\'q. Birinchi bo\'lib yozing!</div>';
                  return;
              }
              
              snapshot.forEach(doc => {
                  const msg = doc.data();
                  this.addMessageToUI(msg);
              });
              
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
          });
    }

    addMessageToUI(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const msgDiv = document.createElement('div');
        
        // O'z xabarimmi yoki boshqaniki?
        const isMyMessage = userSession && message.senderId === userSession.getUserId();
        msgDiv.className = isMyMessage ? 'message my-message' : 'message';
        
        const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';
        
        const avatar = message.senderAvatar || 'https://via.placeholder.com/30';
        
        msgDiv.innerHTML = `
            ${!isMyMessage ? `<img class="message-avatar" src="${avatar}" alt="${message.sender}">` : ''}
            <div class="message-content">
                ${!isMyMessage ? `<div class="message-sender">${message.sender || 'Anonim'}</div>` : ''}
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(msgDiv);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showWelcomeScreen() {
        this.currentGroup = null;
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('chatHeader').style.display = 'none';
        document.getElementById('inputArea').style.display = 'none';
        document.getElementById('messagesContainer').innerHTML = '';
    }
}

// Router yaratish va initsializatsiya
let router = null;

document.addEventListener('DOMContentLoaded', () => {
    router = new Router();
    router.init();
});