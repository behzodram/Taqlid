// Guruhlar ro'yxatini yuklash
function loadGroupsList() {
    if (!db) {
        console.error('DB mavjud emas');
        setTimeout(loadGroupsList, 500);
        return;
    }

    db.collection('groups')
      .orderBy('timestamp', 'desc')
      .onSnapshot(
          snapshot => {
              const groupsList = document.getElementById('groupsList');
              groupsList.innerHTML = '';
              
              if (snapshot.empty) {
                  groupsList.innerHTML = '<div class="no-groups">Guruhlar yo\'q. Yangi guruh yarating!</div>';
                  return;
              }
              
              snapshot.forEach(doc => {
                  const group = doc.data();
                  const groupItem = createGroupItem(group, doc.id);
                  groupsList.appendChild(groupItem);
              });
          },
          error => {
              console.error('Guruhlarni yuklashda xato:', error);
              showToast('Internet aloqasini tekshiring', 'error');
          }
      );
}

function createGroupItem(group, username) {
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    groupItem.dataset.username = username;
    
    groupItem.innerHTML = `
        <img src="${group.photo || 'https://via.placeholder.com/50'}" 
             alt="${group.name}"
             onerror="this.src='https://via.placeholder.com/50'">
        <div class="group-info">
            <h3>${group.name}</h3>
            <p class="group-username">@${username}</p>
        </div>
    `;
    
    groupItem.onclick = () => {
        window.location.hash = `#@${username}`;
        document.querySelectorAll('.group-item').forEach(item => {
            item.classList.remove('active');
        });
        groupItem.classList.add('active');
    };
    
    return groupItem;
}

// Xabar yuborish
function setupMessageSending() {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) {
        showToast('Xabar yozing!', 'error');
        return;
    }
    
    if (!router || !router.currentGroup) {
        showToast('Guruh tanlanmagan!', 'error');
        return;
    }

    if (!userSession) {
        showToast('User session mavjud emas!', 'error');
        return;
    }

    if (!db) {
        showToast('Database mavjud emas!', 'error');
        return;
    }
    
    // User sessiyadan ism olish
    const senderName = userSession.getUserName();
    const senderAvatar = userSession.getUserAvatar();
    
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳';
    
    db.collection('groups').doc(router.currentGroup)
      .collection('messages').add({
          text: text,
          sender: senderName,
          senderAvatar: senderAvatar,
          senderId: userSession.getUserId(),
          timestamp: Date.now()
      })
      .then(() => {
          input.value = '';
          sendBtn.disabled = false;
          sendBtn.textContent = '📤';
          
          return db.collection('groups').doc(router.currentGroup).update({
              lastMessage: text,
              lastMessageTime: Date.now()
          });
      })
      .catch(error => {
          console.error('Xabar yuborishda xato:', error);
          showToast('Xabar yuborilmadi! Qayta urinib ko\'ring.', 'error');
          sendBtn.disabled = false;
          sendBtn.textContent = '📤';
      });
}

// Modal boshqaruvi
function setupModals() {
    const addGroupModal = document.getElementById('addGroupModal');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const closeModal = document.querySelector('.close');

    if (addGroupBtn) {
        addGroupBtn.onclick = () => {
            addGroupModal.style.display = 'block';
            // Formni tozalash
            const form = document.getElementById('addGroupForm');
            if (form) form.reset();
            document.getElementById('groupPhotoPreview').src = 'https://via.placeholder.com/100';
            document.getElementById('photoFileName').textContent = '';
        };
    }

    if (closeModal) {
        closeModal.onclick = () => {
            addGroupModal.style.display = 'none';
        };
    }

    window.onclick = (event) => {
        if (event.target == addGroupModal) {
            addGroupModal.style.display = 'none';
        }
        const groupInfoModal = document.getElementById('groupInfoModal');
        if (event.target == groupInfoModal) {
            groupInfoModal.style.display = 'none';
        }
    };
}

// Guruh rasmi tanlash
function setupGroupPhotoUpload() {
    const selectPhotoBtn = document.getElementById('selectPhotoBtn');
    const groupPhotoFile = document.getElementById('groupPhotoFile');

    if (selectPhotoBtn) {
        selectPhotoBtn.addEventListener('click', () => {
            groupPhotoFile.click();
        });
    }

    if (groupPhotoFile) {
        groupPhotoFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Preview ko'rsatish
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('groupPhotoPreview').src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Fayl nomini ko'rsatish
                document.getElementById('photoFileName').textContent = file.name;
            }
        });
    }
}

// Guruh qo'shish
function setupGroupCreation() {
    const addGroupForm = document.getElementById('addGroupForm');
    
    if (addGroupForm) {
        addGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('groupNameInput').value.trim();
            const username = document.getElementById('groupUsernameInput').value.trim().toLowerCase();
            const photoFile = document.getElementById('groupPhotoFile').files[0];
            const description = document.getElementById('groupDescInput').value.trim();
            
            // Username validatsiya
            if (!/^[a-z0-9_]+$/.test(username)) {
                showToast('Username faqat kichik harflar, raqamlar va _ bo\'lishi kerak!', 'error');
                return;
            }
            
            if (username.length < 3) {
                showToast('Username kamida 3 belgidan iborat bo\'lishi kerak!', 'error');
                return;
            }

            if (!db) {
                showToast('Database mavjud emas!', 'error');
                return;
            }

            if (!userSession) {
                showToast('User session mavjud emas!', 'error');
                return;
            }
            
            showLoading();
            
            try {
                // Username band emasligini tekshirish
                const doc = await db.collection('groups').doc(username).get();
                
                if (doc.exists) {
                    hideLoading();
                    showToast('Bu username band! Boshqa tanlang.', 'error');
                    return;
                }
                
                // Agar rasm tanlangan bo'lsa, yuklash
                let photoUrl = 'https://via.placeholder.com/100';
                if (photoFile) {
                    photoUrl = await uploadImage(photoFile, `groups/${username}/photo`);
                    if (!photoUrl) {
                        hideLoading();
                        showToast('Rasmni yuklab bo\'lmadi!', 'error');
                        return;
                    }
                }
                
                // Guruh yaratish
                await db.collection('groups').doc(username).set({
                    name: name,
                    username: username,
                    photo: photoUrl,
                    description: description,
                    members: 0,
                    timestamp: Date.now(),
                    lastMessage: '',
                    lastMessageTime: null,
                    createdBy: userSession.getUserId(),
                    createdByName: userSession.getUserName()
                });
                
                hideLoading();
                showToast('✓ Guruh muvaffaqiyatli yaratildi!', 'success');
                document.getElementById('addGroupModal').style.display = 'none';
                document.getElementById('addGroupForm').reset();
                
                // Yangi guruhga o'tish
                setTimeout(() => {
                    window.location.hash = `#@${username}`;
                }, 500);
                
            } catch (error) {
                console.error('Guruh yaratishda xato:', error);
                hideLoading();
                
                if (error.code === 'permission-denied') {
                    showToast('Ruxsat yo\'q! Firebase sozlamalarini tekshiring.', 'error');
                } else if (error.code === 'unavailable') {
                    showToast('Internet aloqasi yo\'q!', 'error');
                } else {
                    showToast('Guruh yaratishda xatolik! Qayta urinib ko\'ring.', 'error');
                }
            }
        });
    }
}

// Havolani nusxalash
function setupShareButton() {
    const shareBtn = document.getElementById('shareBtn');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const username = shareBtn.dataset.username;
            const link = `${window.location.origin}${window.location.pathname}#@${username}`;
            copyToClipboard(link);
        });
    }
}

// Guruh ma'lumotini ko'rsatish
function setupGroupInfo() {
    const groupInfoModal = document.getElementById('groupInfoModal');
    const groupInfoBtn = document.getElementById('groupInfoBtn');
    const closeInfo = document.querySelector('.close-info');

    if (groupInfoBtn) {
        groupInfoBtn.onclick = async () => {
            if (!router || !router.currentGroup) {
                showToast('Guruh tanlanmagan!', 'error');
                return;
            }

            if (!db) {
                showToast('Database mavjud emas!', 'error');
                return;
            }
            
            try {
                const doc = await db.collection('groups').doc(router.currentGroup).get();
                if (doc.exists) {
                    const data = doc.data();
                    const link = `${window.location.origin}${window.location.pathname}#@${router.currentGroup}`;
                    
                    const messagesCount = await db.collection('groups')
                        .doc(router.currentGroup)
                        .collection('messages')
                        .get()
                        .then(snap => snap.size);
                    
                    document.getElementById('groupInfoContent').innerHTML = `
                        <img src="${data.photo}" alt="${data.name}" 
                             onerror="this.src='https://via.placeholder.com/100'"
                             style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">
                        <h2>${data.name}</h2>
                        <p><strong>Username:</strong> @${router.currentGroup}</p>
                        <p><strong>A'zolar:</strong> ${data.members || 0} ta</p>
                        <p><strong>Xabarlar:</strong> ${messagesCount} ta</p>
                        <p><strong>Ta'rif:</strong> ${data.description || 'Yo\'q'}</p>
                        <p><strong>Yaratuvchi:</strong> ${data.createdByName || 'Noma\'lum'}</p>
                        <p><strong>Yaratilgan:</strong> ${new Date(data.timestamp).toLocaleDateString('uz-UZ')}</p>
                        <hr>
                        <p><strong>Guruh havolasi:</strong></p>
                        <div class="link-box">
                            <input type="text" id="groupLinkInput" value="${link}" readonly>
                            <button onclick="copyGroupLink()">📋</button>
                        </div>
                    `;
                    groupInfoModal.style.display = 'block';
                }
            } catch (error) {
                console.error('Ma\'lumot yuklashda xato:', error);
                showToast('Ma\'lumot yuklanmadi!', 'error');
            }
        };
    }

    if (closeInfo) {
        closeInfo.onclick = () => {
            groupInfoModal.style.display = 'none';
        };
    }
}

// Global funksiya
function copyGroupLink() {
    const input = document.getElementById('groupLinkInput');
    if (input) {
        copyToClipboard(input.value);
    }
}

// Qidiruv
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const groups = document.querySelectorAll('.group-item');
            
            groups.forEach(group => {
                const name = group.querySelector('h3').textContent.toLowerCase();
                const username = group.dataset.username.toLowerCase();
                
                if (name.includes(query) || username.includes(query)) {
                    group.style.display = 'flex';
                } else {
                    group.style.display = 'none';
                }
            });
        });
    }
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', () => {
    // Barcha event handlerlarni o'rnatish
    setupMessageSending();
    setupModals();
    setupGroupPhotoUpload();
    setupGroupCreation();
    setupShareButton();
    setupGroupInfo();
    setupSearch();
    
    // Guruhlar ro'yxatini yuklash
    loadGroupsList();
    
    // Internet holatini tekshirish
    if (!navigator.onLine) {
        showToast('Internet aloqasi yo\'q. Offline rejimda ishlayapsiz.', 'error');
    }
});