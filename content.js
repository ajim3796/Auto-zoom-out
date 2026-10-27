const url = location.href;
const host = location.host;
let innerHeight;
let clientHeight;
let clientWidth;
let scrollWidth;
let scrollLeft;
let type;
let size;
let localData;

const fit = () => {
  if (type === "zoom") {
    document.body.style.zoom = size + "%";
  } else if (type === "width") {
    document.body.style.width = size + "%";
  }
};

const getItems = async () => {
  localData = await chrome.storage.local.get().catch((e) => {});
  if (localData[url]) {
    type = localData[url][0];
    size = localData[url][1];
  } else if (localData[host]) {
    type = localData[host][0];
    size = localData[host][1];
  } else {
    clearStyles();
    return false;
  }
  return true;
};

const scrollCheck = () => {
  innerHeight = window.innerHeight;
  clientHeight = document.documentElement.clientHeight;
  if (innerHeight === clientHeight) {
    type = "zoom";
    size = "100";
    return false;
  }
  return true;
};

const sizeCheck = () => {
  clientWidth = document.documentElement.clientWidth;
  scrollWidth = document.documentElement.scrollWidth;
  if (document.body.scrollLeft != 0) {
    scrollLeft = document.body.scrollLeft;
  } else if (document.documentElement.scrollLeft != 0) {
    scrollLeft = document.documentElement.scrollLeft;
  }
  if (clientWidth === scrollWidth) {
    size = Math.floor((1 - scrollLeft / clientWidth) * 100 - 1).toString();
  } else {
    size = Math.floor((clientWidth / scrollWidth) * 100 - 1).toString();
  }
  document.body.style.zoom = size + "%";
  innerHeight = window.innerHeight;
  clientHeight = document.documentElement.clientHeight;
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
  innerHeight = window.innerHeight;
  clientHeight = document.documentElement.clientHeight;
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

const clearStyles = () => {
  document.body.style.zoom = "";
  document.body.style.width = "";
  document.body.style.overflowX = "";
  document.documentElement.style.overflowX = "";
};

const reset = () => {
  clearStyles();
  chrome.storage.local.remove(url).catch((e) => {});
  chrome.storage.local.remove(host).catch((e) => {});
};

(async () => {
  const items = await getItems().catch((e) => {});
  if (!("toggle" in localData)) {
    chrome.storage.local.set({ toggle: 1 });
    localData.toggle = 1;
  }
  if (!items && localData?.toggle !== 0) {
    if (scrollCheck()) {
      if (sizeCheck()) {
        widthFit();
      }
    }
  }
  fit();
})();

let timer;
window.addEventListener("resize", () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const items = await getItems().catch((e) => {});
    if (!items && localData?.toggle !== 0) {
      if (scrollCheck()) {
        if (sizeCheck()) {
          widthFit();
        }
      }
    }
    fit();
  }, 500);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "toggle") {
    if (!localData) localData = {};
    localData.toggle = request.toggle;
    getItems().then((hasCustomItem) => {
      if (!hasCustomItem) {
        if (request.toggle === 0) {
          clearStyles();
          type = "zoom";
          size = "100";
        } else {
          if (scrollCheck() && sizeCheck()) {
            widthFit();
          }
          fit();
        }
      }
    });
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
  return true;
});
