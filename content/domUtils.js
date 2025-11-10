function extractFormFields() {
  const inputs = document.querySelectorAll('input, textarea, select');
  const fields = [];

  inputs.forEach((el, idx) => {
    if (el.type === 'hidden' || el.offsetParent === null) return;

    const label = findLabel(el);
    const placeholder = el.placeholder || "";
    const ariaLabel = el.getAttribute("aria-label") || "";
    const id = el.id || `field-${idx}`;
    const normalizedLabel = normalizeLabel(String(label || placeholder || ariaLabel));

    fields.push({
      id,
      tag: el.tagName.toLowerCase(),
      type: el.type || el.tagName.toLowerCase(),
      labelText: label,
      placeholder,
      ariaLabel,
      normalizedLabel
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
    el.closest('[role="heading"]');
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
