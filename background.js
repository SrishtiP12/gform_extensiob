chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.storage.local.set({ formData: {} });
  } catch (error) {
    console.error("Error initializing storage:", error);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveData") {
    try {
      chrome.storage.local.get("formData", ({ formData }) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          sendResponse({ status: "error", message: chrome.runtime.lastError.message });
          return;
        }
        const updated = { ...formData, ...request.data };
        chrome.storage.local.set({ formData: updated }, () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            sendResponse({ status: "error", message: chrome.runtime.lastError.message });
            return;
          }
          sendResponse({ status: "success" });
        });
      });
    } catch (error) {
      console.error("Error saving data:", error);
      sendResponse({ status: "error", message: error.message });
    }
    return true;
  }
});
