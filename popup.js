const toggleButton = document.getElementById("toggle-button");
const attention = document.getElementById("attention");
const typeElement = document.getElementById("type-element");
const sizeElement = document.getElementById("size-element");
const checkButton = document.getElementById("check-button");
const hostButton = document.getElementById("host-button");
const urlButton = document.getElementById("url-button");
const resetButton = document.getElementById("reset-button");

async function sendMessageToActiveTab(message) {
  const tabs = await chrome.tabs
    .query({ active: true, lastFocusedWindow: true })
    .catch(() => []);
  const tab = tabs?.[0];
  if (!tab?.id) {
    return undefined;
  }
  const response = await chrome.tabs
    .sendMessage(tab.id, message)
    .catch(() => undefined);
  return response;
}

(async () => {
  const toggleCheck = await chrome.storage.local.get().catch(() => ({}));
  if (toggleCheck?.toggle === 0) {
    toggleButton.checked = false;
  }
  const popup = await sendMessageToActiveTab({
    msg: "popup",
    type: "",
    size: "",
  });
  if (popup === void 0) {
    toggleButton.disabled = true;
    typeElement.disabled = true;
    sizeElement.disabled = true;
    checkButton.disabled = true;
    hostButton.disabled = true;
    urlButton.disabled = true;
    resetButton.disabled = true;
    attention.textContent = "このページでは使用できません";
  } else {
    if (popup[0] === "zoom") {
      typeElement.options[0].selected = true;
    } else if (popup[0] === "width") {
      typeElement.options[1].selected = true;
    }
    sizeElement.value = popup[1];
  }
})();

toggleButton.addEventListener("change", () => {
  const toggleValue = toggleButton.checked ? 1 : 0;
  chrome.storage.local.set({ toggle: toggleValue });
  sendMessageToActiveTab({ msg: "toggle", toggle: toggleValue });
});

checkButton.addEventListener("click", () => {
  const type = typeElement.value;
  const size = sizeElement.value;
  sendMessageToActiveTab({ msg: "check", type, size });
});

hostButton.addEventListener("click", () => {
  sendMessageToActiveTab({ msg: "save_host", type: "", size: "" });
});

urlButton.addEventListener("click", () => {
  sendMessageToActiveTab({ msg: "save_url", type: "", size: "" });
});

resetButton.addEventListener("click", () => {
  typeElement.options[0].selected = true;
  sizeElement.value = "100";
  sendMessageToActiveTab({ msg: "reset", type: "", size: "" });
});
