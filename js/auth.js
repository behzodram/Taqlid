// User session manager
class UserSession {
    constructor() {
        this.userId = null;
        this.userData = null;
    }

    init() {
        // DB mavjudligini kutish
        if (!db) {
            console.error('DB initsializatsiya qilinmagan!');
            setTimeout(() => this.init(), 500);
            return;
        }

        // LocalStorage'dan user ID olish
        this.userId = localStorage.getItem('userId');
        
        if (!this.userId) {
            // Yangi user yaratish
            this.createNewUser();
        } else {
            // Mavjud userni yuklash
            this.loadUser();
        }
    }

    createNewUser() {
        // Unique ID yaratish
        this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', this.userId);
        
        // User profilini sozlash modalini ko'rsatish
        this.showProfileSetup();
    }

    showProfileSetup() {
        const modal = document.getElementById('userProfileModal');
        modal.style.display = 'block';
        
        // Modal yopishni o'chirish (majburiy to'ldirish)
        const closeBtn = document.querySelector('.close-profile');
        if (closeBtn) {
            closeBtn.style.display = 'none';
        }
        
        showToast('Iltimos, profilingizni sozlang', 'info');
    }

    async loadUser() {
        try {
            if (!db) {
                throw new Error('DB mavjud emas');
            }

            const doc = await db.collection('users').doc(this.userId).get();
            
            if (doc.exists) {
                this.userData = doc.data();
                this.updateUI();
            } else {
                // Agar user ma'lumotlari yo'q bo'lsa, profilni to'ldirish
                this.showProfileSetup();
            }
        } catch (error) {
            console.error('User yuklashda xato:', error);
            // Xatolik bo'lsa ham profil sozlashni ko'rsatish
            this.showProfileSetup();
        }
    }

    async saveUser(name, avatarUrl) {
        this.userData = {
            userId: this.userId,
            name: name,
            avatar: avatarUrl,
            createdAt: Date.now(),
            lastSeen: Date.now()
        };

        try {
            if (!db) {
                throw new Error('DB mavjud emas');
            }

            await db.collection('users').doc(this.userId).set(this.userData);
            localStorage.setItem('userName', name);
            localStorage.setItem('userAvatar', avatarUrl);
            this.updateUI();
            showToast('✓ Profil saqlandi', 'success');
            return true;
        } catch (error) {
            console.error('Saqlashda xato:', error);
            showToast('Profilni saqlab bo\'lmadi: ' + error.message, 'error');
            return false;
        }
    }

    updateUI() {
        if (this.userData) {
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.getElementById('userAvatar');
            const userStatusEl = document.getElementById('userStatus');
            
            if (userNameEl) userNameEl.textContent = this.userData.name;
            if (userAvatarEl) userAvatarEl.src = this.userData.avatar;
            if (userStatusEl) userStatusEl.textContent = 'Online';
        }
    }

    async updateLastSeen() {
        if (this.userId && db) {
            try {
                await db.collection('users').doc(this.userId).update({
                    lastSeen: Date.now()
                });
            } catch (error) {
                console.error('LastSeen yangilashda xato:', error);
            }
        }
    }

    getUserName() {
        return this.userData?.name || 'Anonim';
    }

    getUserAvatar() {
        return this.userData?.avatar || 'https://via.placeholder.com/40';
    }

    getUserId() {
        return this.userId;
    }
}

// Global user session
let userSession = null;

// DOMContentLoaded da initsializatsiya qilish
document.addEventListener('DOMContentLoaded', () => {
    // UserSession yaratish
    userSession = new UserSession();
    userSession.init();
    
    // Har 5 daqiqada lastSeen yangilash
    setInterval(() => {
        if (userSession) {
            userSession.updateLastSeen();
        }
    }, 5 * 60 * 1000);
    
    setupUserProfileHandlers();
});

// User profil modalini boshqarish
function setupUserProfileHandlers() {
    const userProfileModal = document.getElementById('userProfileModal');
    const closeProfile = document.querySelector('.close-profile');
    const userInfo = document.getElementById('userInfo');

    if (userInfo) {
        userInfo.addEventListener('click', () => {
            // Mavjud ma'lumotlarni ko'rsatish
            if (userSession && userSession.userData) {
                document.getElementById('userNameInput').value = userSession.userData.name;
                document.getElementById('userAvatarPreview').src = userSession.userData.avatar;
            }
            userProfileModal.style.display = 'block';
            if (closeProfile) closeProfile.style.display = 'block';
        });
    }

    if (closeProfile) {
        closeProfile.onclick = () => {
            if (userSession && userSession.userData) {
                userProfileModal.style.display = 'none';
            }
        };
    }

    // Avatar tanlash
    const selectAvatarBtn = document.getElementById('selectAvatarBtn');
    if (selectAvatarBtn) {
        selectAvatarBtn.addEventListener('click', () => {
            document.getElementById('userAvatarFile').click();
        });
    }

    const userAvatarFile = document.getElementById('userAvatarFile');
    if (userAvatarFile) {
        userAvatarFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Preview ko'rsatish
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('userAvatarPreview').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // User profil saqlash
    const userProfileForm = document.getElementById('userProfileForm');
    if (userProfileForm) {
        userProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('userNameInput').value.trim();
            const avatarFile = document.getElementById('userAvatarFile').files[0];
            
            if (!name) {
                showToast('Iltimos, ismingizni kiriting!', 'error');
                return;
            }
            
            if (!userSession) {
                showToast('User session mavjud emas!', 'error');
                return;
            }
            
            showLoading();
            
            let avatarUrl = userSession.getUserAvatar();
            
            // Agar yangi avatar tanlangan bo'lsa, yuklash
            if (avatarFile) {
                avatarUrl = await uploadImage(avatarFile, `avatars/${userSession.userId}`);
                if (!avatarUrl) {
                    hideLoading();
                    showToast('Rasmni yuklab bo\'lmadi!', 'error');
                    return;
                }
            }
            
            const success = await userSession.saveUser(name, avatarUrl);
            hideLoading();
            
            if (success) {
                userProfileModal.style.display = 'none';
                if (closeProfile) closeProfile.style.display = 'block';
            }
        });
    }
}