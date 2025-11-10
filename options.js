document.getElementById("setup-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const storage = document.querySelector("input[name='storage']:checked").value;
  const mode = document.querySelector("input[name='mode']:checked").value;

  chrome.storage.local.set({ storage, mode }, () => {
    document.getElementById("status").textContent = "Preferences saved!";
    setTimeout(() => (document.getElementById("status").textContent = ""), 2000);
  });
});
