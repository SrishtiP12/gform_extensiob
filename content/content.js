console.log("Form Autofill Extension content script active...");

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

let fields = [];

window.addEventListener("load", () => {
  try {
    chrome.storage.local.get(null, (storedData) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      const inputs = document.querySelectorAll("input, textarea, select");
      fields = Array.from(inputs).map(processField);

      fields.forEach((field) => {
        field.el.addEventListener("input", debounce((event) => {
          field.value = event.target.value.trim();
        }, 300));

        if (field.type) {
          console.log(
            `Field "${field.labelText}" recognized as type: ${field.type}`
          );
        }

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
  } catch (error) {
    console.error("Error getting data from storage:", error);
  }
});

const fieldPatterns = {
  name: ["name", "full name", "first name", "last name", "surname"],
  email: ["email", "email address", "e-mail"],
  phone: ["phone", "mobile", "contact number", "phone number"],
  age: ["age", "years old"],
  city: ["city", "location", "place", "town"],
  address: ["address", "street", "road", "avenue"],
  zip: ["zip", "postal code", "postcode"],
  country: ["country", "nation"],
  company: ["company", "organization", "business"],
  job: ["job title", "position", "role"],
};

function detectFieldType(labelText) {
  for (const [key, keywords] of Object.entries(fieldPatterns)) {
    if (keywords.some((word) => labelText.includes(word))) {
      return key;
    }
  }
  return null;
}

function processField(el) {
  const labelText = findLabel(el);
  const normalizedLabel = normalizeLabel(labelText);
  const type = detectFieldType(normalizedLabel);
  
  return {
    el,
    labelText,
    normalizedLabel,
    type,
    value: el.value ? el.value.trim() : ""
  };
}

function findLabel(el) {
  return findLabelForField(el);
}

function findLabelForField(el) {
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
  const { el } = field;
  if (!el) return;

  const parent = el.parentElement;
  if (!parent.style.position) parent.style.position = "relative";

  const icon = document.createElement("div");
  icon.textContent = "✓";
  icon.className = "form-suggest-icon";

  const dropdown = document.createElement("div");
  dropdown.className = "form-suggest-dropdown";
  dropdown.style.display = "none";
  dropdown.textContent = value;

  icon.addEventListener("click", () => {
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
  });

  dropdown.addEventListener("click", () => {
    el.value = value;
    dropdown.style.display = "none";
  });

  parent.appendChild(icon);
  parent.appendChild(dropdown);
}

document.addEventListener("submit", (event) => handleFormSubmit(event, fields), true);

async function handleFormSubmit(event, fields) {
  event.preventDefault();
  const form = event.target;

  try {
    const { formData: oldData = {} } = await new Promise((resolve, reject) => {
      chrome.storage.local.get("formData", (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });

    const newFields = [];
    const updatedFields = [];

    fields.forEach((field) => {
      const { labelText, value } = field;
      if (value && !oldData[labelText]) {
        newFields.push({ label: labelText, value });
      } else if (value && oldData[labelText] !== value) {
        updatedFields.push({
          label: labelText,
          oldValue: oldData[labelText],
          newValue: value,
        });
      }
    });

    if (!newFields.length && !updatedFields.length) {
      form.submit();
      return;
    }

    showConfirmationModal(form, newFields, updatedFields);
  } catch (error) {
    console.error("Error getting form data from storage:", error);
  }
}

function showConfirmationModal(form, newFields, updatedFields) {
  const oldModal = document.getElementById("autofill-modal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "autofill-modal";

  const newFieldsHTML = newFields.reduce((html, f) => {
    return `${html}<label><input type="checkbox" data-label="${f.label}" checked> ${f.label}: <b>${f.value}</b></label><br>`;
  }, "");

  const updatedFieldsHTML = updatedFields.reduce((html, f) => {
    return `${html}<label><input type="checkbox" data-label="${f.label}" checked> ${f.label}: <b>${f.newValue}</b> (was: ${f.oldValue})</label><br>`;
  }, "");

  modal.innerHTML = `
    <div class="modal-content">
      <h2>Confirm Fields to Save</h2>
      ${newFields.length ? `<h3>New Fields</h3>${newFieldsHTML}` : ""}
      ${updatedFields.length ? `<h3>Updated Fields</h3>${updatedFieldsHTML}` : ""}
      <div class="modal-actions">
        <button id="saveConfirm">Save & Submit</button>
        <button id="cancelConfirm">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#saveConfirm").addEventListener("click", async () => {
    const selected = [...modal.querySelectorAll("input[type=checkbox]:checked")];
    const toSave = {};
    selected.forEach((cb) => {
      const label = cb.getAttribute("data-label");
      const match = [...newFields, ...updatedFields].find((f) => f.label === label);
      if (match) toSave[label] = match.value || match.newValue;
    });

    await saveConfirmedFields(toSave);
    modal.remove();
    form.submit();
  });

  modal.querySelector("#cancelConfirm").addEventListener("click", () => modal.remove());
}

async function saveConfirmedFields(fieldsToSave) {
  chrome.runtime.sendMessage({ action: "saveData", data: fieldsToSave }, (response) => {
    if (response.status === "success") {
      console.log("Fields saved successfully!");
    } else {
      console.error("Failed to save fields.");
    }
  });
}