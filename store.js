// ===== Writta — store.js =====
// Shared client-side storage layer: local "accounts" (device-only, not a real server),
// sessions, and multi-book CRUD. All data lives in this browser's localStorage.

export const FRONT_DEFS = [
  { key: 'dedication', label: 'Dedication', defaultIncluded: false, inToc: false },
  { key: 'epigraph', label: 'Epigraph', defaultIncluded: false, inToc: false },
  { key: 'listOfFigures', label: 'List of Figures / Tables', defaultIncluded: false, inToc: true },
  { key: 'foreword', label: 'Foreword', defaultIncluded: false, inToc: true },
  { key: 'preface', label: 'Preface', defaultIncluded: true, inToc: true },
  { key: 'acknowledgements', label: 'Acknowledgements', defaultIncluded: true, inToc: true },
  { key: 'abbreviations', label: 'List of Abbreviations', defaultIncluded: false, inToc: true },
  { key: 'terminology', label: 'Note on Terminology / Transliteration', defaultIncluded: false, inToc: true },
  { key: 'introduction', label: 'Introduction', defaultIncluded: true, inToc: true },
];
export const BACK_DEFS = [
  { key: 'conclusion', label: 'Conclusion', defaultIncluded: true, inToc: true },
  { key: 'afterword', label: 'Afterword', defaultIncluded: false, inToc: true },
  { key: 'appendices', label: 'Appendices', defaultIncluded: false, inToc: true },
  { key: 'notes', label: 'Notes', defaultIncluded: false, inToc: true },
  { key: 'bibliography', label: 'Bibliography / References', defaultIncluded: true, inToc: true },
  { key: 'glossary', label: 'Glossary', defaultIncluded: false, inToc: true },
  { key: 'index', label: 'Index', defaultIncluded: false, inToc: true },
  { key: 'authorBio', label: 'Author Biography', defaultIncluded: true, inToc: true },
  { key: 'aboutBook', label: 'About the Book', defaultIncluded: true, inToc: true },
];

export function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

export function wordCount(html) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

// ================= Password hashing =================
// SHA-256 via SubtleCrypto. This is a *local device gate*, not real security —
// anyone with browser devtools access to this device can read localStorage.
export async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ================= Users =================
const USERS_KEY = 'writta_users';
export function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

export async function registerUser(username, password, name) {
  username = (username || '').trim().toLowerCase();
  if (!username || !password) return { ok: false, error: 'Username અને Password જરૂરી છે' };
  const users = getUsers();
  if (users[username]) return { ok: false, error: 'આ username પહેલેથી નોંધાયેલ છે' };
  users[username] = { passHash: await hashPassword(password), name: name || username };
  saveUsers(users);
  return { ok: true };
}

export async function verifyLogin(username, password) {
  username = (username || '').trim().toLowerCase();
  const users = getUsers();
  const u = users[username];
  if (!u) return { ok: false, error: 'Username મળ્યું નથી' };
  const hash = await hashPassword(password);
  if (hash !== u.passHash) return { ok: false, error: 'પાસવર્ડ ખોટો છે' };
  return { ok: true, name: u.name };
}

// ================= Session =================
const SESSION_KEY = 'writta_session';
export function getSession() { return localStorage.getItem(SESSION_KEY); }
export function setSession(username) { localStorage.setItem(SESSION_KEY, username); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }
export function requireSession() {
  const s = getSession();
  if (!s) { window.location.href = './login.html'; return null; }
  return s;
}
export function getUserDisplayName(username) {
  const users = getUsers();
  return (users[username] && users[username].name) || username;
}

// ================= Books (namespaced per user) =================
function booksIndexKey(u) { return `writta_books_index_${u}`; }
function bookKey(u, id) { return `writta_book_${u}_${id}`; }

export function listBooks(username) {
  try { return JSON.parse(localStorage.getItem(booksIndexKey(username))) || []; } catch (e) { return []; }
}
function saveBooksIndex(username, list) { localStorage.setItem(booksIndexKey(username), JSON.stringify(list)); }

export function defaultBookMeta() {
  return {
    title: 'અનામી ગ્રંથ', subtitle: '', author: '', publisher: 'Shri Devdamanlal Technologies (OPC) Private Limited',
    place: '', year: new Date().getFullYear().toString(), edition: 'પ્રથમ આવૃત્તિ', isbn: '',
    copyrightText: '© {year} {author}. સર્વાધિકાર સુરક્ષિત. આ ગ્રંથનો કોઈ પણ ભાગ પ્રકાશકની લેખિત મંજૂરી વિના પુનઃઉત્પાદિત કરી શકાશે નહીં.',
  };
}

export function buildBook({ meta, frontIncluded, backIncluded, parts }) {
  const front = {};
  FRONT_DEFS.forEach((d) => { front[d.key] = { included: !!(frontIncluded && frontIncluded[d.key]), content: '<p></p>' }; });
  front.epigraph.attribution = '';
  const back = {};
  BACK_DEFS.forEach((d) => { back[d.key] = { included: !!(backIncluded && backIncluded[d.key]), content: '<p></p>' }; });
  return {
    meta: { ...defaultBookMeta(), ...meta },
    front,
    parts: (parts && parts.length) ? parts : [{ id: uid(), title: 'ભાગ 1', chapters: [{ id: uid(), title: 'પ્રકરણ 1', content: '<p></p>' }] }],
    back,
  };
}

export function totalWordCount(book) {
  let total = 0;
  FRONT_DEFS.forEach((d) => { total += wordCount(book.front[d.key].content); });
  BACK_DEFS.forEach((d) => { total += wordCount(book.back[d.key].content); });
  book.parts.forEach((p) => p.chapters.forEach((c) => { total += wordCount(c.content); }));
  return total;
}

export function createBook(username, bookObj) {
  const id = uid();
  localStorage.setItem(bookKey(username, id), JSON.stringify(bookObj));
  const list = listBooks(username);
  list.unshift({ id, title: bookObj.meta.title, author: bookObj.meta.author, updatedAt: Date.now(), wordCount: 0 });
  saveBooksIndex(username, list);
  return id;
}

export function loadBookById(username, id) {
  try { return JSON.parse(localStorage.getItem(bookKey(username, id))); } catch (e) { return null; }
}

export function saveBookById(username, id, book) {
  localStorage.setItem(bookKey(username, id), JSON.stringify(book));
  const list = listBooks(username);
  const idx = list.findIndex((b) => b.id === id);
  const entry = { id, title: book.meta.title, author: book.meta.author, updatedAt: Date.now(), wordCount: totalWordCount(book) };
  if (idx >= 0) list[idx] = entry; else list.unshift(entry);
  saveBooksIndex(username, list);
}

export function deleteBook(username, id) {
  localStorage.removeItem(bookKey(username, id));
  saveBooksIndex(username, listBooks(username).filter((b) => b.id !== id));
}

// ================= Legacy single-book migration (from Writta v2) =================
export function getLegacyBook() {
  try {
    const raw = localStorage.getItem('writta_book_v2');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && parsed.meta && Array.isArray(parsed.parts)) ? parsed : null;
  } catch (e) { return null; }
}
export function clearLegacyBook() { localStorage.removeItem('writta_book_v2'); }
