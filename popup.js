const toggleButton = document.getElementById("toggle-button");
const attention = document.getElementById("attention");
const typeElement = document.getElementById("type-element");
const sizeElement = document.getElementById("size-element");
const checkButton = document.getElementById("check-button");
const hostButton = document.getElementById("host-button");
const urlButton = document.getElementById("url-button");
const resetButton = document.getElementById("reset-button");
let type;
let size;

async function sendMessageToActiveTab(message) {
  const [tab] = await chrome.tabs
    .query({ active: true, lastFocusedWindow: true })
    .catch((e) => {});
  const response = await chrome.tabs
    .sendMessage(tab.id, message)
    .catch((e) => {});
  return response;
}

(async () => {
  const toggleCheck = await chrome.storage.local.get().catch((e) => {});
  if (toggleCheck.toggle === 0) {
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

toggleButton.onchange = () => {
  const toggleValue = toggleButton.checked ? 1 : 0;
  chrome.storage.local.set({ toggle: toggleValue });
  sendMessageToActiveTab({ msg: "toggle", toggle: toggleValue });
};

checkButton.onclick = () => {
  type = typeElement.value;
  size = sizeElement.value;
  sendMessageToActiveTab({ msg: "check", type: type, size: size });
};

hostButton.onclick = () => {
  type = typeElement.value;
  size = sizeElement.value;
  sendMessageToActiveTab({ msg: "save_host", type: "", size: "" });
};

urlButton.onclick = () => {
  type = typeElement.value;
  size = sizeElement.value;
  sendMessageToActiveTab({ msg: "save_url", type: "", size: "" });
};

resetButton.onclick = () => {
  typeElement.options[0].selected = true;
  sizeElement.value = "100";
  sendMessageToActiveTab({ msg: "reset", type: "", size: "" });
};
