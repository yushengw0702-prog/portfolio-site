const DEFAULTS = {
  fontFamily: '"Songti SC", "STSong", "宋体", "SimSun", serif',
  fontWeight: '400',
  bgColor: '#faf9f5',
};

const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────────────────
chrome.storage.sync.get(DEFAULTS, settings => {
  renderAll(settings);
});

// ── Render ────────────────────────────────────────────────────────
function renderAll(s) {
  $('fontFamily').value = s.fontFamily;

  document.querySelectorAll('.weight-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.weight === s.fontWeight);
  });

  document.querySelectorAll('.swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === s.bgColor);
  });
  $('colorPicker').value = s.bgColor;

  updatePreview(s);
}

function updatePreview(s) {
  const el = $('preview');
  el.style.fontFamily = s.fontFamily;
  el.style.fontWeight = s.fontWeight;
  el.style.background = s.bgColor;
}

// ── Save & propagate ──────────────────────────────────────────────
function save(patch) {
  chrome.storage.sync.get(DEFAULTS, current => {
    const next = { ...current, ...patch };
    chrome.storage.sync.set(next, () => renderAll(next));
  });
}

// ── Event listeners ───────────────────────────────────────────────
$('fontFamily').addEventListener('change', e => {
  save({ fontFamily: e.target.value });
});

document.querySelectorAll('.weight-btn').forEach(btn => {
  btn.addEventListener('click', () => save({ fontWeight: btn.dataset.weight }));
});

document.querySelectorAll('.swatch').forEach(sw => {
  sw.addEventListener('click', () => save({ bgColor: sw.dataset.color }));
});

$('colorPicker').addEventListener('input', e => {
  save({ bgColor: e.target.value });
});

$('resetBtn').addEventListener('click', () => {
  chrome.storage.sync.set(DEFAULTS, () => renderAll(DEFAULTS));
});
