const form = document.querySelector("#chatForm");
const input = document.querySelector("#chatInput");
const log = document.querySelector("#chatLog");

const demoReplies = [
  "РџРѕРЅСЏР». Р”Р°РІР°Р№ РІРѕР·СЊРјРµРј РѕРґРёРЅ РјР°Р»РµРЅСЊРєРёР№ С€Р°Рі РЅР° СЃРµРіРѕРґРЅСЏ.",
  "РћРє. Р§С‚Рѕ СЃРµР№С‡Р°СЃ РІР°Р¶РЅРµРµ РІСЃРµРіРѕ Рё С‡С‚Рѕ РјРѕР¶РЅРѕ СЃРґРµР»Р°С‚СЊ Р·Р° 15 РјРёРЅСѓС‚?",
  "РџРѕС…РѕР¶Рµ, С‚СѓС‚ РІРѕРїСЂРѕСЃ РїСЂРѕ С„РѕРєСѓСЃ. Р”Р°РІР°Р№ РѕС‚РґРµР»РёРј РіР»Р°РІРЅРѕРµ РѕС‚ С€СѓРјР°.",
  "РњРѕР¶РЅРѕ. РЎРЅР°С‡Р°Р»Р° СѓС‚РѕС‡РЅРёРј С†РµР»СЊ, РїРѕС‚РѕРј СЂР°Р·РѕР±СЊРµРј РµРµ РЅР° РєРѕСЂРѕС‚РєРёРµ С€Р°РіРё.",
  "РЇ СЂСЏРґРѕРј. РќР°РїРёС€Рё С‡СѓС‚СЊ РїРѕРґСЂРѕР±РЅРµРµ, Рё СЏ РїРѕРјРѕРіСѓ СЂР°Р·Р»РѕР¶РёС‚СЊ СЌС‚Рѕ СЃРїРѕРєРѕР№РЅРѕ."
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
    return null;
  }

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
    addMessage("РЎРµР№С‡Р°СЃ СЃР°Р№С‚ РЅРµ РїРѕРґРєР»СЋС‡РµРЅ Рє Р СЌСЋ. РќРѕ РёРЅС‚РµСЂС„РµР№СЃ СѓР¶Рµ РіРѕС‚РѕРІ, backend РїРѕРґРєР»СЋС‡РёРј РїРѕСЃР»Рµ VM.", "ray");
  } finally {
    setFormBusy(false);
    input.focus();
  }
});
