document.getElementById("setup-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const storage = document.querySelector("input[name='storage']:checked").value;
  const mode = document.querySelector("input[name='mode']:checked").value;

  try {
    chrome.storage.local.set({ storage, mode }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        document.getElementById("status").textContent = "Error saving preferences.";
        return;
      }
      document.getElementById("status").textContent = "Preferences saved!";
      setTimeout(() => (document.getElementById("status").textContent = ""), 2000);
    });
  } catch (error) {
    console.error("Error saving preferences:", error);
    document.getElementById("status").textContent = "Error saving preferences.";
  }
});
