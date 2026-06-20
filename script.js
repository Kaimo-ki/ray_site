const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const messages = document.getElementById("messages");
const consentPanel = document.getElementById("consentPanel");
const acceptConsent = document.getElementById("acceptConsent");
const skipConsent = document.getElementById("skipConsent");
const openConsent = document.getElementById("openConsent");
const memoryConsent = document.getElementById("memoryConsent");
const companionConsent = document.getElementById("companionConsent");
const companion = document.getElementById("companion");
const toggleCompanion = document.getElementById("toggleCompanion");
const installApp = document.getElementById("installApp");
const installPanel = document.getElementById("installPanel");
const closeInstall = document.getElementById("closeInstall");
const installStatus = document.getElementById("installStatus");
const swatches = document.querySelectorAll("[data-companion]");

const quickReplies = [
  "Понял. Давай коротко: что главное прямо сейчас?",
  "Ок. Я бы начал с одного маленького шага на сегодня.",
  "Слышу. Хочешь, разложу это на план или просто побуду рядом?",
  "Давай сделаем проще: цель, срок и первый шаг.",
];

let companionMoveTimer = null;
let dragState = null;
let installPrompt = null;

const isStandalone = () => (
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
);

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const addMessage = (text, type = "ray") => {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
};

const rememberSetting = (key, value) => localStorage.setItem(`ray_${key}`, value);
const readSetting = (key) => localStorage.getItem(`ray_${key}`);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const companionBounds = () => {
  const rect = companion.getBoundingClientRect();
  const margin = 12;
  return {
    width: rect.width || 58,
    height: rect.height || 58,
    minX: margin,
    minY: margin,
    maxX: window.innerWidth - (rect.width || 58) - margin,
    maxY: window.innerHeight - (rect.height || 58) - 104,
  };
};

const placeCompanion = (x, y, save = true) => {
  const bounds = companionBounds();
  const safeX = clamp(x, bounds.minX, bounds.maxX);
  const safeY = clamp(y, bounds.minY, bounds.maxY);
  companion.style.left = `${safeX}px`;
  companion.style.top = `${safeY}px`;
  companion.style.right = "auto";
  companion.style.bottom = "auto";

  if (save) {
    rememberSetting("companion_x", String(Math.round(safeX)));
    rememberSetting("companion_y", String(Math.round(safeY)));
  }
};

const restoreCompanionPosition = () => {
  const savedX = Number(readSetting("companion_x"));
  const savedY = Number(readSetting("companion_y"));
  if (Number.isFinite(savedX) && Number.isFinite(savedY)) {
    placeCompanion(savedX, savedY, false);
    return;
  }

  const bounds = companionBounds();
  placeCompanion(bounds.maxX, bounds.maxY, false);
};

const randomCompanionMove = () => {
  if (readSetting("companion_allowed") !== "yes" || companion.classList.contains("hidden")) return;

  const bounds = companionBounds();
  const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
  const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
  companion.style.transition = "left 800ms ease, top 800ms ease";
  placeCompanion(x, y, true);
  window.setTimeout(() => {
    companion.style.transition = "";
  }, 850);
};

const startCompanionMovement = () => {
  window.clearInterval(companionMoveTimer);
  if (readSetting("companion_allowed") === "yes") {
    companionMoveTimer = window.setInterval(randomCompanionMove, 11000);
  }
};

const showConsent = () => {
  memoryConsent.checked = readSetting("memory_allowed") === "yes";
  companionConsent.checked = readSetting("companion_allowed") === "yes";
  consentPanel.classList.add("show");
};
const hideConsent = () => consentPanel.classList.remove("show");
const showInstall = () => installPanel.classList.add("show");
const hideInstall = () => installPanel.classList.remove("show");
const companionAllowed = () => readSetting("companion_allowed") === "yes";

if (!readSetting("privacy_seen")) {
  showConsent();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/ray_site/sw.js", { scope: "/ray_site/" }).catch(() => {});
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installApp.disabled = false;
  installStatus.textContent = "Установка доступна. Нажми «Установить», и браузер откроет системное окно.";
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installStatus.textContent = "Рэй установлен. Его можно открыть с экрана телефона или из приложений на компьютере.";
  installApp.textContent = "Установлено";
});

installApp.addEventListener("click", async () => {
  if (isStandalone()) {
    installStatus.textContent = "Рэй уже открыт как установленное приложение.";
    showInstall();
    return;
  }

  if (!installPrompt) {
    installStatus.textContent = isIos()
      ? "На iPhone установка идёт через Safari: Поделиться → На экран Домой."
      : "Если системное окно не появилось, открой сайт в Chrome или Edge и нажми значок установки в адресной строке.";
    showInstall();
    return;
  }

  installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  installStatus.textContent = choice.outcome === "accepted"
    ? "Установка началась. После этого Рэй появится как приложение."
    : "Установку отменили. Можно попробовать ещё раз позже.";
  installPrompt = null;
});

closeInstall.addEventListener("click", hideInstall);

openConsent.addEventListener("click", showConsent);
skipConsent.addEventListener("click", () => {
  rememberSetting("privacy_seen", "yes");
  rememberSetting("memory_allowed", "no");
  rememberSetting("companion_allowed", "no");
  setCompanionVisible(false);
  hideConsent();
  startCompanionMovement();
});

acceptConsent.addEventListener("click", () => {
  rememberSetting("privacy_seen", "yes");
  rememberSetting("memory_allowed", memoryConsent.checked ? "yes" : "no");
  rememberSetting("companion_allowed", companionConsent.checked ? "yes" : "no");
  setCompanionVisible(companionConsent.checked);
  hideConsent();
  startCompanionMovement();
  if (companionConsent.checked) randomCompanionMove();
});

const applyCompanionColor = (color) => {
  document.body.classList.remove("companion-amber", "companion-blue", "companion-rose");
  if (color !== "teal") document.body.classList.add(`companion-${color}`);
  swatches.forEach((button) => button.classList.toggle("active", button.dataset.companion === color));
  rememberSetting("companion_color", color);
};

const setCompanionVisible = (visible) => {
  companion.classList.toggle("hidden", !visible);
  toggleCompanion.textContent = visible ? "●" : "○";
  rememberSetting("companion_visible", visible ? "yes" : "no");
};

const pointerPosition = (event) => {
  const point = event.touches ? event.touches[0] : event;
  return { x: point.clientX, y: point.clientY };
};

companion.addEventListener("pointerdown", (event) => {
  if (!companionAllowed()) {
    showConsent();
    return;
  }
  if (event.button && event.button !== 0) return;
  const point = pointerPosition(event);
  const rect = companion.getBoundingClientRect();
  dragState = {
    offsetX: point.x - rect.left,
    offsetY: point.y - rect.top,
  };
  companion.classList.add("dragging");
  companion.setPointerCapture(event.pointerId);
});

companion.addEventListener("pointermove", (event) => {
  if (!dragState) return;
  const point = pointerPosition(event);
  placeCompanion(point.x - dragState.offsetX, point.y - dragState.offsetY, false);
});

const endDrag = (event) => {
  if (!dragState) return;
  const rect = companion.getBoundingClientRect();
  dragState = null;
  companion.classList.remove("dragging");
  placeCompanion(rect.left, rect.top, true);
  if (event.pointerId !== undefined && companion.hasPointerCapture(event.pointerId)) {
    companion.releasePointerCapture(event.pointerId);
  }
};

companion.addEventListener("pointerup", endDrag);
companion.addEventListener("pointercancel", endDrag);

window.addEventListener("resize", () => {
  const rect = companion.getBoundingClientRect();
  placeCompanion(rect.left, rect.top, true);
});

applyCompanionColor(readSetting("companion_color") || "teal");
setCompanionVisible(companionAllowed() && readSetting("companion_visible") !== "no");
restoreCompanionPosition();
startCompanionMovement();

swatches.forEach((button) => {
  button.addEventListener("click", () => applyCompanionColor(button.dataset.companion));
});

toggleCompanion.addEventListener("click", () => {
  if (!companionAllowed()) {
    showConsent();
    return;
  }
  setCompanionVisible(companion.classList.contains("hidden"));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const apiUrl = window.RAY_API_URL;
  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "site-demo", text }),
      });
      const data = await response.json();
      addMessage(data.reply || "Я рядом. Скажи чуть подробнее?");
      return;
    } catch (error) {
      addMessage("Связь с Рэем сейчас не отвечает. Я сохранил мысль на экране.");
      return;
    }
  }

  const reply = quickReplies[Math.floor(Math.random() * quickReplies.length)];
  window.setTimeout(() => addMessage(reply), 350);
});
