const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const messages = document.getElementById("messages");
const voiceInput = document.getElementById("voiceInput");
const speakToggle = document.getElementById("speakToggle");
const consentPanel = document.getElementById("consentPanel");
const acceptConsent = document.getElementById("acceptConsent");
const skipConsent = document.getElementById("skipConsent");
const openConsent = document.getElementById("openConsent");
const memoryConsent = document.getElementById("memoryConsent");
const companionConsent = document.getElementById("companionConsent");
const apiUrlInput = document.getElementById("apiUrlInput");
const saveApiUrl = document.getElementById("saveApiUrl");
const apiStatus = document.getElementById("apiStatus");
const linkTelegram = document.getElementById("linkTelegram");
const telegramLinkStatus = document.getElementById("telegramLinkStatus");
const companion = document.getElementById("companion");
const toggleCompanion = document.getElementById("toggleCompanion");
const installApp = document.getElementById("installApp");
const installPanel = document.getElementById("installPanel");
const closeInstall = document.getElementById("closeInstall");
const installStatus = document.getElementById("installStatus");
const swatches = document.querySelectorAll("[data-companion]");
const quickChat = document.getElementById("quickChat");
const quickChatBody = document.getElementById("quickChatBody");
const quickChatForm = document.getElementById("quickChatForm");
const quickChatInput = document.getElementById("quickChatInput");
const quickVoiceInput = document.getElementById("quickVoiceInput");
const closeQuickChat = document.getElementById("closeQuickChat");
const onboarding = document.getElementById("onboarding");
const onboardingName = document.getElementById("onboardingName");
const onboardingMemory = document.getElementById("onboardingMemory");
const onboardingCompanion = document.getElementById("onboardingCompanion");
const finishOnboarding = document.getElementById("finishOnboarding");
const onboardingSteps = [...document.querySelectorAll("[data-step]")];
const onboardingDots = [...document.querySelectorAll("[data-step-dot]")];
const nextStepButtons = [...document.querySelectorAll("[data-next-step]")];
const authStatus = document.getElementById("authStatus");
const authStatusSettings = document.getElementById("authStatusSettings");
const authStatusModal = document.getElementById("authStatusModal");
const authPanel = document.getElementById("authPanel");
const openAuth = document.getElementById("openAuth");
const openAuthOnboarding = document.getElementById("openAuthOnboarding");
const openAuthSettings = document.getElementById("openAuthSettings");
const closeAuth = document.getElementById("closeAuth");
const googleLogin = document.getElementById("googleLogin");
const emailLogin = document.getElementById("emailLogin");
const emailSignup = document.getElementById("emailSignup");
const authLogout = document.getElementById("authLogout");
const authLogoutSettings = document.getElementById("authLogoutSettings");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

let companionMoveTimer = null;
let dragState = null;
let installPrompt = null;
let voiceEnabled = localStorage.getItem("ray_voice_reply") === "yes";
let onboardingStep = 0;
let supabaseClient = null;
let googleAuthEnabled = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const rememberSetting = (key, value) => localStorage.setItem(`ray_${key}`, value);
const readSetting = (key) => localStorage.getItem(`ray_${key}`);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const cleanUrl = (value) => value.trim().replace(/\/+$/, "");
const getApiUrl = () => cleanUrl(readSetting("api_url") || window.RAY_API_URL || "");
const supabaseConfigured = () => Boolean(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase);
const ensureSessionId = () => {
  const sessionId = readSetting("session_id") || `web-${window.crypto?.randomUUID?.() || Date.now()}`;
  rememberSetting("session_id", sessionId);
  return sessionId;
};

const isStandalone = () => (
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
);

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const showOnboardingStep = (step) => {
  onboardingStep = clamp(step, 0, onboardingSteps.length - 1);
  onboardingSteps.forEach((item, index) => item.classList.toggle("active", index === onboardingStep));
  onboardingDots.forEach((item, index) => item.classList.toggle("active", index === onboardingStep));
};

const collectPurposes = () => (
  [...document.querySelectorAll(".purpose-grid input:checked")].map((item) => item.value)
);

const setApiStatus = (text, isOk = false) => {
  if (!apiStatus) return;
  apiStatus.textContent = text;
  apiStatus.classList.toggle("ok", isOk);
};

const setTelegramLinkStatus = (html) => {
  if (!telegramLinkStatus) return;
  telegramLinkStatus.innerHTML = html;
};

const setAuthStatus = (text) => {
  if (authStatus) authStatus.textContent = text;
  if (authStatusSettings) authStatusSettings.textContent = text;
  if (authStatusModal) authStatusModal.textContent = text;
};

const friendlyAuthError = (error) => {
  const message = String(error?.message || error || "").toLowerCase();
  if (!message) return "Не получилось войти. Попробуй ещё раз.";
  if (message.includes("invalid login credentials")) return "Неверный email или пароль. Если аккаунта ещё нет, нажми “Зарегистрироваться”.";
  if (message.includes("email not confirmed")) return "Email ещё не подтверждён. Открой письмо от Supabase и подтверди вход.";
  if (message.includes("email provider is disabled")) return "В Supabase выключен вход по email. Включи Authentication -> Providers -> Email.";
  if (message.includes("signup is disabled")) return "В Supabase выключена регистрация. Включи регистрацию в Authentication.";
  if (message.includes("user already registered")) return "Такой email уже зарегистрирован. Нажми “Войти” или восстановим пароль позже.";
  if (message.includes("provider is not enabled") || message.includes("unsupported provider")) return "Google-вход ещё не включён в Supabase. Пока используй email и пароль.";
  if (message.includes("password")) return "Проверь пароль: минимум 6 символов.";
  return error?.message || "Не получилось войти. Попробуй ещё раз.";
};

const showAuth = () => {
  authPanel?.classList.add("show");
  setTimeout(() => authEmail?.focus(), 80);
};

const hideAuth = () => authPanel?.classList.remove("show");

const updateGoogleButton = () => {
  if (!googleLogin) return;
  if (googleAuthEnabled === false) {
    googleLogin.textContent = "Google пока не подключён";
    googleLogin.classList.add("is-muted");
  } else {
    googleLogin.textContent = "Войти через Google";
    googleLogin.classList.remove("is-muted");
  }
};

const checkGoogleProvider = async () => {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
  try {
    const response = await fetch(`${cleanUrl(window.SUPABASE_URL)}/auth/v1/settings`, {
      headers: { apikey: window.SUPABASE_ANON_KEY },
    });
    if (!response.ok) return;
    const settings = await response.json();
    googleAuthEnabled = Boolean(settings.external?.google);
    updateGoogleButton();
  } catch {
    googleAuthEnabled = null;
    updateGoogleButton();
  }
};

const initAuth = async () => {
  if (!supabaseConfigured()) {
    setAuthStatus("Вход через Google/email готов в коде. Осталось подключить Supabase URL и anon key.");
    showAuth();
    return;
  }

  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  await checkGoogleProvider();
  const { data } = await supabaseClient.auth.getSession();
  await applyAuthSession(data.session);
  if (!data.session) showAuth();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    applyAuthSession(session);
  });
};

const applyAuthSession = async (session) => {
  const user = session?.user;
  if (!user) {
    setAuthStatus("Если аккаунта ещё нет, придумай пароль и нажми “Зарегистрироваться”. Если аккаунт уже есть, введи свой пароль и нажми “Войти”.");
    return;
  }

  const email = user.email || "аккаунт";
  const name = user.user_metadata?.name || user.user_metadata?.full_name || email;
  rememberSetting("account_email", email);
  rememberSetting("session_id", `auth-${user.id}`);
  if (onboardingName && !onboardingName.value.trim()) onboardingName.value = name;
  if (authName && !authName.value.trim()) authName.value = name;
  if (authEmail && !authEmail.value.trim()) authEmail.value = email;
  setAuthStatus(`Вход выполнен: ${email}`);
  hideAuth();
  await syncProfile();
  await checkTelegramLink();
};

const requireAuthClient = () => {
  if (!supabaseClient) {
    setAuthStatus("Supabase ещё не подключён. Нужно добавить SUPABASE_URL и SUPABASE_ANON_KEY в config.js.");
    return false;
  }
  return true;
};

const signInGoogle = async () => {
  if (!requireAuthClient()) return;
  if (googleAuthEnabled === false) {
    setAuthStatus("Google-вход ещё не включён в Supabase. Включи Authentication -> Providers -> Google, потом кнопка заработает.");
    return;
  }
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href.split("#")[0] },
  });
  if (error) setAuthStatus(friendlyAuthError(error));
};

const signInEmail = async () => {
  if (!requireAuthClient()) return;
  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) {
    setAuthStatus("Введи email и пароль.");
    return;
  }
  setAuthStatus("Проверяю аккаунт...");
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  await applyAuthSession(data.session);
};

const signUpEmail = async () => {
  if (!requireAuthClient()) return;
  const name = authName?.value.trim() || onboardingName?.value.trim() || "";
  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!name || !email || password.length < 6) {
    setAuthStatus("Для регистрации нужны имя, email и пароль от 6 символов.");
    return;
  }
  setAuthStatus("Создаю аккаунт...");
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.href.split("#")[0],
      data: { name },
    },
  });
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  if (data.session) {
    await applyAuthSession(data.session);
    return;
  }
  setAuthStatus("Аккаунт создан. Открой письмо и нажми ссылку подтверждения. Код на сайте вводить не нужно. Потом вернись сюда и нажми “Войти”.");
};

const signOut = async () => {
  if (!requireAuthClient()) return;
  await supabaseClient.auth.signOut();
  localStorage.removeItem("ray_account_email");
  setAuthStatus("Вышли из аккаунта. Локальная сессия сайта осталась на этом устройстве.");
};

async function checkTelegramLink() {
  const apiUrl = getApiUrl();
  if (!apiUrl || !telegramLinkStatus) return;

  try {
    const response = await fetch(`${apiUrl}/link/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: ensureSessionId() }),
    });
    const data = await response.json();
    if (data.linked) {
      setTelegramLinkStatus("Telegram связан. Web и бот используют одну память.");
    }
  } catch (error) {
    setTelegramLinkStatus("Связку проверю после подключения API.");
  }
}

const addMessage = (text, type = "ray", target = messages) => {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  target.appendChild(node);
  target.scrollTop = target.scrollHeight;
  return node;
};

const speak = (text) => {
  if (!voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};

const localRayReply = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes("привет") || lower.includes("хай")) return "Привет. Я рядом. Что делаем?";
  if (lower.includes("цель") || lower.includes("план")) return "Давай коротко: цель, срок и первый маленький шаг на сегодня.";
  if (lower.includes("устал") || lower.includes("плохо") || lower.includes("груст")) return "Слышу. Сначала выдох. Напиши, что самое тяжёлое прямо сейчас.";
  if (lower.includes("англий")) return "Ок. Для английского: 15 минут слов, 10 минут аудио и одна короткая фраза вслух.";
  if (lower.includes("картин") || lower.includes("фото")) return "Фото и картинки лучше отправлять в Telegram-бота. В Web я подключу это через Ray API.";
  return "Понял. Давай проще: что ты хочешь получить в итоге?";
};

const askRay = async (text, target = messages) => {
  addMessage(text, "user", target);
  const thinking = addMessage("Думаю...", "ray", target);
  const apiUrl = getApiUrl();

  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: readSetting("session_id") || undefined,
          message: text,
        }),
      });
      if (!response.ok) throw new Error(`Ray API ${response.status}`);
      const data = await response.json();
      if (data.session_id) rememberSetting("session_id", data.session_id);
      const reply = data.reply || "Я рядом. Скажи чуть подробнее?";
      thinking.textContent = reply;
      speak(reply);
      return;
    } catch (error) {
      thinking.textContent = "Связь с Ray API сейчас не отвечает. Пока отвечу локально.";
    }
  }

  window.setTimeout(() => {
    const reply = localRayReply(text);
    thinking.textContent = reply;
    speak(reply);
  }, 320);
};

const syncProfile = async () => {
  const apiUrl = getApiUrl();
  if (!apiUrl || readSetting("memory_allowed") !== "yes") return;

  const sessionId = ensureSessionId();

  try {
    await fetch(`${apiUrl}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        name: readSetting("profile_name") || "",
        purposes: JSON.parse(readSetting("purposes") || "[]"),
        memory_allowed: readSetting("memory_allowed") === "yes",
        companion_allowed: readSetting("companion_allowed") === "yes",
      }),
    });
  } catch (error) {
    setApiStatus("API сохранён, но профиль пока не отправился. После деплоя Render попробуем снова.");
  }
};

const startVoiceInput = (targetInput, button) => {
  if (!SpeechRecognition) {
    addMessage("Голосовой ввод в этом браузере не поддерживается. На iPhone попробуй диктовку клавиатуры.", "ray");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  button.classList.add("active");
  recognition.onresult = (event) => {
    targetInput.value = event.results[0][0].transcript;
    targetInput.focus();
  };
  recognition.onerror = () => {
    addMessage("Не получилось услышать голос. Проверь разрешение микрофона.", "ray");
  };
  recognition.onend = () => button.classList.remove("active");
  recognition.start();
};

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
  if (apiUrlInput) apiUrlInput.value = getApiUrl();
  setApiStatus(getApiUrl()
    ? "Ray API подключён. Чат будет отвечать через backend."
    : "Ray API ещё не подключён. Чат работает локально, без общей памяти между устройствами."
  , Boolean(getApiUrl()));
  checkTelegramLink();
  consentPanel.classList.add("show");
};

const hideConsent = () => consentPanel.classList.remove("show");
const showInstall = () => installPanel.classList.add("show");
const hideInstall = () => installPanel.classList.remove("show");
const companionAllowed = () => readSetting("companion_allowed") === "yes";

if (readSetting("onboarding_done") === "yes") {
  onboarding.classList.remove("show");
  if (!readSetting("privacy_seen")) showConsent();
} else {
  showOnboardingStep(0);
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
openAuth?.addEventListener("click", showAuth);
openAuthOnboarding?.addEventListener("click", showAuth);
openAuthSettings?.addEventListener("click", showAuth);
closeAuth?.addEventListener("click", hideAuth);
googleLogin?.addEventListener("click", signInGoogle);
emailLogin?.addEventListener("click", signInEmail);
emailSignup?.addEventListener("click", signUpEmail);
authLogout?.addEventListener("click", signOut);
authLogoutSettings?.addEventListener("click", signOut);
nextStepButtons.forEach((button) => {
  button.addEventListener("click", () => showOnboardingStep(onboardingStep + 1));
});

finishOnboarding.addEventListener("click", async () => {
  rememberSetting("onboarding_done", "yes");
  rememberSetting("privacy_seen", "yes");
  rememberSetting("profile_name", onboardingName.value.trim());
  rememberSetting("purposes", JSON.stringify(collectPurposes()));
  rememberSetting("memory_allowed", onboardingMemory.checked ? "yes" : "no");
  rememberSetting("companion_allowed", onboardingCompanion.checked ? "yes" : "no");
  onboarding.classList.remove("show");
  setCompanionVisible(onboardingCompanion.checked);
  startCompanionMovement();
  addMessage("Готово. Я здесь, можно писать или говорить.", "ray");
  speak("Готово. Я здесь.");
  await syncProfile();
});

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
  syncProfile();
});

saveApiUrl?.addEventListener("click", async () => {
  const value = cleanUrl(apiUrlInput.value || "");
  if (value && !/^https?:\/\//i.test(value)) {
    setApiStatus("Ссылка API должна начинаться с https:// или http://");
    return;
  }
  if (value) rememberSetting("api_url", value);
  else localStorage.removeItem("ray_api_url");

  if (!value) {
    setApiStatus("API отключён. Рэй будет отвечать локально, без общей памяти.");
    return;
  }

  setApiStatus("Проверяю Ray API...");
  try {
    const response = await fetch(`${value}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    setApiStatus("Ray API подключён. Теперь чат отвечает через backend.", true);
    await syncProfile();
  } catch (error) {
    setApiStatus("Ссылка сохранена, но API сейчас не отвечает. Проверь Render URL и переменные.");
  }
});

linkTelegram?.addEventListener("click", async () => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    setTelegramLinkStatus("Сначала подключи Ray API.");
    return;
  }

  linkTelegram.disabled = true;
  setTelegramLinkStatus("Готовлю код...");
  try {
    const response = await fetch(`${apiUrl}/link/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: ensureSessionId() }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.linked) {
      setTelegramLinkStatus("Telegram уже связан. Web и бот используют одну память.");
      return;
    }

    setTelegramLinkStatus(
      `Отправь боту в Telegram: <code>/link ${data.code}</code>. Код живёт около 10 минут.`
    );
  } catch (error) {
    setTelegramLinkStatus("Не получилось создать код. Проверь Railway API и попробуй ещё раз.");
  } finally {
    linkTelegram.disabled = false;
  }
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

const openQuickChat = () => {
  if (!companionAllowed()) {
    showConsent();
    return;
  }
  quickChat.classList.add("show");
  quickChatInput.focus();
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
    moved: false,
  };
  companion.classList.add("dragging");
  companion.setPointerCapture(event.pointerId);
});

companion.addEventListener("pointermove", (event) => {
  if (!dragState) return;
  const point = pointerPosition(event);
  dragState.moved = true;
  placeCompanion(point.x - dragState.offsetX, point.y - dragState.offsetY, false);
});

const endDrag = (event) => {
  if (!dragState) return;
  const rect = companion.getBoundingClientRect();
  const moved = dragState.moved;
  dragState = null;
  companion.classList.remove("dragging");
  placeCompanion(rect.left, rect.top, true);
  if (event.pointerId !== undefined && companion.hasPointerCapture(event.pointerId)) {
    companion.releasePointerCapture(event.pointerId);
  }
  if (!moved) openQuickChat();
};

companion.addEventListener("pointerup", endDrag);
companion.addEventListener("pointercancel", endDrag);
companion.addEventListener("dblclick", openQuickChat);

window.addEventListener("resize", () => {
  const rect = companion.getBoundingClientRect();
  placeCompanion(rect.left, rect.top, true);
});

applyCompanionColor(readSetting("companion_color") || "teal");
setCompanionVisible(companionAllowed() && readSetting("companion_visible") !== "no");
restoreCompanionPosition();
startCompanionMovement();
speakToggle.classList.toggle("active", voiceEnabled);

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

voiceInput.addEventListener("click", () => startVoiceInput(input, voiceInput));
quickVoiceInput.addEventListener("click", () => startVoiceInput(quickChatInput, quickVoiceInput));

speakToggle.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem("ray_voice_reply", voiceEnabled ? "yes" : "no");
  speakToggle.classList.toggle("active", voiceEnabled);
  if (voiceEnabled) speak("Ок, буду отвечать голосом.");
  else window.speechSynthesis?.cancel();
});

closeQuickChat.addEventListener("click", () => quickChat.classList.remove("show"));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await askRay(text, messages);
});

quickChatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = quickChatInput.value.trim();
  if (!text) return;
  quickChatInput.value = "";
  await askRay(text, quickChatBody);
});

initAuth();
