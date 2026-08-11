// ===== Writta v2 — app.js =====
import { Editor, Node, mergeAttributes } from 'https://esm.sh/@tiptap/core@2.11.5';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.11.5?deps=@tiptap/core@2.11.5';
import Underline from 'https://esm.sh/@tiptap/extension-underline@2.11.5?deps=@tiptap/core@2.11.5';
import TextStyle from 'https://esm.sh/@tiptap/extension-text-style@2.11.5?deps=@tiptap/core@2.11.5';
import FontFamily from 'https://esm.sh/@tiptap/extension-font-family@2.11.5?deps=@tiptap/core@2.11.5';
import Table from 'https://esm.sh/@tiptap/extension-table@2.11.5?deps=@tiptap/core@2.11.5';
import TableRow from 'https://esm.sh/@tiptap/extension-table-row@2.11.5?deps=@tiptap/core@2.11.5';
import TableHeader from 'https://esm.sh/@tiptap/extension-table-header@2.11.5?deps=@tiptap/core@2.11.5';
import TableCell from 'https://esm.sh/@tiptap/extension-table-cell@2.11.5?deps=@tiptap/core@2.11.5';

// ---------- Custom nodes ----------
const PageBreak = Node.create({
  name: 'pageBreak', group: 'block', atom: true,
  parseHTML() { return [{ tag: 'div[data-page-break]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-page-break': 'true', class: 'page-break-marker' }), 'નવું પાનું'];
  },
  addCommands() { return { setPageBreak: () => ({ chain }) => chain().insertContent({ type: this.name }).run() }; },
});

const ResizableImage = Node.create({
  name: 'resizableImage', group: 'block', draggable: true,
  addAttributes() { return { src: { default: null }, alt: { default: '' }, width: { default: '320px' } }; },
  parseHTML() { return [{ tag: 'img[data-resizable]' }]; },
  renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes, { 'data-resizable': 'true' })]; },
  addCommands() { return { setResizableImage: (o) => ({ chain }) => chain().insertContent({ type: this.name, attrs: o }).run() }; },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrap = document.createElement('div');
      wrap.className = 'img-resize-wrap'; wrap.style.width = node.attrs.width;
      const img = document.createElement('img'); img.src = node.attrs.src; img.alt = node.attrs.alt || '';
      wrap.appendChild(img);
      const handle = document.createElement('div'); handle.className = 'img-resize-handle'; wrap.appendChild(handle);
      let startX, startWidth;
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault(); startX = e.clientX; startWidth = wrap.offsetWidth;
        const onMove = (ev) => { wrap.style.width = Math.max(60, startWidth + (ev.clientX - startX)) + 'px'; };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
          if (typeof getPos === 'function') {
            editor.commands.command(({ tr }) => { tr.setNodeMarkup(getPos(), undefined, { ...node.attrs, width: wrap.style.width }); return true; });
          }
        };
        document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
      });
      return { dom: wrap };
    };
  },
});

// ================= Book structure definitions =================
const FRONT_DEFS = [
  { key: 'dedication', label: 'Dedication', defaultIncluded: false, inToc: false, layout: 'center-italic' },
  { key: 'epigraph', label: 'Epigraph', defaultIncluded: false, inToc: false, layout: 'center-italic' },
  { key: 'listOfFigures', label: 'List of Figures / Tables', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'foreword', label: 'Foreword', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'preface', label: 'Preface', defaultIncluded: true, inToc: true, layout: 'text' },
  { key: 'acknowledgements', label: 'Acknowledgements', defaultIncluded: true, inToc: true, layout: 'text' },
  { key: 'abbreviations', label: 'List of Abbreviations', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'terminology', label: 'Note on Terminology / Transliteration', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'introduction', label: 'Introduction', defaultIncluded: true, inToc: true, layout: 'text' },
];
const BACK_DEFS = [
  { key: 'conclusion', label: 'Conclusion', defaultIncluded: true, inToc: true, layout: 'text' },
  { key: 'afterword', label: 'Afterword', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'appendices', label: 'Appendices', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'notes', label: 'Notes', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'bibliography', label: 'Bibliography / References', defaultIncluded: true, inToc: true, layout: 'text' },
  { key: 'glossary', label: 'Glossary', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'index', label: 'Index', defaultIncluded: false, inToc: true, layout: 'text' },
  { key: 'authorBio', label: 'Author Biography', defaultIncluded: true, inToc: true, layout: 'text' },
  { key: 'aboutBook', label: 'About the Book', defaultIncluded: true, inToc: true, layout: 'text' },
];

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function defaultBook() {
  const front = {};
  FRONT_DEFS.forEach((d) => { front[d.key] = { included: d.defaultIncluded, content: '<p></p>' }; });
  front.epigraph.attribution = '';
  const back = {};
  BACK_DEFS.forEach((d) => { back[d.key] = { included: d.defaultIncluded, content: '<p></p>' }; });
  return {
    meta: {
      title: 'અનામી ગ્રંથ', subtitle: '', author: '', publisher: 'Shri Devdamanlal Technologies (OPC) Private Limited',
      place: '', year: new Date().getFullYear().toString(), edition: 'પ્રથમ આવૃત્તિ', isbn: '',
      copyrightText: '© {year} {author}. સર્વાધિકાર સુરક્ષિત. આ ગ્રંથનો કોઈ પણ ભાગ પ્રકાશકની લેખિત મંજૂરી વિના પુનઃઉત્પાદિત કરી શકાશે નહીં.',
    },
    front,
    parts: [{ id: uid(), title: 'ભાગ 1', chapters: [{ id: uid(), title: 'પ્રકરણ 1', content: '<p></p>' }] }],
    back,
  };
}

const STORAGE_KEY = 'writta_book_v2';
let book = loadBook();
let saveTimer = null;

function loadBook() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.meta && Array.isArray(parsed.parts)) return parsed;
    }
  } catch (e) {}
  return defaultBook();
}

function saveBook() {
  document.getElementById('save-indicator').textContent = 'સેવ થાય છે…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
      document.getElementById('save-indicator').textContent = 'સેવ થયું';
    } catch (e) { document.getElementById('save-indicator').textContent = 'સેવ નિષ્ફળ'; }
  }, 600);
}

function wordCount(html) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

// ================= Current selection pointer =================
// kinds: 'meta:halfTitle' | 'meta:titlePage' | 'meta:copyright' | 'front:<key>' | 'part:<id>' | 'chapter:<partId>:<id>' | 'back:<key>'
let current = 'front:introduction';
if (!book.front.introduction) current = `part:${book.parts[0].id}:${book.parts[0].chapters[0].id}`;

function getRef(content) {
  const [kind, a, b] = content.split(':');
  return { kind, a, b };
}

function getContentSlot() {
  const { kind, a, b } = getRef(current);
  if (kind === 'front') return book.front[a];
  if (kind === 'back') return book.back[a];
  if (kind === 'part') return book.parts.find((p) => p.id === a);
  if (kind === 'chapter') {
    const part = book.parts.find((p) => p.id === a);
    return part ? part.chapters.find((c) => c.id === b) : null;
  }
  return null;
}

// ================= TipTap editor =================
const editor = new Editor({
  element: document.getElementById('editor'),
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Underline, TextStyle, FontFamily,
    Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
    PageBreak, ResizableImage,
  ],
  content: '<p></p>',
  onUpdate: ({ editor }) => {
    const slot = getContentSlot();
    if (slot) { slot.content = editor.getHTML(); updateWordCounts(); saveBook(); }
  },
  onSelectionUpdate: updateRibbonState,
  onTransaction: updateRibbonState,
});

// ================= View switching =================
function loadCurrentIntoView() {
  const { kind } = getRef(current);
  const editorEl = document.getElementById('editor');
  const metaEl = document.getElementById('meta-form');

  if (kind === 'meta') {
    editorEl.style.display = 'none';
    metaEl.style.display = 'block';
    renderMetaForm();
  } else {
    metaEl.style.display = 'none';
    editorEl.style.display = 'block';
    const slot = getContentSlot();
    editor.commands.setContent(slot ? slot.content : '<p></p>');
  }
  renderNavTree();
}

function renderMetaForm() {
  const { a } = getRef(current);
  const m = book.meta;
  const el = document.getElementById('meta-form');

  const bind = (field) => `data-field="${field}"`;

  if (a === 'halfTitle') {
    el.innerHTML = `
      <div class="hint">Half Title Page — ફક્ત ગ્રંથનું નામ દેખાય છે (પ્રથમ પાનું).</div>
      <label>ગ્રંથનું નામ</label>
      <input ${bind('title')} value="${escapeAttr(m.title)}" />`;
  } else if (a === 'titlePage') {
    el.innerHTML = `
      <div class="hint">Title Page — સંપૂર્ણ શીર્ષક પાનું.</div>
      <label>ગ્રંથનું નામ</label>
      <input ${bind('title')} value="${escapeAttr(m.title)}" />
      <label>ઉપશીર્ષક (Subtitle)</label>
      <input ${bind('subtitle')} value="${escapeAttr(m.subtitle)}" />
      <label>લેખકનું નામ</label>
      <input ${bind('author')} value="${escapeAttr(m.author)}" />
      <div class="meta-row">
        <div><label>પ્રકાશક</label><input ${bind('publisher')} value="${escapeAttr(m.publisher)}" /></div>
        <div><label>સ્થળ</label><input ${bind('place')} value="${escapeAttr(m.place)}" /></div>
      </div>
      <div class="meta-row">
        <div><label>વર્ષ</label><input ${bind('year')} value="${escapeAttr(m.year)}" /></div>
        <div><label>આવૃત્તિ</label><input ${bind('edition')} value="${escapeAttr(m.edition)}" /></div>
      </div>`;
  } else if (a === 'copyright') {
    el.innerHTML = `
      <div class="hint">Copyright Page — {year} અને {author} આપોઆપ ભરાશે.</div>
      <label>ISBN (વૈકલ્પિક)</label>
      <input ${bind('isbn')} value="${escapeAttr(m.isbn)}" />
      <label>Copyright લખાણ</label>
      <textarea ${bind('copyrightText')}>${escapeHtml(m.copyrightText)}</textarea>`;
  }

  el.querySelectorAll('[data-field]').forEach((input) => {
    input.addEventListener('input', (e) => {
      book.meta[e.target.dataset.field] = e.target.value;
      saveBook();
    });
  });
}

function escapeAttr(s) { return (s || '').replace(/"/g, '&quot;'); }
function escapeHtml(s) { return (s || '').replace(/</g, '&lt;'); }

// ================= Nav tree =================
function switchTo(ref) {
  const { kind } = getRef(current);
  if (kind !== 'meta') { const slot = getContentSlot(); if (slot) slot.content = editor.getHTML(); }
  current = ref;
  loadCurrentIntoView();
}

function renderNavTree() {
  const root = document.getElementById('nav-tree');
  root.innerHTML = '';

  const section = (title, controls) => {
    const h = document.createElement('div');
    h.className = 'nav-section-title';
    h.innerHTML = `<span>${title}</span>`;
    if (controls) h.appendChild(controls);
    root.appendChild(h);
  };

  const navItem = (label, ref, wc) => {
    const div = document.createElement('div');
    div.className = 'nav-item' + (current === ref ? ' active' : '');
    div.innerHTML = `<span class="nav-label">${label}</span>${wc != null ? `<span class="wc">${wc}</span>` : ''}`;
    div.addEventListener('click', () => switchTo(ref));
    return div;
  };

  const navItemToggle = (def, zoneKey, zoneObj) => {
    const div = document.createElement('div');
    const ref = `${zoneKey}:${def.key}`;
    div.className = 'nav-item' + (current === ref ? ' active' : '');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = zoneObj[def.key].included;
    cb.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', (e) => { zoneObj[def.key].included = e.target.checked; saveBook(); });
    const label = document.createElement('span');
    label.className = 'nav-label'; label.textContent = def.label;
    const wc = document.createElement('span');
    wc.className = 'wc'; wc.textContent = wordCount(zoneObj[def.key].content) || '';
    div.appendChild(cb); div.appendChild(label); div.appendChild(wc);
    div.addEventListener('click', () => switchTo(ref));
    return div;
  };

  // ---- Structural front matter ----
  section('પ્રારંભિક પાનાં (Structural)');
  root.appendChild(navItem('Half Title Page', 'meta:halfTitle'));
  root.appendChild(navItem('Title Page', 'meta:titlePage'));
  root.appendChild(navItem('Copyright Page', 'meta:copyright'));

  // ---- Front matter (toggleable) ----
  section('પ્રારંભિક ભાગ (Front Matter)');
  FRONT_DEFS.forEach((d) => root.appendChild(navItemToggle(d, 'front', book.front)));
  root.appendChild(navItem('📑 Table of Contents (auto)', 'meta:tocinfo'));

  // ---- Parts / Chapters ----
  section('મુખ્ય લખાણ (Main Text)');
  book.parts.forEach((part, pIdx) => {
    const pWrap = document.createElement('div');
    pWrap.className = 'nav-part';
    const pHead = document.createElement('div');
    pHead.className = 'nav-part-head' + (current === `part:${part.id}` ? ' active' : '');
    pHead.innerHTML = `<span class="nav-label">${part.title}</span>`;
    const pControls = document.createElement('span');
    pControls.style.display = 'flex'; pControls.style.gap = '3px';
    const addCh = document.createElement('button');
    addCh.className = 'nav-mini-btn'; addCh.textContent = '+';
    addCh.title = 'નવું પ્રકરણ';
    addCh.addEventListener('click', (e) => { e.stopPropagation(); addChapter(part.id); });
    const delPart = document.createElement('span');
    delPart.className = 'nav-del'; delPart.textContent = '✕'; delPart.title = 'ભાગ કાઢી નાખો';
    delPart.addEventListener('click', (e) => { e.stopPropagation(); deletePart(part.id); });
    pControls.appendChild(addCh); pControls.appendChild(delPart);
    pHead.appendChild(pControls);
    pHead.addEventListener('click', () => switchTo(`part:${part.id}`));
    pWrap.appendChild(pHead);

    const chWrap = document.createElement('div');
    chWrap.className = 'nav-chapters';
    part.chapters.forEach((ch) => {
      const ref = `chapter:${part.id}:${ch.id}`;
      const row = document.createElement('div');
      row.className = 'nav-item' + (current === ref ? ' active' : '');
      row.innerHTML = `<span class="nav-label">${ch.title}</span><span class="wc">${wordCount(ch.content)}</span>`;
      const del = document.createElement('span');
      del.className = 'nav-del'; del.textContent = '✕'; del.title = 'પ્રકરણ કાઢી નાખો';
      del.addEventListener('click', (e) => { e.stopPropagation(); deleteChapter(part.id, ch.id); });
      row.appendChild(del);
      row.addEventListener('click', () => switchTo(ref));
      chWrap.appendChild(row);
    });
    pWrap.appendChild(chWrap);
    root.appendChild(pWrap);
  });
  const addPartBtn = document.createElement('button');
  addPartBtn.className = 'nav-add-part'; addPartBtn.textContent = '+ નવો ભાગ (Part)';
  addPartBtn.addEventListener('click', addPart);
  root.appendChild(addPartBtn);

  // ---- Back matter ----
  section('અંતિમ ભાગ (Back Matter)');
  BACK_DEFS.forEach((d) => root.appendChild(navItemToggle(d, 'back', book.back)));

  updateWordCounts();
}

function addPart() {
  saveCurrentEditorContent();
  const part = { id: uid(), title: `ભાગ ${book.parts.length + 1}`, chapters: [{ id: uid(), title: 'પ્રકરણ 1', content: '<p></p>' }] };
  book.parts.push(part);
  switchTo(`part:${part.id}`);
  saveBook();
}
function deletePart(id) {
  if (book.parts.length <= 1) return;
  book.parts = book.parts.filter((p) => p.id !== id);
  if (getRef(current).a === id) switchTo(`part:${book.parts[0].id}`);
  else renderNavTree();
  saveBook();
}
function addChapter(partId) {
  saveCurrentEditorContent();
  const part = book.parts.find((p) => p.id === partId);
  const ch = { id: uid(), title: `પ્રકરણ ${part.chapters.length + 1}`, content: '<p></p>' };
  part.chapters.push(ch);
  switchTo(`chapter:${partId}:${ch.id}`);
  saveBook();
}
function deleteChapter(partId, chId) {
  const part = book.parts.find((p) => p.id === partId);
  if (part.chapters.length <= 1) return;
  part.chapters = part.chapters.filter((c) => c.id !== chId);
  if (getRef(current).b === chId) switchTo(`chapter:${partId}:${part.chapters[0].id}`);
  else renderNavTree();
  saveBook();
}
function saveCurrentEditorContent() {
  const { kind } = getRef(current);
  if (kind !== 'meta') { const slot = getContentSlot(); if (slot) slot.content = editor.getHTML(); }
}

function updateWordCounts() {
  let total = 0;
  FRONT_DEFS.forEach((d) => { total += wordCount(book.front[d.key].content); });
  BACK_DEFS.forEach((d) => { total += wordCount(book.back[d.key].content); });
  book.parts.forEach((p) => p.chapters.forEach((c) => { total += wordCount(c.content); }));
  document.getElementById('total-words').textContent = total;
}

// ================= Editable title bar (Parts & Chapters only) =================
const titleBar = document.getElementById('section-header');
const titleInput = document.getElementById('section-title-input');
titleInput.addEventListener('input', (e) => {
  const slot = getContentSlot();
  if (slot) { slot.title = e.target.value; renderNavTree(); saveBook(); }
});

const subHeader = document.getElementById('section-sub-header');
const attrInput = document.getElementById('section-attr-input');
attrInput.addEventListener('input', (e) => { book.front.epigraph.attribution = e.target.value; saveBook(); });

function refreshTitleBar() {
  const { kind, a } = getRef(current);
  if (kind === 'part' || kind === 'chapter') {
    const slot = getContentSlot();
    titleBar.style.display = 'block';
    titleInput.value = slot ? slot.title : '';
  } else {
    titleBar.style.display = 'none';
  }
  if (kind === 'front' && a === 'epigraph') {
    subHeader.style.display = 'block';
    attrInput.value = book.front.epigraph.attribution || '';
  } else {
    subHeader.style.display = 'none';
  }
}

// Wrap the view loader to also refresh the title bar + handle the TOC-info nav item
const _loadCurrentIntoView = loadCurrentIntoView;
loadCurrentIntoView = function () {
  if (current === 'meta:tocinfo') { openTocModal(); current = 'front:introduction'; }
  _loadCurrentIntoView();
  refreshTitleBar();
};

// ================= Ribbon wiring =================
document.querySelectorAll('.ribbon [data-cmd]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const chain = editor.chain().focus();
    switch (btn.dataset.cmd) {
      case 'undo': chain.undo().run(); break;
      case 'redo': chain.redo().run(); break;
      case 'bold': chain.toggleBold().run(); break;
      case 'italic': chain.toggleItalic().run(); break;
      case 'underline': chain.toggleUnderline().run(); break;
      case 'strike': chain.toggleStrike().run(); break;
      case 'bulletList': chain.toggleBulletList().run(); break;
      case 'orderedList': chain.toggleOrderedList().run(); break;
      case 'blockquote': chain.toggleBlockquote().run(); break;
    }
  });
});
document.getElementById('heading-select').addEventListener('change', (e) => {
  const chain = editor.chain().focus();
  if (e.target.value === 'paragraph') chain.setParagraph().run();
  else chain.toggleHeading({ level: Number(e.target.value) }).run();
});
document.getElementById('font-family').addEventListener('change', (e) => {
  editor.chain().focus().setFontFamily(e.target.value).run();
});
document.getElementById('btn-pagebreak').addEventListener('click', () => editor.chain().focus().setPageBreak().run());
document.getElementById('btn-table').addEventListener('click', () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run());
document.getElementById('btn-col-add').addEventListener('click', () => editor.chain().focus().addColumnAfter().run());
document.getElementById('btn-row-add').addEventListener('click', () => editor.chain().focus().addRowAfter().run());
document.getElementById('btn-table-del').addEventListener('click', () => editor.chain().focus().deleteTable().run());
document.getElementById('btn-image').addEventListener('click', () => document.getElementById('image-input').click());
document.getElementById('image-input').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => editor.chain().focus().setResizableImage({ src: reader.result, alt: file.name, width: '320px' }).run();
  reader.readAsDataURL(file);
  e.target.value = '';
});
function updateRibbonState() {
  document.querySelectorAll('.ribbon [data-cmd]').forEach((btn) => {
    const map = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strike', bulletList: 'bulletList', orderedList: 'orderedList', blockquote: 'blockquote' };
    if (map[btn.dataset.cmd]) btn.classList.toggle('is-active', editor.isActive(map[btn.dataset.cmd]));
  });
  document.getElementById('table-tools').style.display = editor.isActive('table') ? 'flex' : 'none';
}

// ================= Theme toggle =================
document.getElementById('btn-theme').addEventListener('click', () => {
  document.body.classList.toggle('light');
  document.getElementById('btn-theme').textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
});

// ================= TOC modal (on-screen preview, no page numbers — those exist only in the paginated PDF) =================
function buildTocEntries() {
  const entries = [];
  FRONT_DEFS.filter((d) => d.inToc && book.front[d.key].included).forEach((d) => entries.push({ level: 'chapter', title: d.label, id: `sec-front-${d.key}` }));
  book.parts.forEach((part, i) => {
    entries.push({ level: 'part', title: part.title, id: `sec-part-${part.id}` });
    part.chapters.forEach((ch) => entries.push({ level: 'chapter', title: ch.title, id: `sec-chap-${ch.id}` }));
  });
  BACK_DEFS.filter((d) => d.inToc && book.back[d.key].included).forEach((d) => entries.push({ level: 'chapter', title: d.label, id: `sec-back-${d.key}` }));
  return entries;
}

function openTocModal() {
  saveCurrentEditorContent();
  const body = document.getElementById('toc-body');
  body.innerHTML = '';
  buildTocEntries().forEach((e) => {
    const row = document.createElement('div');
    row.className = 'toc-line ' + e.level;
    row.textContent = e.title;
    body.appendChild(row);
  });
  document.getElementById('toc-modal').style.display = 'flex';
}
document.getElementById('btn-toc-preview').addEventListener('click', openTocModal);
document.getElementById('btn-close-toc').addEventListener('click', () => { document.getElementById('toc-modal').style.display = 'none'; });

// ================= Print / PDF via Paged.js =================
let pagedLoaded = false;
function loadPagedJs() {
  return new Promise((resolve, reject) => {
    if (pagedLoaded) return resolve();
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/pagedjs/dist/paged.js';
    s.onload = () => { pagedLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function centerPage(innerHtml, extraClass = '') {
  return `<section class="fm-page center-page ${extraClass}" style="break-before:page;">${innerHtml}</section>`;
}
function textPage(id, heading, html, extraClass = '') {
  return `<section id="${id}" class="fm-page ${extraClass}" style="break-before:page;">
    <h2 class="section-heading">${heading}</h2>${html}</section>`;
}

function buildManuscriptHTML() {
  saveCurrentEditorContent();
  const m = book.meta;
  const copyrightText = (m.copyrightText || '').replace('{year}', m.year || '').replace('{author}', m.author || '');
  let html = '';

  // Half title
  html += centerPage(`<div class="half-title">${m.title}</div>`);
  // Title page
  html += centerPage(`
    <div class="title-page-title">${m.title}</div>
    ${m.subtitle ? `<div class="title-page-subtitle">${m.subtitle}</div>` : ''}
    <div class="title-page-author">${m.author}</div>
    <div class="title-page-imprint">${m.publisher}${m.place ? ' · ' + m.place : ''}${m.year ? ' · ' + m.year : ''}</div>
    ${m.edition ? `<div class="title-page-edition">${m.edition}</div>` : ''}
  `);
  // Copyright
  html += centerPage(`
    <div class="copyright-text">${copyrightText}</div>
    ${m.isbn ? `<div class="copyright-isbn">ISBN: ${m.isbn}</div>` : ''}
  `, 'small-text');

  // Dedication / Epigraph
  if (book.front.dedication.included) html += centerPage(`<div class="dedication">${book.front.dedication.content}</div>`);
  if (book.front.epigraph.included) {
    html += centerPage(`<div class="epigraph">${book.front.epigraph.content}${book.front.epigraph.attribution ? `<div class="epigraph-attr">— ${book.front.epigraph.attribution}</div>` : ''}</div>`);
  }

  // TOC
  const tocEntries = buildTocEntries();
  let tocHtml = '<div class="toc-list">';
  tocEntries.forEach((e) => {
    tocHtml += `<div class="toc-row ${e.level}"><a href="#${e.id}">${e.title}</a></div>`;
  });
  tocHtml += '</div>';
  html += textPage('sec-toc', 'Table of Contents', tocHtml);

  // Remaining front matter (roman-numbered)
  FRONT_DEFS.forEach((d) => {
    if (d.key === 'dedication' || d.key === 'epigraph' || d.key === 'introduction') return;
    if (book.front[d.key].included) html += textPage(`sec-front-${d.key}`, d.label, book.front[d.key].content);
  });
  if (book.front.introduction.included) html += textPage('sec-front-introduction', 'Introduction', book.front.introduction.content);

  // ===== MAIN TEXT — arabic numbering restarts here =====
  book.parts.forEach((part) => {
    html += `<section id="sec-part-${part.id}" class="main-page part-title-page" style="break-before:page;">
      <div class="part-label">Part</div><div class="part-title">${part.title}</div></section>`;
    part.chapters.forEach((ch) => {
      html += `<section id="sec-chap-${ch.id}" class="main-page" style="break-before:page;">
        <h2 class="chapter-heading">${ch.title}</h2>${ch.content}</section>`;
    });
  });

  // Back matter (continues arabic)
  BACK_DEFS.forEach((d) => {
    if (book.back[d.key].included) html += `<section id="sec-back-${d.key}" class="main-page" style="break-before:page;">
      <h2 class="section-heading">${d.label}</h2>${book.back[d.key].content}</section>`;
  });

  return html;
}

const PAGED_CSS = `
  @page { size: A4; margin: 24mm 20mm; }
  @page { @bottom-center { content: counter(page); font-family: 'Inter', sans-serif; font-size: 10.5px; color:#777; } }
  @page frontmatter { @bottom-center { content: counter(page, lower-roman); font-family:'Inter',sans-serif; font-size:10.5px; color:#777; } }
  .fm-page { page: frontmatter; }
  #sec-part-first-reset { counter-reset: page 1; }
  body { font-family:'Noto Serif Gujarati', serif; font-size:12.5pt; line-height:1.8; color:#1a1a1a; }
  h1,h2,h3,.part-title,.title-page-title,.half-title { font-family:'Cormorant Garamond', serif; }
  .page-break-marker { break-after: page; visibility:hidden; height:0; }
  .center-page { min-height:230mm; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
  .half-title { font-size:22pt; letter-spacing:1px; }
  .title-page-title { font-size:30pt; font-weight:600; margin-bottom:6px; }
  .title-page-subtitle { font-size:15pt; font-style:italic; color:#555; margin-bottom:26px; }
  .title-page-author { font-size:14pt; margin-top:40px; }
  .title-page-imprint { font-size:10.5pt; color:#666; margin-top:60px; text-transform:uppercase; letter-spacing:1px; }
  .title-page-edition { font-size:10pt; color:#888; margin-top:6px; }
  .small-text, .small-text * { font-size:9.5pt; color:#444; }
  .copyright-text { max-width:110mm; }
  .copyright-isbn { margin-top:14px; }
  .dedication, .epigraph { font-style:italic; font-size:14pt; max-width:120mm; }
  .epigraph-attr { margin-top:10px; font-style:normal; font-size:10.5pt; color:#666; }
  .section-heading, .chapter-heading { font-size:20pt; font-weight:600; margin-bottom:18px; border-bottom:1px solid #ccc; padding-bottom:8px; }
  .part-title-page { min-height:230mm; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
  .part-label { font-size:11pt; letter-spacing:3px; text-transform:uppercase; color:#999; margin-bottom:10px; }
  .part-title { font-size:26pt; font-weight:600; }
  .toc-row { display:flex; padding:4px 0; font-size:11.5pt; }
  .toc-row a { text-decoration:none; color:#1a1a1a; width:100%; display:flex; }
  .toc-row a::after { content: target-counter(attr(href), page); margin-left:auto; padding-left:10px; }
  .toc-row.part a { font-weight:700; margin-top:10px; font-family:'Cormorant Garamond',serif; font-size:14pt; }
  .toc-row.chapter a { padding-left:14px; }
  table { border-collapse:collapse; width:100%; }
  td, th { border:1px solid #ccc; padding:6px; }
  img { max-width:100%; }
`;

document.getElementById('btn-print').addEventListener('click', async () => {
  await loadPagedJs();
  let html = buildManuscriptHTML();
  // Mark the first Part's title page as the arabic reset point.
  const firstPartId = book.parts[0] && book.parts[0].id;
  if (firstPartId) html = html.replace(`id="sec-part-${firstPartId}"`, `id="sec-part-first-reset"`);

  const overlay = document.getElementById('print-overlay');
  const root = document.getElementById('print-preview');
  root.innerHTML = '';
  overlay.style.display = 'block';

  const previewer = new window.Paged.Previewer();
  await previewer.preview(html, [PAGED_CSS], root);
});
document.getElementById('btn-close-preview').addEventListener('click', () => { document.getElementById('print-overlay').style.display = 'none'; });

// ================= PWA: service worker + install prompt =================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
let deferredInstallPrompt = null;
const installBtn = document.getElementById('btn-install');
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstallPrompt = e; installBtn.style.display = 'inline-block'; });
installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null; installBtn.style.display = 'none';
});
window.addEventListener('appinstalled', () => { installBtn.style.display = 'none'; });

// ================= Init =================
loadCurrentIntoView();