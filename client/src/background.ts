export {};

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    checkLink(tab.url);
  }
});

async function checkLink(url: string) {
  try {
    const response = await fetch("http://127.0.0.1:5000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ "url": url })
    });
    if (response.ok) {
      const data = await response.json();
      chrome.storage.local.set({ response: data }, () => {
        console.log("Response saved:", data);
      });
      if (data.conspiracy_resource_dataset === true || data.conspiracy_url_dataset === true) {
        chrome.action.openPopup();
      }
    } else {
      console.error("Error checking link:", response.statusText);
    }
  } catch (error) {
    console.error("Error checking link:", error);
  }
}