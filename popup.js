document.addEventListener("DOMContentLoaded", () => {
  const formDataList = document.getElementById("formDataList");

  try {
    chrome.storage.local.get("formData", ({ formData }) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        const listItem = document.createElement("li");
        listItem.textContent = "Error loading data.";
        formDataList.appendChild(listItem);
        return;
      }

      if (formData && Object.keys(formData).length > 0) {
        for (const [key, value] of Object.entries(formData)) {
          const listItem = document.createElement("li");
          listItem.textContent = `${key}: ${value}`;
          formDataList.appendChild(listItem);
        }
      } else {
        const listItem = document.createElement("li");
        listItem.textContent = "No form data saved yet.";
        formDataList.appendChild(listItem);
      }
    });
  } catch (error) {
    console.error("Error getting data from storage:", error);
    const listItem = document.createElement("li");
    listItem.textContent = "Error loading data.";
    formDataList.appendChild(listItem);
  }
});
