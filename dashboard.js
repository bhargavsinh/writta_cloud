import {
  requireSession, clearSession, getUserDisplayName,
  listBooks, deleteBook, createBook,
  getLegacyBook, clearLegacyBook,
} from './store.js';

const username = requireSession();
if (username) init();

function init() {
  document.getElementById('user-label').textContent = `હુકમ, ${getUserDisplayName(username)}`;
  document.getElementById('btn-logout').addEventListener('click', () => {
    clearSession();
    window.location.href = './login.html';
  });

  const legacy = getLegacyBook();
  if (legacy && listBooks(username).length === 0) {
    document.getElementById('import-banner').style.display = 'flex';
    document.getElementById('btn-import').addEventListener('click', () => {
      const id = createBook(username, legacy);
      clearLegacyBook();
      window.location.href = `./index.html?book=${id}`;
    });
  }

  renderGrid();
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('gu-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderGrid() {
  const grid = document.getElementById('book-grid');
  grid.innerHTML = '';
  const books = listBooks(username);

  books.forEach((b) => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <div class="bt">${b.title || 'અનામી ગ્રંથ'}</div>
      <div class="ba">${b.author || ''}</div>
      <div class="bm"><span>${b.wordCount || 0} શબ્દ</span><span>${fmtDate(b.updatedAt)}</span></div>
      <div class="bd"><span data-id="${b.id}">✕ કાઢી નાખો</span></div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.dataset.id) return;
      window.location.href = `./index.html?book=${b.id}`;
    });
    card.querySelector('[data-id]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`"${b.title}" કાયમ માટે કાઢી નાખવું છે?`)) {
        deleteBook(username, b.id);
        renderGrid();
      }
    });
    grid.appendChild(card);
  });

  const newCard = document.createElement('div');
  newCard.className = 'book-card new-book-card';
  newCard.innerHTML = `<div style="font-size:26px">+</div><div>નવો ગ્રંથ શરૂ કરો</div>`;
  newCard.addEventListener('click', () => { window.location.href = './bookform.html'; });
  grid.appendChild(newCard);
}
