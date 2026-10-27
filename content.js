const url = location.href;
const host = location.host;
let type = "zoom";
let size = "100";
let localData;

const fit = () => {
  if (type === "zoom") {
    document.body.style.zoom = size + "%";
    document.body.style.width = "";
  } else if (type === "width") {
    document.body.style.width = size + "%";
    document.body.style.zoom = "";
  }
};

const clearStyles = () => {
  document.body.style.zoom = "";
  document.body.style.width = "";
  document.body.style.overflowX = "";
  document.documentElement.style.overflowX = "";
};

const getItems = async () => {
  localData = await chrome.storage.local.get().catch((e) => {});
  if (localData?.[url]) {
    type = localData[url][0];
    size = localData[url][1];
  } else if (localData?.[host]) {
    type = localData[host][0];
    size = localData[host][1];
  } else {
    clearStyles();
    return false;
  }
  return true;
};

const scrollCheck = () => {
  const { innerHeight } = window;
  const { clientHeight } = document.documentElement;
  if (innerHeight === clientHeight) {
    type = "zoom";
    size = "100";
    return false;
  }
  return true;
};

const sizeCheck = () => {
  const { clientWidth, scrollWidth } = document.documentElement;
  const scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft || 0;

  if (clientWidth === scrollWidth) {
    size = Math.floor((1 - scrollLeft / clientWidth) * 100 - 1).toString();
  } else {
    size = Math.floor((clientWidth / scrollWidth) * 100 - 1).toString();
  }

  document.body.style.zoom = size + "%";
  const { innerHeight } = window;
  const { clientHeight } = document.documentElement;
  if (innerHeight === clientHeight) {
    document.body.style.zoom = "";
    type = "zoom";
    return false;
  }
  document.body.style.zoom = "";
  return true;
};

const widthFit = () => {
  document.body.style.width = size + "%";
  const { innerHeight } = window;
  const { clientHeight } = document.documentElement;
  if (innerHeight === clientHeight) {
    document.body.style.zoom = "";
    type = "width";
    return false;
  }
  document.body.style.width = "";
  type = "zoom";
  size = "100";
  document.body.style.overflowX = "hidden";
  document.documentElement.style.overflowX = "hidden";
  return true;
};

const setStorage = (key, type = "zoom", size = "100") => {
  const dic = {};
  dic[key] = [type, size];
  chrome.storage.local.set(dic);
};

const reset = () => {
  clearStyles();
  chrome.storage.local.remove(url).catch((e) => {});
  chrome.storage.local.remove(host).catch((e) => {});
};

const runAutoFit = async () => {
  const items = await getItems().catch((e) => {});
  if (!items && localData?.toggle !== 0) {
    if (scrollCheck()) {
      if (sizeCheck()) {
        widthFit();
      }
    }
  }
  fit();
};

(async () => {
  localData = await chrome.storage.local.get().catch((e) => {});
  if (!localData || !("toggle" in localData)) {
    chrome.storage.local.set({ toggle: 1 });
    if (!localData) localData = {};
    localData.toggle = 1;
  }
  await runAutoFit();
})();

let timer;
window.addEventListener("resize", () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    await runAutoFit();
  }, 500);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "toggle") {
    if (!localData) localData = {};
    localData.toggle = request.toggle;
    if (request.toggle === 0) {
      getItems().then((hasCustomItem) => {
        if (!hasCustomItem) {
          clearStyles();
          type = "zoom";
          size = "100";
        }
      });
    } else {
      runAutoFit();
    }
  } else if (request.msg === "popup") {
    sendResponse([type, size]);
  } else if (request.msg === "check") {
    type = request.type;
    size = request.size;
    fit();
    setStorage(url, type, size);
    sendResponse([type, size]);
  } else if (request.msg === "save_host") {
    setStorage(host);
  } else if (request.msg === "save_url") {
    setStorage(url);
  } else if (request.msg === "reset") {
    type = "zoom";
    size = "100";
    reset();
  }
});
