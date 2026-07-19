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
const accountCard = document.getElementById("accountCard");
const authStatus = document.getElementById("authStatus");
const authStatusSettings = document.getElementById("authStatusSettings");
const authStatusHint = document.getElementById("authStatusHint");
const authStatusModal = document.getElementById("authStatusModal");
const authPanel = document.getElementById("authPanel");
const authTitle = document.getElementById("authTitle");
const openAuth = document.getElementById("openAuth");
const openLoginOnboarding = document.getElementById("openLoginOnboarding");
const openAuthOnboarding = document.getElementById("openAuthOnboarding");
const openAuthSettings = document.getElementById("openAuthSettings");
const closeAuth = document.getElementById("closeAuth");
const authContinue = document.getElementById("authContinue");
const authSetPassword = document.getElementById("authSetPassword");
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
const authSignedInBlocks = [...document.querySelectorAll("[data-auth-signed-in]")];
const authSignedOutBlocks = [...document.querySelectorAll("[data-auth-signed-out]")];
const authLoggedInBlocks = [...document.querySelectorAll("[data-auth-logged-in]")];
const authSignedInEmail = document.getElementById("authSignedInEmail");
const authProviderGrid = document.querySelector(".auth-provider-grid");
const appShell = document.querySelector(".app-shell");

let companionMoveTimer = null;
let dragState = null;
let installPrompt = null;
let voiceEnabled = localStorage.getItem("ray_voice_reply") === "yes";
let onboardingStep = 0;
let supabaseClient = null;
let googleAuthEnabled = null;
let authServerReady = null;
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
const API_AUTH_TOKEN_KEY = "ray_api_auth_token";
const API_ACCOUNT_EMAIL_KEY = "ray_api_account_email";
const API_ACCOUNT_NAME_KEY = "ray_api_account_name";
const API_ACCOUNT_USER_ID_KEY = "ray_api_account_user_id";
const LOCAL_AUTH_ACCOUNTS_KEY = "ray_local_accounts";
const LOCAL_AUTH_SESSION_KEY = "ray_local_session";
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
  if (authStatusModal) authStatusModal.textContent = text;
};

const setAccountPanel = (state, detail = "") => {
  if (accountCard) accountCard.dataset.state = state;
  if (!authStatusSettings || !authStatusHint) return;

  if (state === "signed-in") {
    authStatusSettings.textContent = "Вошла";
    authStatusHint.textContent = detail || "Аккаунт активен.";
    return;
  }

  if (state === "pending") {
    authStatusSettings.textContent = "Проверь email";
    authStatusHint.textContent = detail || "Аккаунт создан, осталось подтверждение.";
    return;
  }

  if (state === "offline") {
    authStatusSettings.textContent = "Ray ID";
    authStatusHint.textContent = detail || "Можно создать аккаунт на этом устройстве.";
    return;
  }

  authStatusSettings.textContent = "Гость";
  authStatusHint.textContent = "Войди, чтобы память была общей.";
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

const pendingAccountEmail = () => (
  readSetting("pending_email") || readSetting("account_email") || ""
);

const authModeCopy = {
  login: {
    title: "Вход",
    note: "Email + пароль.",
    status: "Вход.",
  },
  signup: {
    title: "Новый профиль",
    note: "Имя, email, пароль.",
    status: "Создать.",
  },
  otp: {
    title: "Код",
    note: "Email или Telegram.",
    status: "Код.",
  },
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const getAuthEmail = () => authEmail?.value.trim().toLowerCase() || "";
const getAuthPassword = () => authPassword?.value || "";
const localAuthAvailable = () => !supabaseClient || authServerReady === false;
const apiAuthAvailable = () => Boolean(getApiUrl());
const getApiAuthToken = () => localStorage.getItem(API_AUTH_TOKEN_KEY) || "";

const makeApiSession = (data) => ({
  api: true,
  token: data.token || getApiAuthToken(),
  user: {
    id: String(data.user?.user_id || data.user_id || ""),
    email: data.user?.email || data.email || "",
    user_metadata: { name: data.user?.name || data.name || "" },
    app_metadata: { provider: "ray-api" },
  },
});

const saveApiAuthSession = (data) => {
  if (data.token) localStorage.setItem(API_AUTH_TOKEN_KEY, data.token);
  const user = data.user || {};
  if (user.email) localStorage.setItem(API_ACCOUNT_EMAIL_KEY, user.email);
  if (user.name) localStorage.setItem(API_ACCOUNT_NAME_KEY, user.name);
  if (user.user_id !== undefined) localStorage.setItem(API_ACCOUNT_USER_ID_KEY, String(user.user_id));
};

const clearApiAuthSession = () => {
  localStorage.removeItem(API_AUTH_TOKEN_KEY);
  localStorage.removeItem(API_ACCOUNT_EMAIL_KEY);
  localStorage.removeItem(API_ACCOUNT_NAME_KEY);
  localStorage.removeItem(API_ACCOUNT_USER_ID_KEY);
};

const apiAuthRequest = async (path, payload = {}) => {
  const apiUrl = getApiUrl();
  if (!apiUrl) throw new Error("api_auth_unavailable");
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    const error = new Error(data.detail || data.message || `api_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
};

const restoreApiSession = async () => {
  const token = getApiAuthToken();
  if (!token || !apiAuthAvailable()) return false;
  try {
    const data = await apiAuthRequest("/auth/me", { auth_token: token });
    const sessionData = { token, user: data.user, expires_at: data.expires_at };
    saveApiAuthSession(sessionData);
    await applyAuthSession(makeApiSession(sessionData));
    return true;
  } catch (error) {
    if (error.status === 401) clearApiAuthSession();
    return false;
  }
};

const signUpApiAccount = async ({ name, email, password }) => {
  const data = await apiAuthRequest("/auth/signup", { name, email, password });
  saveApiAuthSession(data);
  return makeApiSession(data);
};

const signInApiAccount = async (email, password) => {
  const data = await apiAuthRequest("/auth/login", { email, password });
  saveApiAuthSession(data);
  return makeApiSession(data);
};

const randomId = (prefix = "local") => `${prefix}-${window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

const randomSalt = () => {
  const bytes = new Uint8Array(16);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return [...bytes].map((item) => item.toString(16).padStart(2, "0")).join("");
  }
  return randomId("salt");
};

const bytesToHex = (buffer) => (
  [...new Uint8Array(buffer)].map((item) => item.toString(16).padStart(2, "0")).join("")
);

const fallbackPasswordHash = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
};

const hashLocalPassword = async (password, salt) => {
  const value = `${salt}:${password}`;
  if (window.crypto?.subtle && window.TextEncoder) {
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return `sha256-${bytesToHex(digest)}`;
  }
  return fallbackPasswordHash(value);
};

const readLocalAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_AUTH_ACCOUNTS_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeLocalAccounts = (accounts) => {
  localStorage.setItem(LOCAL_AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const makeLocalSession = (account) => ({
  local: true,
  user: {
    id: account.id,
    email: account.email,
    user_metadata: { name: account.name || account.email },
    app_metadata: { provider: "ray-local" },
  },
});

const saveLocalSession = (account) => {
  localStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify({
    id: account.id,
    email: account.email,
  }));
};

const clearLocalSession = () => {
  localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
};

const restoreLocalSession = async () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_AUTH_SESSION_KEY) || "null");
    const email = saved?.email?.toLowerCase();
    const account = email ? readLocalAccounts()[email] : null;
    if (!account || account.id !== saved.id) return false;
    await applyAuthSession(makeLocalSession(account));
    return true;
  } catch {
    clearLocalSession();
    return false;
  }
};

const createLocalAccount = async ({ name, email, password }) => {
  const accounts = readLocalAccounts();
  const normalizedEmail = email.toLowerCase();
  if (accounts[normalizedEmail]) throw new Error("local_account_exists");
  const salt = randomSalt();
  const account = {
    id: randomId("ray"),
    email: normalizedEmail,
    name: name || normalizedEmail.split("@")[0],
    salt,
    passwordHash: await hashLocalPassword(password, salt),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  accounts[normalizedEmail] = account;
  writeLocalAccounts(accounts);
  saveLocalSession(account);
  return makeLocalSession(account);
};

const signInLocalAccount = async (email, password) => {
  const account = readLocalAccounts()[email.toLowerCase()];
  if (!account) throw new Error("local_account_missing");
  const passwordHash = await hashLocalPassword(password, account.salt);
  if (passwordHash !== account.passwordHash) throw new Error("local_invalid_credentials");
  saveLocalSession(account);
  return makeLocalSession(account);
};

const updateLocalAccountPassword = async ({ user, name, password }) => {
  const accounts = readLocalAccounts();
  const email = user.email.toLowerCase();
  const account = accounts[email];
  if (!account) throw new Error("local_account_missing");
  const salt = randomSalt();
  account.name = name || account.name || email.split("@")[0];
  account.salt = salt;
  account.passwordHash = await hashLocalPassword(password, salt);
  account.updatedAt = new Date().toISOString();
  accounts[email] = account;
  writeLocalAccounts(accounts);
  saveLocalSession(account);
  return makeLocalSession(account);
};

const authNetworkFailed = (error) => {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("failed to fetch") || message.includes("network") || message.includes("resolve") || message.includes("dns");
};

const clearAuthSecrets = () => {
  if (authPassword) authPassword.value = "";
  if (authPasswordConfirm) authPasswordConfirm.value = "";
  if (authOtpCode) authOtpCode.value = "";
};

const setAuthMode = (mode, options = {}) => {
  authMode = authModeCopy[mode] ? mode : "login";
  if (authPanel) authPanel.dataset.authMode = authMode;
  syncAuthBlocks();
  if (emailSignup) emailSignup.textContent = authSession?.user ? "Сохранить пароль" : "Создать";
  if (!options.keepStatus) setAuthStatus(authModeCopy[authMode].status);
};

const syncAuthBlocks = () => {
  const signedIn = Boolean(authSession?.user);
  const editingPassword = Boolean(authPanel?.classList.contains("editing-password"));
  authModeButtons.forEach((button) => {
    const isActive = button.dataset.authMode === authMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  authSignedInBlocks.forEach((block) => {
    block.hidden = !signedIn || editingPassword;
  });
  authSignedOutBlocks.forEach((block) => {
    block.hidden = signedIn && !editingPassword;
  });
  authLoggedInBlocks.forEach((block) => {
    block.hidden = !signedIn;
  });
  authModeBlocks.forEach((block) => {
    const modes = (block.dataset.authFor || "").split(/\s+/);
    const providerIsUnavailable = block === authProviderGrid && googleAuthEnabled === false;
    block.hidden = (signedIn && !editingPassword) || !modes.includes(authMode) || providerIsUnavailable;
  });
  if (authTitle) authTitle.textContent = authModeCopy[authMode].title;
  if (authModeNote) {
    if (localAuthAvailable() && ["login", "signup"].includes(authMode)) {
      authModeNote.textContent = authMode === "signup"
        ? "Ray ID сохранится на этом устройстве."
        : "Вход в Ray ID на этом устройстве.";
    } else {
      authModeNote.textContent = authModeCopy[authMode].note;
    }
  }
  if (authPassword) {
    authPassword.autocomplete = authMode === "signup" ? "new-password" : "current-password";
  }
  if (authSignedInEmail) {
    const email = authSession?.user?.email;
    authSignedInEmail.textContent = email
      ? `${email}${authSession?.local ? " · на этом устройстве" : ""}`
      : "Аккаунт активен";
  }
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
  if (message.includes("account_exists")) return "Email уже есть. Нажми Войти.";
  if (message.includes("invalid_credentials")) return "Email или пароль не тот.";
  if (message.includes("invalid_email")) return "Нужен нормальный email.";
  if (message.includes("weak_password")) return "Пароль 8+ символов.";
  if (message.includes("api_auth_unavailable")) return "Ray API не подключён.";
  if (message.includes("local_account_exists")) return "Email уже есть. Нажми Войти.";
  if (message.includes("local_account_missing")) return "Аккаунта нет. Нажми Создать.";
  if (message.includes("local_invalid_credentials")) return "Email или пароль не тот.";
  if (message.includes("provider is not enabled") || message.includes("unsupported provider")) return "Google ещё не включён.";
  if (message.includes("redirect")) return "Google redirect не настроен.";
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("resolve") || message.includes("dns")) return "Регистрация не подключена.";
  if (message.includes("weak password") || message.includes("password")) return "Пароль 8+ символов.";
  return "Не вышло. Ещё раз.";
};

const setAuthServerOffline = () => {
  authServerReady = false;
  googleAuthEnabled = false;
  updateGoogleButton();
  setAccountPanel("offline", "Можно создать Ray ID на этом устройстве.");
  setAuthStatus("Серверный вход выключен. Работает Ray ID.");
  if (authModeNote) authModeNote.textContent = "Ray ID сохранится на этом устройстве.";
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
  authPanel?.classList.remove("editing-password");
  if (authPausedOnboarding && !onboardingDone()) {
    onboarding?.classList.remove("auth-paused");
  }
  authPausedOnboarding = false;
  syncAuthBlocks();
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
    googleLogin.hidden = true;
    if (authProviderGrid) authProviderGrid.hidden = true;
  } else {
    setGoogleLoginText("Google");
    googleLogin.classList.remove("is-muted");
    googleLogin.hidden = false;
    if (authProviderGrid) {
      const modes = (authProviderGrid.dataset.authFor || "").split(/\s+/);
      authProviderGrid.hidden = !modes.includes(authMode);
    }
  }
};

const checkGoogleProvider = async () => {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
  try {
    const response = await fetch(`${cleanUrl(window.SUPABASE_URL)}/auth/v1/settings`, {
      headers: { apikey: window.SUPABASE_ANON_KEY },
    });
    if (!response.ok) throw new Error(`Auth settings ${response.status}`);
    const settings = await response.json();
    authServerReady = true;
    googleAuthEnabled = Boolean(settings.external?.google);
    updateGoogleButton();
  } catch {
    setAuthServerOffline();
  }
};

const initAuth = async () => {
  if (await restoreApiSession()) return;

  if (!supabaseConfigured()) {
    setAuthServerOffline();
    await restoreLocalSession();
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
  if (authServerReady === false) {
    await restoreLocalSession();
    return;
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      handlePasswordRecovery(session);
      return;
    }
    applyAuthSession(session);
  });

  try {
    const { data } = await supabaseClient.auth.getSession();
    await applyAuthSession(data.session);
  } catch {
    setAuthServerOffline();
    await restoreLocalSession();
  }
};

const applyAuthSession = async (session) => {
  authSession = session || null;
  syncAuthBlocks();
  const user = session?.user;
  if (!user) {
    const pendingMessage = pendingAccountMessage();
    if (pendingMessage) {
      setAccountPanel("pending", pendingAccountEmail());
    } else {
      setAccountPanel("guest");
    }
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
  const accountDetail = session?.api
    ? `${email} · Ray Account`
    : session?.local
      ? `${email} · Ray ID на этом устройстве`
      : email;
  setAccountPanel("signed-in", accountDetail);
  setAuthStatus(`Вошла: ${email}`);
  if (window.location.hash.includes("access_token") || window.location.search.includes("code=")) {
    window.history.replaceState({}, document.title, canonicalAppUrl());
  }
  if (session?.local || session?.api) {
    rememberSetting("session_id", `auth-${user.id}`);
  }
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

const requireAuthClient = (action = "Вход") => {
  if (!supabaseClient) {
    setAuthStatus(`${action} не подключён.`);
    return false;
  }
  if (authServerReady === false) {
    setAuthServerOffline();
    setAuthStatus(`${action}: Supabase URL неверный.`);
    return false;
  }
  return true;
};

const signInGoogle = async () => {
  if (localAuthAvailable()) {
    setAuthStatus("Google включим после живого Supabase.");
    return;
  }
  if (!requireAuthClient()) return;
  if (googleAuthEnabled === false) {
    setAuthStatus("Google ещё не включён.");
    return;
  }
  setAuthStatus("Открываю Google...");
  if (googleLogin) googleLogin.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: canonicalAppUrl() },
    });
    if (error) {
      setAuthStatus(friendlyAuthError(error));
    }
  } catch (error) {
    setAuthStatus(friendlyAuthError(error));
  } finally {
    if (googleLogin) googleLogin.disabled = false;
  }
};

const signInEmail = async () => {
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
  if (apiAuthAvailable() && localAuthAvailable()) {
    setAuthStatus("Вхожу...");
    if (emailLogin) emailLogin.disabled = true;
    try {
      const session = await signInApiAccount(email, password);
      await applyAuthSession(session);
    } catch (error) {
      if (error.status === 401) {
        setAuthStatus(friendlyAuthError(error));
      } else {
        try {
          const session = await signInLocalAccount(email, password);
          await applyAuthSession(session);
        } catch (localError) {
          setAuthStatus(friendlyAuthError(error.status ? error : localError));
        }
      }
    } finally {
      if (emailLogin) emailLogin.disabled = false;
    }
    return;
  }
  if (localAuthAvailable()) {
    setAuthStatus("Вхожу...");
    if (emailLogin) emailLogin.disabled = true;
    try {
      const session = await signInLocalAccount(email, password);
      await applyAuthSession(session);
    } catch (error) {
      setAuthStatus(friendlyAuthError(error));
    } finally {
      if (emailLogin) emailLogin.disabled = false;
    }
    return;
  }
  if (!requireAuthClient("Вход")) return;
  setAuthStatus("Проверяю...");
  if (emailLogin) emailLogin.disabled = true;
  let data = null;
  let error = null;
  try {
    ({ data, error } = await supabaseClient.auth.signInWithPassword({ email, password }));
  } catch (requestError) {
    error = requestError;
  } finally {
    if (emailLogin) emailLogin.disabled = false;
  }
  if (error) {
    if (authNetworkFailed(error)) {
      setAuthServerOffline();
      try {
        const session = await signInLocalAccount(email, password);
        await applyAuthSession(session);
      } catch (localError) {
        setAuthStatus(friendlyAuthError(localError));
      }
      return;
    }
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
    if (authSession?.api) {
      setAuthStatus("Пароль меняется через backend позже.");
      return;
    }
    if (authSession?.local) {
      setAuthStatus("Сохраняю...");
      if (emailSignup) emailSignup.disabled = true;
      try {
        const session = await updateLocalAccountPassword({ user: currentUser, name, password });
        await applyAuthSession(session);
      } catch (error) {
        setAuthStatus(friendlyAuthError(error));
      } finally {
        if (emailSignup) emailSignup.disabled = false;
      }
      return;
    }
    if (!requireAuthClient("Пароль")) return;
    setAuthStatus("Сохраняю...");
    let error = null;
    try {
      ({ error } = await supabaseClient.auth.updateUser({
        password,
        data: { name: name || currentUser.user_metadata?.name || currentUser.email },
      }));
    } catch (requestError) {
      error = requestError;
    }
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

  if (apiAuthAvailable() && localAuthAvailable()) {
    setAuthStatus("Создаю...");
    if (emailSignup) emailSignup.disabled = true;
    try {
      const session = await signUpApiAccount({ name, email, password });
      await applyAuthSession(session);
    } catch (error) {
      if (error.status === 409) {
        setAuthMode("login", { keepStatus: true });
        if (authEmail) authEmail.value = email;
        setAuthStatus(friendlyAuthError(error));
      } else {
        try {
          const session = await createLocalAccount({ name, email, password });
          await applyAuthSession(session);
        } catch (localError) {
          setAuthStatus(friendlyAuthError(error.status ? error : localError));
        }
      }
    } finally {
      if (emailSignup) emailSignup.disabled = false;
    }
    return;
  }

  if (localAuthAvailable()) {
    setAuthStatus("Создаю...");
    if (emailSignup) emailSignup.disabled = true;
    try {
      const session = await createLocalAccount({ name, email, password });
      await applyAuthSession(session);
    } catch (error) {
      if (String(error?.message || error).includes("local_account_exists")) {
        setAuthMode("login", { keepStatus: true });
        if (authEmail) authEmail.value = email;
      }
      setAuthStatus(friendlyAuthError(error));
    } finally {
      if (emailSignup) emailSignup.disabled = false;
    }
    return;
  }

  if (!requireAuthClient("Регистрация")) return;
  setAuthStatus("Создаю...");
  if (emailSignup) emailSignup.disabled = true;
  let data = null;
  let error = null;
  try {
    ({ data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: canonicalAppUrl(),
        data: { name },
      },
    }));
  } catch (requestError) {
    error = requestError;
  } finally {
    if (emailSignup) emailSignup.disabled = false;
  }
  if (error) {
    if (authNetworkFailed(error)) {
      setAuthServerOffline();
      try {
        const session = await createLocalAccount({ name, email, password });
        await applyAuthSession(session);
      } catch (localError) {
        if (String(localError?.message || localError).includes("local_account_exists")) {
          setAuthMode("login", { keepStatus: true });
          if (authEmail) authEmail.value = email;
        }
        setAuthStatus(friendlyAuthError(localError));
      }
      return;
    }
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    clearAuthSecrets();
    setAuthMode("login", { keepStatus: true });
    if (authEmail) authEmail.value = email;
    setAuthStatus("Email уже есть. Нажми Войти.");
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
  setAccountPanel("pending", email);
  const message = "Аккаунт создан. Проверь email.";
  setAuthStatus(message);
  if (authModeNote) authModeNote.textContent = email;
  setOnboardingNotice(message);
};

const sendEmailOtp = async () => {
  const email = getAuthEmail();
  if (!isValidEmail(email)) {
    setAuthStatus("Нужен email.");
    return;
  }
  if (localAuthAvailable()) {
    setAuthStatus("Email-код включим после живого Supabase. Сейчас работает пароль.");
    return;
  }
  if (!requireAuthClient("Код")) return;
  setAuthStatus("Отправляю...");
  if (emailOtp) emailOtp.disabled = true;
  let error = null;
  try {
    ({ error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: canonicalAppUrl(),
        shouldCreateUser: true,
      },
    }));
  } catch (requestError) {
    error = requestError;
  } finally {
    if (emailOtp) emailOtp.disabled = false;
  }
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  setAuthStatus("Код отправлен.");
};

const verifyEmailOtp = async () => {
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
  if (localAuthAvailable()) {
    setAuthStatus("Код включим после живого Supabase.");
    return;
  }
  if (!requireAuthClient("Код")) return;
  setAuthStatus("Проверяю...");
  if (verifyOtp) verifyOtp.disabled = true;
  let data = null;
  let error = null;
  try {
    ({ data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    }));
  } catch (requestError) {
    error = requestError;
  } finally {
    if (verifyOtp) verifyOtp.disabled = false;
  }
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
  const email = getAuthEmail();
  if (!isValidEmail(email)) {
    setAuthStatus("Нужен email.");
    return;
  }
  if (localAuthAvailable()) {
    setAuthStatus("Сброс пароля включим после живого Supabase. Сейчас создай новый Ray ID.");
    return;
  }
  if (!requireAuthClient("Пароль")) return;
  setAuthStatus("Отправляю...");
  if (resetPassword) resetPassword.disabled = true;
  let error = null;
  try {
    ({ error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: canonicalAppUrl(),
    }));
  } catch (requestError) {
    error = requestError;
  } finally {
    if (resetPassword) resetPassword.disabled = false;
  }
  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }
  setAuthStatus("Письмо отправлено.");
};

const signOut = async () => {
  const apiToken = getApiAuthToken();
  if (apiToken && apiAuthAvailable()) {
    try {
      await apiAuthRequest("/auth/logout", { auth_token: apiToken });
    } catch {
      // The local session must still be cleared if the API is temporarily down.
    }
  }
  if (supabaseClient && !authSession?.local && !authSession?.api) {
    try {
      await supabaseClient.auth.signOut();
    } catch {
      // Local cleanup is still useful if the remote sign-out request fails.
    }
  }
  authSession = null;
  clearApiAuthSession();
  clearLocalSession();
  localStorage.removeItem("ray_account_email");
  localStorage.removeItem("ray_account_user_id");
  localStorage.removeItem("ray_account_state");
  localStorage.removeItem("ray_pending_email");
  syncAuthBlocks();
  setAccountPanel("guest");
  setAuthStatus("Вышла.");
};

const resetAuthForTesting = async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  [
    "ray_account_email",
    "ray_account_user_id",
    "ray_account_state",
    "ray_pending_email",
    API_AUTH_TOKEN_KEY,
    API_ACCOUNT_EMAIL_KEY,
    API_ACCOUNT_NAME_KEY,
    API_ACCOUNT_USER_ID_KEY,
    "ray_telegram_linked",
    "ray_onboarding_done",
    "ray_onboarding_step",
    "ray_privacy_seen",
    "ray_session_id",
    LOCAL_AUTH_SESSION_KEY,
    "ray_profile_name",
    "ray_purposes",
  ].forEach((key) => localStorage.removeItem(key));
  onboarding?.classList.add("show");
  onboarding?.classList.remove("auth-paused");
  showOnboardingStep(0);
  hideAuth();
  syncBackgroundInteractivity();
  setAccountPanel("guest");
  setAuthStatus("Сброшено.");
};

async function checkTelegramLink() {
  const apiUrl = getApiUrl();
  if (!apiUrl || !telegramLinkStatus) return false;

  try {
    const response = await fetch(`${apiUrl}/link/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: ensureSessionId(),
        auth_token: getApiAuthToken() || undefined,
      }),
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
          auth_token: getApiAuthToken() || undefined,
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
        auth_token: getApiAuthToken() || undefined,
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
openLoginOnboarding?.addEventListener("click", () => showAuth("login"));
openAuthOnboarding?.addEventListener("click", () => showAuth("signup"));
openAuthSettings?.addEventListener("click", () => showAuth("login"));
closeAuth?.addEventListener("click", hideAuth);
authContinue?.addEventListener("click", () => {
  const email = authSession?.user?.email || readSetting("account_email") || "аккаунт";
  advanceAfterAccess(`Вошла: ${email}`);
});
authSetPassword?.addEventListener("click", () => {
  if (!authSession?.user) return;
  authPanel?.classList.add("editing-password");
  setAuthMode("signup", { keepStatus: true });
  if (authEmail) authEmail.value = authSession.user.email || "";
  setAuthStatus("Новый пароль.");
  setTimeout(() => authPassword?.focus(), 80);
});
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
  rememberSetting("profile_name", (onboardingName?.value || "").trim());
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
      body: JSON.stringify({
        session_id: ensureSessionId(),
        auth_token: getApiAuthToken() || undefined,
      }),
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
