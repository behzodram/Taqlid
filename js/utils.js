// Utility funksiyalar

// Toast xabarnoma
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Loading ko'rsatish
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Rasm yuklash funksiyasi
async function uploadImage(file, path) {
    try {
        // Tekshirish
        if (!storage) {
            throw new Error('Storage initsializatsiya qilinmagan');
        }
        
        // Rasm hajmini tekshirish (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Rasm hajmi 5MB dan oshmasligi kerak!', 'error');
            return null;
        }
        
        // Rasm formatini tekshirish
        if (!file.type.startsWith('image/')) {
            showToast('Faqat rasm fayllari!', 'error');
            return null;
        }
        
        // Storage'ga yuklash
        const storageRef = storage.ref();
        const imageRef = storageRef.child(path);
        
        // Upload
        const snapshot = await imageRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        return downloadURL;
    } catch (error) {
        console.error('Rasm yuklashda xato:', error);
        showToast('Rasm yuklanmadi: ' + error.message, 'error');
        return null;
    }
}

// Clipboard'ga nusxalash
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast('✓ Havola nusxalandi!', 'success');
            })
            .catch(() => {
                fallbackCopy(text);
            });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('✓ Havola nusxalandi!', 'success');
    } catch (err) {
        showToast('Nusxalashda xato!', 'error');
    }
    document.body.removeChild(textarea);
}

// Connection status monitor
window.addEventListener('online', () => {
    showToast('✓ Internet ulandi', 'success');
});

window.addEventListener('offline', () => {
    showToast('⚠ Internet aloqasi yo\'q', 'error');
});