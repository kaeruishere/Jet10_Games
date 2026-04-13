import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDIYz3jWy0W8dO0HzhBa-2MQyq6nfb2AcU",
    authDomain: "kaeru-jet10-app.firebaseapp.com",
    projectId: "kaeru-jet10-app",
    storageBucket: "kaeru-jet10-app.firebasestorage.app",
    messagingSenderId: "743245476829",
    appId: "1:743245476829:web:ba8a4af6e8c696e9793c34"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const form = document.getElementById('add-game-form');
const btnAdd = document.getElementById('add-game-btn');
const gamesList = document.getElementById('games-list');
const gameCountSpan = document.getElementById('game-count');
const toastEl = document.getElementById('toast');

// Show Toast Notification
function showToast(message, isError = false) {
    toastEl.textContent = message;
    if (isError) {
        toastEl.classList.add('error');
    } else {
        toastEl.classList.remove('error');
    }
    toastEl.classList.add('show');
    
    setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
}

// Add Game Event
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('game-name').value;
    const url = document.getElementById('game-url').value;
    const imageUrl = document.getElementById('game-image').value;
    
    btnAdd.disabled = true;
    btnAdd.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Adding...`;

    try {
        await addDoc(collection(db, "oyunlar"), {
            name: name,
            url: url,
            imageUrl: imageUrl || null,
            createdAt: serverTimestamp()
        });
        
        form.reset();
        showToast(`"${name}" added successfully!`);
    } catch (error) {
        console.error("Error adding document: ", error);
        showToast("Error adding game. Check console for details.", true);
    } finally {
        btnAdd.disabled = false;
        btnAdd.innerHTML = `<span>Add Game</span><i class="fa-solid fa-arrow-right"></i>`;
    }
});

// Delete Game Function (Expose to global scope for inline onclick handler if we use it, but here we add event listener to document)
document.addEventListener('click', async (e) => {
    const dltBtn = e.target.closest('.btn-delete');
    if (dltBtn) {
        if(confirm("Are you sure you want to delete this game?")) {
            const id = dltBtn.getAttribute('data-id');
            const btnIcon = dltBtn.querySelector('i');
            btnIcon.className = 'fa-solid fa-spinner fa-spin';
            
            try {
                await deleteDoc(doc(db, "oyunlar", id));
                showToast("Game deleted!");
            } catch (error) {
                console.error("Error removing document: ", error);
                showToast("Failed to delete game.", true);
                btnIcon.className = 'fa-solid fa-trash';
            }
        }
    }
});

// Listen for Realtime Updates
const q = query(collection(db, "oyunlar"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    gameCountSpan.textContent = snapshot.docs.length;
    gamesList.innerHTML = ''; // Clear current list
    
    if (snapshot.empty) {
        gamesList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-ghost"></i> No games found. Add some!</div>`;
        return;
    }

    snapshot.forEach((docSnap) => {
        const game = docSnap.data();
        const id = docSnap.id;
        
        const card = document.createElement('div');
        card.className = 'game-card';
        
        // Handle Icon logic
        let iconHtml = '';
        if (game.imageUrl) {
            iconHtml = `<div class="game-icon" style="background-image: url('${game.imageUrl}')"></div>`;
        } else {
            // Randomish background logic based on name length or static
            const letters = ['A','B','C','D'];
            const firstLetter = game.name.charAt(0).toUpperCase();
            iconHtml = `<div class="game-icon"><i class="fa-solid fa-gamepad"></i></div>`;
        }

        card.innerHTML = `
            <div class="game-info">
                ${iconHtml}
                <div class="game-details">
                    <span class="game-name">${game.name}</span>
                    <a href="${game.url}" target="_blank" class="game-link"><i class="fa-solid fa-link"></i> ${game.url}</a>
                </div>
            </div>
            <button class="btn-delete" data-id="${id}" title="Delete Game">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        
        gamesList.appendChild(card);
    });
}, (error) => {
    console.error("Firestore Listen Error: ", error);
    gamesList.innerHTML = `<div class="error-state">Failed to load games. Are Firebase Rules permissive?</div>`;
});
