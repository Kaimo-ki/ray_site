const form = document.querySelector("#chatForm");
const input = document.querySelector("#chatInput");
const log = document.querySelector("#chatLog");
const chatStatus = document.querySelector("#chatStatus");

const demoReplies = [
  "Понял. Давай выберем один маленький шаг и сделаем его сегодня.",
  "Ок. Что сейчас важнее всего: учёба, дела или просто разгрузить голову?",
  "Слышится как задача про фокус. Давай отделим главное от шума.",
  "Можно. Сначала уточним цель, потом разобьём её на короткие шаги.",
  "Я рядом. Напиши чуть подробнее, и я помогу разложить это спокойно."
];

function getSessionId() {
  const key = "ray_web_session_id";
  let sessionId = window.localStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    window.localStorage.setItem(key, sessionId);
  }

  return sessionId;
}

function addMessage(text, type) {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  log.appendChild(node);
  log.scrollTop = log.scrollHeight;
}

function setFormBusy(isBusy) {
  input.disabled = isBusy;
  form.querySelector("button").disabled = isBusy;
}

async function askRayApi(text) {
  const baseUrl = (window.RAY_API_URL || "").replace(/\/$/, "");

  if (!baseUrl) {
    chatStatus.textContent = "demo mode";
    return null;
  }

  chatStatus.textContent = "connected";

  const response = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      message: text,
      session_id: getSessionId()
    })
  });

  if (!response.ok) {
    throw new Error(`Ray API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.session_id) {
    window.localStorage.setItem("ray_web_session_id", data.session_id);
  }

  return data.reply;
}

function demoReply() {
  return demoReplies[Math.floor(Math.random() * demoReplies.length)];
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    return;
  }

  addMessage(text, "user");
  input.value = "";
  setFormBusy(true);

  try {
    const reply = await askRayApi(text);
    addMessage(reply || demoReply(), "ray");
  } catch (error) {
    console.warn(error);
    chatStatus.textContent = "demo mode";
    addMessage("Сайт пока не подключён к серверу Рея. Интерфейс готов, backend подключим после VM.", "ray");
  } finally {
    setFormBusy(false);
    input.focus();
  }
});
