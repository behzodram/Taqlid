// Guruhlar ro'yxatini yuklash
function loadGroupsList() {
    db.collection('groups').get().then(snapshot => {
        const groupsList = document.getElementById('groupsList');
        groupsList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const group = doc.data();
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            groupItem.innerHTML = `
                <img src="${group.photo}" alt="${group.name}">
                <div class="group-info">
                    <h3>${group.name}</h3>
                    <p>${group.lastMessage || 'Xabar yo\'q'}</p>
                </div>
            `;
            
            // Bosganda URL o'zgartirish
            groupItem.onclick = () => {
                window.location.hash = `#@${doc.id}`;
            };
            
            groupsList.appendChild(groupItem);
        });
    });
}

// Xabar yuborish
document.getElementById('sendBtn').addEventListener('click', () => {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (text && router.currentGroup) {
        db.collection('groups').doc(router.currentGroup)
          .collection('messages').add({
              text: text,
              sender: 'Siz', // Keyinchalik auth qo'shasiz
              timestamp: Date.now()
          });
        
        input.value = '';
    }
});

// Sahifa yuklanganda guruhlarni ko'rsatish
loadGroupsList();