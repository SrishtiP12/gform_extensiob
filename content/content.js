console.log("Form Autofill Extension content script active...");

window.addEventListener("load", () => {
  chrome.storage.local.get(null, (storedData) => {
    const fields = extractFormFields();

    fields.forEach((field) => {
      const match = findBestMatch(field.normalizedLabel, storedData);
      if (match.score >= 80) {
        console.log(
          `Match found for "${field.labelText}" → "${match.key}" (${match.score.toFixed(1)}%)`
        );
        showSuggestionDropdown(field, match.value);
      } else {
        console.log(`No match for "${field.labelText}"`);
      }
    });
  });
});

function extractFormFields() {
  const inputs = document.querySelectorAll("input, textarea, select");
  const fields = [];

  inputs.forEach((el, idx) => {
    const label = findLabel(el);
    const placeholder = el.placeholder || "";
    const ariaLabel = el.getAttribute("aria-label") || "";
    const id = el.id || `field-${idx}`;
    const normalizedLabel = normalizeLabel(label || placeholder || ariaLabel);

    fields.push({
      id,
      tag: el.tagName.toLowerCase(),
      labelText: label,
      placeholder,
      ariaLabel,
      normalizedLabel,
    });
  });

  return fields;
}

function findLabel(el) {
  if (el.id) {
    const explicit = document.querySelector(`label[for="${el.id}"]`);
    if (explicit) return explicit.innerText.trim();
  }

  const aria = el.getAttribute("aria-label");
  if (aria) return aria;

  const candidate =
    el.closest(".freebirdFormviewerComponentsQuestionBaseTitle") ||
    el.closest("[role='heading']");
  if (candidate) return candidate.innerText.trim();

  const prev = el.previousElementSibling;
  if (prev && prev.innerText) return prev.innerText.trim();

  return "";
}

function normalizeLabel(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function computeSimilarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase();
  b = b.toLowerCase();
  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }
  return (matches / ((a.length + b.length) / 2)) * 100;
}

function findBestMatch(fieldLabel, storedData) {
  let bestMatch = { key: null, value: null, score: 0 };
  for (const [key, value] of Object.entries(storedData)) {
    const normalizedKey = key.toLowerCase().replace(/[^\w\s]|_/g, "").trim();
    const similarity = computeSimilarity(fieldLabel, normalizedKey);
    if (similarity > bestMatch.score) {
      bestMatch = { key, value, score: similarity };
    }
  }
  return bestMatch;
}

function showSuggestionDropdown(field, value) {
  const el = document.querySelector(`#${field.id}`);
  if (!el) return;
  el.style.border = "2px solid #4CAF50";
  el.title = `Suggested: ${value}`;
}
