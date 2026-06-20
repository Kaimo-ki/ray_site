const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const messages = document.getElementById("messages");
const consentPanel = document.getElementById("consentPanel");
const acceptConsent = document.getElementById("acceptConsent");
const skipConsent = document.getElementById("skipConsent");
const openConsent = document.getElementById("openConsent");
const memoryConsent = document.getElementById("memoryConsent");
const companion = document.getElementById("companion");
const toggleCompanion = document.getElementById("toggleCompanion");
const swatches = document.querySelectorAll("[data-companion]");

const quickReplies = [
  "Понял. Давай коротко: что главное прямо сейчас?",
  "Ок. Я бы начал с одного маленького шага на сегодня.",
  "Слышу. Хочешь, разложу это на план или просто побуду рядом?",
  "Давай сделаем проще: цель, срок и первый шаг.",
];

const addMessage = (text, type = "ray") => {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
};

const rememberSetting = (key, value) => localStorage.setItem(`ray_${key}`, value);
const readSetting = (key) => localStorage.getItem(`ray_${key}`);

const showConsent = () => consentPanel.classList.add("show");
const hideConsent = () => consentPanel.classList.remove("show");

if (!readSetting("privacy_seen")) {
  showConsent();
}

openConsent.addEventListener("click", showConsent);
skipConsent.addEventListener("click", () => {
  rememberSetting("privacy_seen", "yes");
  rememberSetting("memory_allowed", "no");
  hideConsent();
});

acceptConsent.addEventListener("click", () => {
  rememberSetting("privacy_seen", "yes");
  rememberSetting("memory_allowed", memoryConsent.checked ? "yes" : "no");
  hideConsent();
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

applyCompanionColor(readSetting("companion_color") || "teal");
setCompanionVisible(readSetting("companion_visible") !== "no");

swatches.forEach((button) => {
  button.addEventListener("click", () => applyCompanionColor(button.dataset.companion));
});

toggleCompanion.addEventListener("click", () => {
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
