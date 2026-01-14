class Router {
    constructor() {
        this.currentGroup = null;
        this.init();
    }

    init() {
        // Sahifa yuklanganda
        window.addEventListener('load', () => {
            this.handleRoute();
        });

        // URL o'zgarganda
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });
    }

    handleRoute() {
        // URL dan guruh nomini olish
        const hash = window.location.hash; // #@guruh_nomi
        
        if (hash.startsWith('#@')) {
            const groupName = hash.replace('#@', '');
            this.loadGroup(groupName);
        } else {
            // Agar guruh tanlanmagan bo'lsa
            this.showWelcomeScreen();
        }
    }

    loadGroup(groupName) {
        this.currentGroup = groupName;
        
        // Guruh ma'lumotlarini yuklash
        db.collection('groups').doc(groupName).get()
            .then(doc => {
                if (doc.exists) {
                    const groupData = doc.data();
                    this.displayGroup(groupData);
                    this.loadMessages(groupName);
                } else {
                    console.log('Guruh topilmadi');
                }
            });
    }

    displayGroup(groupData) {
        const chatHeader = document.getElementById('chatHeader');
        chatHeader.innerHTML = `
            <img src="${groupData.photo}" alt="${groupData.name}">
            <div>
                <h2>${groupData.name}</h2>
                <p>${groupData.members} ta a'zo</p>
            </div>
        `;
    }

    loadMessages(groupName) {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = ''; // Tozalash

        // Real-time xabarlarni tinglash
        db.collection('groups').doc(groupName)
          .collection('messages')
          .orderBy('timestamp', 'asc')
          .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {
                  if (change.type === 'added') {
                      const msg = change.doc.data();
                      this.addMessageToUI(msg);
                  }
              });
          });
    }

    addMessageToUI(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        msgDiv.innerHTML = `
            <div class="message-sender">${message.sender}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showWelcomeScreen() {
        document.getElementById('chatArea').innerHTML = `
            <div class="welcome">
                <h1>Guruh tanlang</h1>
            </div>
        `;
    }
}

// Router yaratish
const router = new Router();