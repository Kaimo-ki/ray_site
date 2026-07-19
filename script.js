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
const authTelegramLinkStatus = document.getElementById("authTelegramLinkStatus");
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
const onboardingNotice = document.getElementById("onboardingNotice");
const onboardingSteps = [...document.querySelectorAll("[data-step]")];
const onboardingDots = [...document.querySelectorAll("[data-step-dot]")];
const nextStepButtons = [...document.querySelectorAll("[data-next-step]")];
const authStatus = document.getElementById("authStatus");
const authStatusSettings = document.getElementById("authStatusSettings");
const authStatusModal = document.getElementById("authStatusModal");
const authPanel = document.getElementById("authPanel");
const authTitle = document.getElementById("authTitle");
const openAuth = document.getElementById("openAuth");
const openAuthOnboarding = document.getElementById("openAuthOnboarding");
const openAuthSettings = document.getElementById("openAuthSettings");
const closeAuth = document.getElementById("closeAuth");
const googleLogin = document.getElementById("googleLogin");
const googleLoginLabel = googleLogin?.querySelector("[data-auth-google-label]");
const telegramLogin = document.getElementById("telegramLogin");
const emailLogin = document.getElementById("emailLogin");
const emailSignup = document.getElementById("emailSignup");
const emailOtp = document.getElementById("emailOtp");
const verifyOtp = document.getElementById("verifyOtp");
const resetPassword = document.getElementById("resetPassword");
const authLogout = document.getElementById("authLogout");
const authLogoutSettings = document.getElementById("authLogoutSettings");
const resetLocalAuth = document.getElementById("resetLocalAuth");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authPasswordConfirm = document.getElementById("authPasswordConfirm");
const authOtpCode = document.getElementById("authOtpCode");
const authModeNote = document.getElementById("authModeNote");
const authModeButtons = [...document.querySelectorAll("[data-auth-mode]")];
const authModeBlocks = [...document.querySelectorAll("[data-auth-for]")];
const authLoggedInBlocks = [...document.querySelectorAll("[data-auth-logged-in]")];
const appShell = document.querySelector(".app-shell");

let companionMoveTimer = null;
let dragState = null;
let installPrompt = null;
let voiceEnabled = localStorage.getItem("ray_voice_reply") === "yes";
let onboardingStep = 0;
let supabaseClient = null;
let googleAuthEnabled = null;
let authSession = null;
let authPausedOnboarding = false;
let authMode = "login";
let telegramPollTimer = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const rememberSetting = (key, value) => localStorage.setItem(`ray_${key}`, value);
const readSetting = (key) => localStorage.getItem(`ray_${key}`);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const cleanUrl = (value) => value.trim().replace(/\/+$/, "");
const getApiUrl = () => cleanUrl(readSetting("api_url") || window.RAY_API_URL || "");
const onboardingDone = () => readSetting("onboarding_done") === "yes";
const canonicalAppUrl = () => `${window.location.origin}${window.location.pathname}`;
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
  if (!onboardingDone()) rememberSetting("onboarding_step", String(onboardingStep));
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
  if (telegramLinkStatus) telegramLinkStatus.innerHTML = html;
  if (authTelegramLinkStatus) authTelegramLinkStatus.innerHTML = html;
};

const setAuthStatus = (text) => {
  if (authStatus) authStatus.textContent = text;
  if (authStatusSettings) authStatusSettings.textContent = text;
  if (authStatusModal) authStatusModal.textContent = text;
};

const setOnboardingNotice = (text) => {
  if (!onboardingNotice) return;
  onboardingNotice.textContent = text || "";
  onboardingNotice.hidden = !text;
};

const setAccountState = (state, email = "") => {
  rememberSetting("account_state", state);
  if (email) rememberSetting("account_email", email);
};

const clearPendingAccount = () => {
  localStorage.removeItem("ray_pending_email");
  if (readSetting("account_state") === "pending_email") localStorage.removeItem("ray_account_state");
};

const pendingAccountMessage = () => {
  if (readSetting("account_state") !== "pending_email" && !readSetting("pending_email")) return "";
  const email = readSetting("pending_email") || readSetting("account_email") || "";
  if (!email) return "";
  return `Проверь письмо: ${email}. Потом войди.`;
};

const authModeCopy = {
  login: {
    title: "Вход",
    note: "Email + пароль.",
    status: "Выбери способ.",
  },
  signup: {
    title: "Новый профиль",
    note: "Email + новый пароль.",
    status: "Заполни поля.",
  },
  otp: {
    title: "Код",
    note: "Код из письма.",
    status: "Код.",
  },
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const getAuthEmail = () => authEmail?.value.trim().toLowerCase() || "";
const getAuthPassword = () => authPassword?.value || "";
const clearAuthSecrets = () => {
  if (authPassword) authPassword.value = "";
  if (authPasswordConfirm) authPasswordConfirm.value = "";
  if (authOtpCode) authOtpCode.value = "";
};

const setAuthMode = (mode, options = {}) => {
  authMode = authModeCopy[mode] ? mode : "login";
  if (authPanel) authPanel.dataset.authMode = authMode;
  authModeButtons.forEach((button) => {
    const isActive = button.dataset.authMode === authMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  authModeBlocks.forEach((block) => {
    const modes = (block.dataset.authFor || "").split(/\s+/);
    block.hidden = !modes.includes(authMode);
  });
  if (authTitle) authTitle.textContent = authModeCopy[authMode].title;
  if (authModeNote) authModeNote.textContent = authModeCopy[authMode].note;
  if (authPassword) {
    authPassword.autocomplete = authMode === "signup" ? "new-password" : "current-password";
  }
  if (!options.keepStatus) setAuthStatus(authModeCopy[authMode].status);
};

const setGoogleLoginText = (text) => {
  if (!googleLogin) return;
  if (googleLoginLabel) googleLoginLabel.textContent = text;
  else googleLogin.textContent = text;
};

const syncBackgroundInteractivity = () => {
  const overlayIsOpen = Boolean(
    (onboarding?.classList.contains("show") && !onboarding?.classList.contains("auth-paused")) ||
    authPanel?.classList.contains("show") ||
    consentPanel?.classList.contains("show") ||
    installPanel?.classList.contains("show")
  );
  appShell?.toggleAttribute("inert", overlayIsOpen);
  appShell?.setAttribute("aria-hidden", overlayIsOpen ? "true" : "false");
};

const friendlyAuthError = (error) => {
  const message = String(error?.message || error || "").toLowerCase();
  if (!message) return "Не вышло. Ещё раз.";
  if (message.includes("invalid login credentials")) return "Email или пароль не тот.";
  if (message.includes("email not confirmed")) return "Подтверди email.";
  if (message.includes("rate limit")) return "Лимит писем. Позже или Google.";
  if (message.includes("email provider is disabled")) return "Email-вход выключен.";
  if (message.includes("signup is disabled")) return "Регистрация выключена.";
  if (message.includes("user already registered") || message.includes("already registered")) return "Такой email уже есть.";
  if (message.includes("provider is not enabled") || message.includes("unsupported provider")) return "Google ещё не включён.";
  if (message.includes("redirect")) return "Google redirect не настроен.";
  if (message.includes("weak password") || message.includes("password")) return "Пароль 8+ символов.";
  return "Не вышло. Ещё раз.";
};

const showAuth = (mode = authSession ? "login" : authMode) => {
  setAuthMode(mode);
  authPausedOnboarding = Boolean(onboarding?.classList.contains("show") && !onboardingDone());
  if (authPausedOnboarding) onboarding?.classList.add("auth-paused");
  authPanel?.classList.add("show");
  syncBackgroundInteractivity();
  setTimeout(() => authEmail?.focus(), 80);
};

const hideAuth = () => {
  authPanel?.classList.remove("show");
  if (authPausedOnboarding && !onboardingDone()) {
    onboarding?.classList.remove("auth-paused");
  }
  authPausedOnboarding = false;
  syncBackgroundInteractivity();
};

const advanceAfterAccess = (message) => {
  const shouldMoveForward = !onboardingDone() && onboardingStep === 0 && Boolean(
    onboarding?.classList.contains("show") ||
    onboarding?.classList.contains("auth-paused") ||
    authPanel?.classList.contains("show")
  );
  setAuthStatus(message);
  setOnboardingNotice(message);
  hideAuth();
  if (shouldMoveForward) {
    onboarding?.classList.add("show");
    onboarding?.classList.remove("auth-paused");
    showOnboardingStep(1);
    syncBackgroundInteractivity();
  }
};

const updateGoogleButton = () => {
  if (!googleLogin) return;
  if (googleAuthEnabled === false) {
    setGoogleLoginText("Google выкл.");
    googleLogin.classList.add("is-muted");
  } else {
    setGoogleLoginText("Google");
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
    setAuthStatus("Вход пока не подключён.");
    return;
  }

  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  await checkGoogleProvider();

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      handlePasswordRecovery(session);
      return;
    }
    applyAuthSession(session);
  });

  const { data } = await supabaseClient.auth.getSession();
  await applyAuthSession(data.session);
};

const applyAuthSession = async (session) => {
  authSession = session || null;
  authLoggedInBlocks.forEach((block) => {
    block.hidden = !authSession;
  });
  const user = session?.user;
  if (!user) {
    const pendingMessage = pendingAccountMessage();
    setAuthStatus(pendingMessage || authModeCopy[authMode]?.status || "Войди через Google или создай email + пароль.");
    if (pendingMessage && !onboardingDone()) setOnboardingNotice(pendingMessage);
    return;
  }

  const email = user.email || "аккаунт";
  const name = user.user_metadata?.name || user.user_metadata?.full_name || email;
  const existingSessionId = readSetting("session_id");
  clearPendingAccount();
  rememberSetting("account_email", email);
  rememberSetting("account_user_id", user.id);
  setAccountState("signed_in", email);
  if (!existingSessionId) {
    rememberSetting("session_id", `auth-${user.id}`);
  }
  if (onboardingName && !onboardingName.value.trim()) onboardingName.value = name;
  if (authName && !authName.value.trim()) authName.value = name;
  if (authEmail && !authEmail.value.trim()) authEmail.value = email;
  clearAuthSecrets();
  await syncProfile();
  await checkTelegramLink();
  advanceAfterAccess(`Вошла: ${email}`);
};

const handlePasswordRecovery = (session) => {
  authSession = session || null;
  const user = session?.user;
  if (user?.email && authEmail) authEmail.value = user.email;
  showAuth("signup");
  setAuthStatus("Новый пароль.");
};

const requireAuthClient = () => {
  if (!supabaseClient) {
    setAuthStatus("Вход пока не подключён.");
    return false;
  }
  return true;
};

const signInGoogle = async () => {
  if (!requireAuthClient()) return;
  if (googleAuthEnabled === false) {
    setAuthStatus("Google ещё не включён.");
    return;
  }
  setAuthStatus("Открываю Google...");
  if (googleLogin) googleLogin.disabled = true;
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: canonicalAppUrl() },
  });
  if (error) {
    if (googleLogin) googleLogin.disabled = false;
    setAuthStatus(friendlyAuthError(error));
  }
};

const signInEmail = async () => {
  if (!requireAuthClient()) return;
  const email = getAuthEmail();
  const password = getAuthPassword();
  if (!isValidEmail(email)) {
    setAuthStatus("Нужен email.");
    return;
  }
  if (!password) {
    setAuthStatus("Нужен пароль.");
    return;
  }
  setAuthStatus("Проверяю...");
  if (emailLogin) emailLogin.disabled = true;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (emailLogin) emailLogin.disabled = false;
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  if (!data.session) {
    setAuthStatus("Подтверди email.");
    return;
  }
  await applyAuthSession(data.session);
};

const signUpEmail = async () => {
  if (!requireAuthClient()) return;
  const currentUser = authSession?.user;
  const name = authName?.value.trim() || onboardingName?.value.trim() || "";
  const email = getAuthEmail() || currentUser?.email || "";
  const password = getAuthPassword();
  const confirmPassword = authPasswordConfirm?.value || "";
  if (password.length < 8) {
    setAuthStatus("Пароль 8+ символов.");
    return;
  }
  if (password !== confirmPassword) {
    setAuthStatus("Пароли разные.");
    return;
  }

  if (currentUser) {
    setAuthStatus("Сохраняю...");
    const { error } = await supabaseClient.auth.updateUser({
      password,
      data: { name: name || currentUser.user_metadata?.name || currentUser.email },
    });
    if (error) {
      setAuthStatus(friendlyAuthError(error));
      return;
    }
    clearAuthSecrets();
    advanceAfterAccess("Пароль сохранён.");
    return;
  }

  if (!isValidEmail(email)) {
    setAuthStatus("Нужен email.");
    return;
  }

  setAuthStatus("Создаю...");
  if (emailSignup) emailSignup.disabled = true;
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: canonicalAppUrl(),
      data: { name },
    },
  });
  if (emailSignup) emailSignup.disabled = false;
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  if (data.session) {
    await applyAuthSession(data.session);
    return;
  }
  clearAuthSecrets();
  rememberSetting("pending_email", email);
  setAccountState("pending_email", email);
  setAuthMode("login", { keepStatus: true });
  if (authEmail) authEmail.value = email;
  const message = `Письмо отправлено: ${email}`;
  setAuthStatus(message);
  setOnboardingNotice(message);
};

const sendEmailOtp = async () => {
  if (!requireAuthClient()) return;
  const email = getAuthEmail();
  if (!isValidEmail(email)) {
    setAuthStatus("Нужен email.");
    return;
  }
  setAuthStatus("Отправляю...");
  if (emailOtp) emailOtp.disabled = true;
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: canonicalAppUrl(),
      shouldCreateUser: true,
    },
  });
  if (emailOtp) emailOtp.disabled = false;
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  setAuthStatus("Код отправлен.");
};

const verifyEmailOtp = async () => {
  if (!requireAuthClient()) return;
  const email = getAuthEmail();
  const token = authOtpCode?.value.trim().replace(/\s+/g, "") || "";
  if (!isValidEmail(email)) {
    setAuthStatus("Нужен email.");
    return;
  }
  if (!/^\d{6}$/.test(token)) {
    setAuthStatus("Нужно 6 цифр.");
    return;
  }
  setAuthStatus("Проверяю...");
  if (verifyOtp) verifyOtp.disabled = true;
  const { data, error } = await supabaseClient.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (verifyOtp) verifyOtp.disabled = false;
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  if (!data.session) {
    setAuthStatus("Открой ссылку письма.");
    return;
  }
  await applyAuthSession(data.session);
};

const requestPasswordReset = async () => {
  if (!requireAuthClient()) return;
  const email = getAuthEmail();
  if (!isValidEmail(email)) {
    setAuthStatus("Нужен email.");
    return;
  }
  setAuthStatus("Отправляю...");
  if (resetPassword) resetPassword.disabled = true;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: canonicalAppUrl(),
  });
  if (resetPassword) resetPassword.disabled = false;
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  setAuthStatus("Письмо отправлено.");
};

const signOut = async () => {
  if (!requireAuthClient()) return;
  await supabaseClient.auth.signOut();
  localStorage.removeItem("ray_account_email");
  localStorage.removeItem("ray_account_user_id");
  localStorage.removeItem("ray_account_state");
  localStorage.removeItem("ray_pending_email");
  setAuthStatus("Вышла.");
};

const resetAuthForTesting = async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  [
    "ray_account_email",
    "ray_account_user_id",
    "ray_account_state",
    "ray_pending_email",
    "ray_telegram_linked",
    "ray_onboarding_done",
    "ray_onboarding_step",
    "ray_privacy_seen",
    "ray_session_id",
    "ray_profile_name",
    "ray_purposes",
  ].forEach((key) => localStorage.removeItem(key));
  onboarding?.classList.add("show");
  onboarding?.classList.remove("auth-paused");
  showOnboardingStep(0);
  hideAuth();
  syncBackgroundInteractivity();
  setAuthStatus("Сброшено.");
};

async function checkTelegramLink() {
  const apiUrl = getApiUrl();
  if (!apiUrl || !telegramLinkStatus) return false;

  try {
    const response = await fetch(`${apiUrl}/link/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: ensureSessionId() }),
    });
    const data = await response.json();
    if (data.linked) {
      rememberSetting("telegram_linked", "yes");
      setTelegramLinkStatus("Telegram связан.");
      return true;
    } else {
      localStorage.removeItem("ray_telegram_linked");
      setTelegramLinkStatus("Telegram не связан.");
      return false;
    }
  } catch (error) {
    setTelegramLinkStatus("API не отвечает.");
    return false;
  }
}

const pollTelegramLink = () => {
  window.clearInterval(telegramPollTimer);
  let attempts = 0;
  telegramPollTimer = window.setInterval(async () => {
    attempts += 1;
    const linked = await checkTelegramLink();
    if (linked) {
      window.clearInterval(telegramPollTimer);
      advanceAfterAccess("Telegram связан.");
    } else if (attempts >= 24) {
      window.clearInterval(telegramPollTimer);
      setTelegramLinkStatus("Код не подтверждён.");
    }
  }, 3000);
};

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
  if (lower.includes("картин") || lower.includes("фото")) return "Фото-анализ пока выключен. Когда подключим vision-ключ, я смогу разбирать изображения здесь.";
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
    setApiStatus("API сохранён, но профиль пока не отправился. Проверь Railway и попробуй снова.");
  }
};

const startVoiceInput = (targetInput, button, targetMessages = messages) => {
  if (!SpeechRecognition) {
    addMessage("Голосовой ввод в этом браузере не поддерживается. На iPhone попробуй диктовку клавиатуры.", "ray", targetMessages);
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
    addMessage("Не получилось услышать голос. Проверь разрешение микрофона.", "ray", targetMessages);
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
  syncBackgroundInteractivity();
};

const hideConsent = () => {
  consentPanel.classList.remove("show");
  syncBackgroundInteractivity();
};
const showInstall = () => {
  installPanel.classList.add("show");
  syncBackgroundInteractivity();
};
const hideInstall = () => {
  installPanel.classList.remove("show");
  syncBackgroundInteractivity();
};
const companionAllowed = () => readSetting("companion_allowed") === "yes";

setAuthMode("login");

if (readSetting("onboarding_done") === "yes") {
  onboarding.classList.remove("show");
  if (!readSetting("privacy_seen")) showConsent();
} else {
  const savedOnboardingStep = Number.parseInt(readSetting("onboarding_step") || "0", 10);
  showOnboardingStep(Number.isFinite(savedOnboardingStep) ? savedOnboardingStep : 0);
  const pendingMessage = pendingAccountMessage();
  if (pendingMessage) setOnboardingNotice(pendingMessage);
}
syncBackgroundInteractivity();

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
openAuth?.addEventListener("click", () => showAuth("login"));
openAuthOnboarding?.addEventListener("click", () => showAuth("signup"));
openAuthSettings?.addEventListener("click", () => showAuth("login"));
closeAuth?.addEventListener("click", hideAuth);
authModeButtons.forEach((button) => {
  button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
});
googleLogin?.addEventListener("click", signInGoogle);
emailLogin?.addEventListener("click", signInEmail);
emailSignup?.addEventListener("click", signUpEmail);
emailOtp?.addEventListener("click", sendEmailOtp);
verifyOtp?.addEventListener("click", verifyEmailOtp);
resetPassword?.addEventListener("click", requestPasswordReset);
authLogout?.addEventListener("click", signOut);
authLogoutSettings?.addEventListener("click", signOut);
resetLocalAuth?.addEventListener("click", resetAuthForTesting);
nextStepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (onboardingStep === 0 && supabaseClient && !authSession) {
      setOnboardingNotice("Ок. Вход можно позже.");
    }
    showOnboardingStep(onboardingStep + 1);
  });
});

finishOnboarding.addEventListener("click", async () => {
  rememberSetting("onboarding_done", "yes");
  rememberSetting("privacy_seen", "yes");
  localStorage.removeItem("ray_onboarding_step");
  rememberSetting("profile_name", onboardingName.value.trim());
  rememberSetting("purposes", JSON.stringify(collectPurposes()));
  rememberSetting("memory_allowed", onboardingMemory.checked ? "yes" : "no");
  rememberSetting("companion_allowed", onboardingCompanion.checked ? "yes" : "no");
  onboarding.classList.remove("show");
  syncBackgroundInteractivity();
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
    setApiStatus("Ссылка сохранена, но API сейчас не отвечает. Проверь Railway URL и переменные.");
  }
});

const startTelegramLink = async (button, options = {}) => {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    setTelegramLinkStatus("API не подключён.");
    return;
  }

  if (button) button.disabled = true;
  if (options.autoAdvance) setAuthStatus("Telegram...");
  setTelegramLinkStatus("Код...");
  try {
    const response = await fetch(`${apiUrl}/link/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: ensureSessionId() }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.linked) {
      setTelegramLinkStatus("Telegram уже связан.");
      if (options.autoAdvance) advanceAfterAccess("Telegram связан.");
      return;
    }

    setTelegramLinkStatus(
      `<code>/link ${String(data.code).replace(/[<>&"]/g, "")}</code> -> <a class="inline-link" href="https://t.me/rey_helper_bot" target="_blank" rel="noreferrer">бот</a>`
    );
    if (options.autoAdvance) pollTelegramLink();
  } catch (error) {
    setTelegramLinkStatus("Код не создался.");
  } finally {
    if (button) button.disabled = false;
  }
};

linkTelegram?.addEventListener("click", () => startTelegramLink(linkTelegram));
telegramLogin?.addEventListener("click", () => startTelegramLink(telegramLogin, { autoAdvance: true }));

const applyCompanionColor = (color) => {
  document.body.classList.remove("companion-amber", "companion-blue", "companion-rose");
  if (color !== "teal") document.body.classList.add(`companion-${color}`);
  swatches.forEach((button) => button.classList.toggle("active", button.dataset.companion === color));
  rememberSetting("companion_color", color);
};

const setCompanionVisible = (visible) => {
  companion.classList.toggle("hidden", !visible);
  toggleCompanion?.classList.toggle("active", visible);
  toggleCompanion?.setAttribute("aria-pressed", visible ? "true" : "false");
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

voiceInput.addEventListener("click", () => startVoiceInput(input, voiceInput, messages));
quickVoiceInput.addEventListener("click", () => startVoiceInput(quickChatInput, quickVoiceInput, quickChatBody));

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

window.lucide?.createIcons();
initAuth();
