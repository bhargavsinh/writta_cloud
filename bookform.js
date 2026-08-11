import { requireSession, FRONT_DEFS, BACK_DEFS, uid, buildBook, createBook } from './store.js';

const username = requireSession();
if (username) init();

function init() {
  renderChecks('front-checks', FRONT_DEFS);
  renderChecks('back-checks', BACK_DEFS);
  renderPartsBuilder();
  document.getElementById('btn-add-part').addEventListener('click', () => { addPart(); renderPartsBuilder(); });
  document.getElementById('book-form').addEventListener('submit', onSubmit);
}

function renderChecks(containerId, defs) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  defs.forEach((d) => {
    const row = document.createElement('label');
    row.className = 'check-item';
    row.innerHTML = `<input type="checkbox" data-key="${d.key}" ${d.defaultIncluded ? 'checked' : ''} /> ${d.label}`;
    el.appendChild(row);
  });
}

// ---- Parts/Chapters state ----
let partsState = [{ id: uid(), title: 'ભાગ 1', chapters: [{ id: uid(), title: 'પ્રકરણ 1' }] }];

function addPart() {
  partsState.push({ id: uid(), title: `ભાગ ${partsState.length + 1}`, chapters: [{ id: uid(), title: 'પ્રકરણ 1' }] });
}
function removePart(id) {
  if (partsState.length <= 1) return;
  partsState = partsState.filter((p) => p.id !== id);
  renderPartsBuilder();
}
function addChapter(partId) {
  const part = partsState.find((p) => p.id === partId);
  part.chapters.push({ id: uid(), title: `પ્રકરણ ${part.chapters.length + 1}` });
  renderPartsBuilder();
}
function removeChapter(partId, chId) {
  const part = partsState.find((p) => p.id === partId);
  if (part.chapters.length <= 1) return;
  part.chapters = part.chapters.filter((c) => c.id !== chId);
  renderPartsBuilder();
}

function renderPartsBuilder() {
  const root = document.getElementById('parts-builder');
  root.innerHTML = '';
  partsState.forEach((part) => {
    const block = document.createElement('div');
    block.className = 'part-block';

    const head = document.createElement('div');
    head.className = 'part-block-head';
    const titleInput = document.createElement('input');
    titleInput.value = part.title;
    titleInput.addEventListener('input', (e) => { part.title = e.target.value; });
    const addChBtn = document.createElement('button');
    addChBtn.type = 'button'; addChBtn.className = 'mini-btn'; addChBtn.textContent = '+';
    addChBtn.title = 'નવું પ્રકરણ';
    addChBtn.addEventListener('click', () => addChapter(part.id));
    const delPartBtn = document.createElement('button');
    delPartBtn.type = 'button'; delPartBtn.className = 'mini-btn del'; delPartBtn.textContent = '✕';
    delPartBtn.title = 'Part કાઢી નાખો';
    delPartBtn.addEventListener('click', () => removePart(part.id));
    head.appendChild(titleInput); head.appendChild(addChBtn); head.appendChild(delPartBtn);
    block.appendChild(head);

    part.chapters.forEach((ch) => {
      const row = document.createElement('div');
      row.className = 'chapter-row';
      const chInput = document.createElement('input');
      chInput.value = ch.title;
      chInput.addEventListener('input', (e) => { ch.title = e.target.value; });
      const delChBtn = document.createElement('button');
      delChBtn.type = 'button'; delChBtn.className = 'mini-btn del'; delChBtn.textContent = '✕';
      delChBtn.addEventListener('click', () => removeChapter(part.id, ch.id));
      row.appendChild(chInput); row.appendChild(delChBtn);
      block.appendChild(row);
    });

    root.appendChild(block);
  });
}

function collectChecks(containerId) {
  const out = {};
  document.querySelectorAll(`#${containerId} input[type="checkbox"]`).forEach((cb) => { out[cb.dataset.key] = cb.checked; });
  return out;
}

function onSubmit(e) {
  e.preventDefault();
  const meta = {
    title: document.getElementById('f-title').value || 'અનામી ગ્રંથ',
    subtitle: document.getElementById('f-subtitle').value,
    author: document.getElementById('f-author').value,
    publisher: document.getElementById('f-publisher').value,
    place: document.getElementById('f-place').value,
    year: document.getElementById('f-year').value,
    edition: document.getElementById('f-edition').value,
    isbn: document.getElementById('f-isbn').value,
    copyrightText: document.getElementById('f-copyright').value,
  };
  const frontIncluded = collectChecks('front-checks');
  const backIncluded = collectChecks('back-checks');
  const parts = partsState.map((p) => ({
    id: p.id, title: p.title,
    chapters: p.chapters.map((c) => ({ id: c.id, title: c.title, content: '<p></p>' })),
  }));

  const book = buildBook({ meta, frontIncluded, backIncluded, parts });
  const id = createBook(username, book);
  window.location.href = `./index.html?book=${id}`;
}
