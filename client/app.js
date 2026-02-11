const API_BASE = window.__API_BASE__ || "";
let token = localStorage.getItem("token") || "";
let currentUser = null;

const authEl = document.getElementById("auth");
const dashboardEl = document.getElementById("dashboard");
const profileEl = document.getElementById("profile");
const progressEl = document.getElementById("progress");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegisterBtn = document.getElementById("showRegister");
const backToLoginBtn = document.getElementById("backToLogin");
const gamePanel = document.getElementById("gamePanel");
const themeToggle = document.getElementById("themeToggle");
const profileBtn = document.getElementById("profileBtn");

const bamboozleBoard = document.getElementById("bamboozleBoard");
const bamboozleScoreEl = document.getElementById("bamboozleScore");
const bamboozleReset = document.getElementById("bamboozleReset");
const bamboozlePreview = document.getElementById("bamboozlePreview");
const bamboozleAnswer = document.getElementById("bamboozleAnswer");
const bamboozleResult = document.getElementById("bamboozleResult");
const bamboozleCheck = document.getElementById("bamboozleCheck");
const bamboozleCorrect = document.getElementById("bamboozleCorrect");
const bamboozleWrong = document.getElementById("bamboozleWrong");
const bamboozleCountdown = document.getElementById("bamboozleCountdown");
const bamboozleImage = document.getElementById("bamboozleImage");
const bamboozleEmojiFallback = document.getElementById("bamboozleEmojiFallback");
const bamboozleEmojiPop = document.getElementById("bamboozleEmojiPop");
const bamboozleOverlay = document.getElementById("bamboozleOverlay");
const teamAScoreEl = document.getElementById("teamAScore");
const teamBScoreEl = document.getElementById("teamBScore");
const teamTurnEl = document.getElementById("teamTurn");

const spellEmoji = document.getElementById("spellEmoji");
const spellLetters = document.getElementById("spellLetters");
const spellAnswer = document.getElementById("spellAnswer");
const spellResult = document.getElementById("spellResult");
const spellScoreEl = document.getElementById("spellScore");
const spellNext = document.getElementById("spellNext");
const spellSpeak = document.getElementById("spellSpeak");

const pickWord = document.getElementById("pickWord");
const pickOptions = document.getElementById("pickOptions");
const pickScoreEl = document.getElementById("pickScore");
const pickNext = document.getElementById("pickNext");
const actionDiceFace = document.getElementById("actionDiceFace");
const actionDiceStart = document.getElementById("actionDiceStart");
const actionDiceRoll = document.getElementById("actionDiceRoll");
const actionDiceNumber = document.getElementById("actionDiceNumber");
const actionDiceTask = document.getElementById("actionDiceTask");
const actionDiceCheck = document.getElementById("actionDiceCheck");
const actionDiceCorrect = document.getElementById("actionDiceCorrect");
const actionDiceWrong = document.getElementById("actionDiceWrong");
const actionDiceStatus = document.getElementById("actionDiceStatus");
const actionDiceScoreEl = document.getElementById("actionDiceScore");
const profilePanel = document.getElementById("profilePanel");
const feedbackOverlay = document.getElementById("feedbackOverlay");
const feedbackBox = document.getElementById("feedbackBox");

let scores = { bamboozle: 0, spell: 0, pick: 0 };
let teamScores = { A: 0, B: 0 };
let teamTurn = "A";
let selectedCard = null;
let bamboozleLocked = false;
let bamboozleTimer = null;
let bamboozleTimeLeft = 0;
let bamboozleStageResetTimer = null;
let spellResultTimer = null;
let spellNextTimer = null;
let pickNextTimer = null;
let feedbackTimer = null;
let actionDiceRollingTimer = null;
let actionDiceScore = 0;
let currentActionDiceTask = "";
let actionDiceStarted = false;

const BamboozleSeconds = 15;
const RESULT_DISPLAY_MS = 3000;
const THEME_KEY = "theme";

const bamboozleCards = [
  { word: "apple", emoji: "??", points: 10 },
  { word: "banana", emoji: "??", points: 10 },
  { word: "cat", emoji: "??", points: 5 },
  { word: "dog", emoji: "??", points: 5 },
  { word: "sun", emoji: "??", points: 8 },
  { word: "moon", emoji: "??", points: 8 },
  { word: "car", emoji: "??", points: 6 },
  { word: "ball", emoji: "?", points: 6 },
  { word: "fish", emoji: "??", points: 7 },
  { word: "bird", emoji: "??", points: 7 },
  { word: "house", emoji: "??", points: 9 },
  { word: "tree", emoji: "??", points: 9 }
];

const spellWords = [
  { word: "apple", emoji: "??" },
  { word: "banana", emoji: "??" },
  { word: "cat", emoji: "??" },
  { word: "dog", emoji: "??" },
  { word: "sun", emoji: "??" },
  { word: "moon", emoji: "??" },
  { word: "car", emoji: "??" },
  { word: "fish", emoji: "??" }
];

const pickWords = [
  { word: "cat", options: ["??", "??", "??", "??"], answer: "??" },
  { word: "sun", options: ["??", "?", "??", "??"], answer: "??" },
  { word: "ball", options: ["?", "??", "??", "??"], answer: "?" },
  { word: "car", options: ["??", "??", "??", "??"], answer: "??" }
];

const actionDiceTaskPools = {
  1: [
    "Jump 5 times",
    "Hop on one leg 6 times",
    "Do 4 star jumps"
  ],
  2: [
    "Clap your hands",
    "Clap 10 times fast",
    "Clap a slow rhythm 2 times"
  ],
  3: [
    "Say 3 colors",
    "Say 3 fruits in English",
    "Say 3 school items"
  ],
  4: [
    "Dance",
    "Do a funny dance for 10 seconds",
    "Dance and spin once"
  ],
  5: [
    "Say 2 animals",
    "Act like 2 animals",
    "Name 2 sea animals"
  ],
  6: [
    "Sing a song",
    "Sing one English line",
    "Hum a song for 8 seconds"
  ]
};

const actionDiceFaces = ["", "?", "?", "?", "?", "?", "?"];

function showAuth() {
  authEl.hidden = false;
  dashboardEl.hidden = true;
  document.body.classList.remove("authed");
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Always show login first; user can open register manually.
  loginForm.hidden = false;
  registerForm.hidden = true;
}

function applyTheme(theme) {
  document.body.classList.remove("theme-light", "theme-dark");
  if (theme === "dark") {
    document.body.classList.add("theme-dark");
  } else if (theme === "light") {
    document.body.classList.add("theme-light");
  }
  if (themeToggle) {
    themeToggle.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
  }
}

function showDashboard() {
  authEl.hidden = true;
  dashboardEl.hidden = false;
  document.body.classList.add("authed");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setProfile() {
  if (!currentUser) return;
  profileEl.innerHTML = `Hello, <strong>${currentUser.display_name}</strong>`;
  renderProfilePanel();
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function tryLoginFromStorage() {
  if (!token) return false;
  try {
    const data = await api("/api/me");
    currentUser = data.user;
    showDashboard();
    setProfile();
    await loadProgress();
    return true;
  } catch {
    token = "";
    localStorage.removeItem("token");
    return false;
  }
}

async function loadProgress() {
  if (!token) return;
  const data = await api("/api/progress");
  const map = {};
  for (const row of data.progress) map[row.game_key] = row;
  scores.bamboozle = map.bamboozle?.score || 0;
  scores.spell = map.spell?.score || 0;
  scores.pick = map.pick?.score || 0;
  bamboozleScoreEl.textContent = scores.bamboozle;
  spellScoreEl.textContent = scores.spell;
  pickScoreEl.textContent = scores.pick;
  renderProgress();
  renderProfilePanel();
}

function renderProgress() {
  progressEl.innerHTML = `
    <div class="progress-card">Bamboozle Words: ${scores.bamboozle} pts</div>
    <div class="progress-card">Spell It: ${scores.spell} pts</div>
    <div class="progress-card">Pick the Picture: ${scores.pick} pts</div>
  `;
}

function renderProfilePanel() {
  if (!profilePanel) return;
  const name = currentUser?.display_name || "Guest";
  const username = currentUser?.username || "-";
  const total = scores.bamboozle + scores.spell + scores.pick;
  profilePanel.innerHTML = `
    <div class="profile-card">
      <div class="profile-title">Name</div>
      <div class="profile-value">${name}</div>
    </div>
    <div class="profile-card">
      <div class="profile-title">Username</div>
      <div class="profile-value">@${username}</div>
    </div>
    <div class="profile-card">
      <div class="profile-title">Total score</div>
      <div class="profile-value">${total} pts</div>
    </div>
    <div class="profile-card">
      <div class="profile-title">Bamboozle Words</div>
      <div class="profile-value">${scores.bamboozle} pts</div>
    </div>
    <div class="profile-card">
      <div class="profile-title">Spell It</div>
      <div class="profile-value">${scores.spell} pts</div>
    </div>
    <div class="profile-card">
      <div class="profile-title">Pick the Picture</div>
      <div class="profile-value">${scores.pick} pts</div>
    </div>
  `;
}

async function logout() {
  try {
    if (token) await api("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore logout audit call errors on client
  }
  token = "";
  localStorage.removeItem("token");
  currentUser = null;
  closeGamePanel();
  showAuth();
}

async function saveProgress(gameKey) {
  await api("/api/progress", {
    method: "POST",
    body: JSON.stringify({ game_key: gameKey, score: scores[gameKey], level: 1 })
  });
  renderProgress();
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  window.speechSynthesis.speak(utter);
}

function setupBamboozle() {
  teamScores = { A: 0, B: 0 };
  teamTurn = "A";
  selectedCard = null;
  bamboozleLocked = false;
  clearBamboozleTimer();
  clearBamboozleStageResetTimer();
  teamAScoreEl.textContent = teamScores.A;
  teamBScoreEl.textContent = teamScores.B;
  teamTurnEl.textContent = teamTurn;
  bamboozleImage.style.display = "none";
  bamboozleImage.src = "";
  bamboozleEmojiFallback.style.display = "block";
  bamboozleEmojiFallback.textContent = "";
  bamboozleEmojiPop.textContent = "";
  bamboozleEmojiPop.classList.remove("show");
  bamboozleAnswer.textContent = "";
  bamboozleResult.textContent = "";
  bamboozleResult.classList.remove("correct", "wrong");
  bamboozleCheck.disabled = false;
  bamboozleCheck.hidden = true;
  bamboozleCorrect.hidden = true;
  bamboozleWrong.hidden = true;
  bamboozleCountdown.textContent = "";
  bamboozleCountdown.classList.remove("warn");
  bamboozleOverlay.hidden = true;

  bamboozleBoard.innerHTML = "";
  const shuffled = [...bamboozleCards].sort(() => Math.random() - 0.5);
  for (const card of shuffled) {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.textContent = "?";
    tile.addEventListener("click", () => {
      if (tile.dataset.opened || bamboozleLocked) return;
      tile.dataset.opened = "1";
      tile.innerHTML = `<div class="emoji">${card.emoji}</div><div class="word">?</div><div class="pts">+${card.points}</div>`;
      selectedCard = card;
      bamboozleLocked = true;
      if (card.image) {
        bamboozleImage.src = card.image;
        bamboozleImage.style.display = "block";
        bamboozleEmojiFallback.style.display = "none";
      } else {
        bamboozleImage.style.display = "none";
        bamboozleImage.src = "";
        bamboozleEmojiFallback.style.display = "block";
        bamboozleEmojiFallback.textContent = card.emoji;
      }
      bamboozleEmojiPop.textContent = card.emoji || "";
      bamboozleEmojiPop.classList.remove("show");
      if (card.emoji) {
        requestAnimationFrame(() => bamboozleEmojiPop.classList.add("show"));
        setTimeout(() => bamboozleEmojiPop.classList.remove("show"), 900);
      }
      bamboozleAnswer.textContent = "";
      bamboozleResult.textContent = "";
      bamboozleResult.classList.remove("correct", "wrong");
      bamboozleCheck.disabled = false;
      bamboozleCheck.hidden = false;
      bamboozleCorrect.hidden = true;
      bamboozleWrong.hidden = true;
      bamboozleCountdown.textContent = "";
      bamboozleCountdown.classList.remove("warn");
      bamboozleOverlay.hidden = false;
      startBamboozleTimer();
    });
    bamboozleBoard.appendChild(tile);
  }
}

function updateTeamUI() {
  teamAScoreEl.textContent = teamScores.A;
  teamBScoreEl.textContent = teamScores.B;
  teamTurnEl.textContent = teamTurn;
}

function resetBamboozleStage(message) {
  selectedCard = null;
  bamboozleLocked = false;
  bamboozleImage.style.display = "none";
  bamboozleImage.src = "";
  bamboozleEmojiFallback.style.display = "block";
  bamboozleEmojiFallback.textContent = message || "";
  bamboozleEmojiPop.textContent = "";
  bamboozleEmojiPop.classList.remove("show");
  bamboozleAnswer.textContent = "";
  bamboozleResult.textContent = "";
  bamboozleResult.classList.remove("correct", "wrong");
  bamboozleCheck.disabled = false;
  bamboozleCheck.hidden = true;
  bamboozleCorrect.hidden = true;
  bamboozleWrong.hidden = true;
  bamboozleCountdown.textContent = "";
  bamboozleCountdown.classList.remove("warn");
  bamboozleOverlay.hidden = true;
}

function clearBamboozleStageResetTimer() {
  if (bamboozleStageResetTimer) {
    clearTimeout(bamboozleStageResetTimer);
    bamboozleStageResetTimer = null;
  }
}

function showBamboozleResult(type, text) {
  bamboozleResult.textContent = text;
  bamboozleResult.classList.remove("correct", "wrong");
  bamboozleResult.classList.add(type);
}

function scheduleBamboozleStageReset(message, delay = RESULT_DISPLAY_MS) {
  clearBamboozleStageResetTimer();
  bamboozleStageResetTimer = setTimeout(() => {
    resetBamboozleStage(message);
    bamboozleStageResetTimer = null;
  }, delay);
}

function showSpellResult(type, text) {
  showCenterFeedback(text, type);
  if (spellResultTimer) {
    clearTimeout(spellResultTimer);
    spellResultTimer = null;
  }
  spellResult.textContent = text;
  spellResult.classList.remove("correct", "wrong");
  spellResult.classList.add(type);
  spellResultTimer = setTimeout(() => {
    spellResult.textContent = "";
    spellResult.classList.remove("correct", "wrong");
    spellResultTimer = null;
  }, RESULT_DISPLAY_MS);
}

function clearCenterFeedback() {
  if (!feedbackOverlay || !feedbackBox) return;
  feedbackOverlay.hidden = true;
  feedbackBox.textContent = "";
  feedbackBox.classList.remove("correct", "wrong");
  feedbackTimer = null;
}

function showCenterFeedback(text, type = "correct") {
  if (!feedbackOverlay || !feedbackBox) return;
  if (feedbackTimer) {
    clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }
  feedbackOverlay.hidden = false;
  feedbackBox.textContent = text;
  feedbackBox.classList.remove("correct", "wrong");
  feedbackBox.classList.add(type);
  feedbackTimer = setTimeout(() => {
    clearCenterFeedback();
    feedbackTimer = null;
  }, RESULT_DISPLAY_MS);
}

function clearBamboozleTimer() {
  if (bamboozleTimer) {
    clearInterval(bamboozleTimer);
    bamboozleTimer = null;
  }
  bamboozleTimeLeft = 0;
}

function startBamboozleTimer() {
  clearBamboozleTimer();
  bamboozleTimeLeft = BamboozleSeconds;
  bamboozleCountdown.textContent = `? ${bamboozleTimeLeft}s`;
  bamboozleCountdown.classList.remove("warn");
  bamboozleTimer = setInterval(() => {
    bamboozleTimeLeft -= 1;
    bamboozleCountdown.textContent = `? ${bamboozleTimeLeft}s`;
    if (bamboozleTimeLeft <= 6) bamboozleCountdown.classList.add("warn");
    if (bamboozleTimeLeft <= 0) {
      clearBamboozleTimer();
      handleBamboozleWrong(true);
    }
  }, 1000);
}

function handleBamboozleWrong(auto = false) {
  if (!selectedCard) return;
  teamScores[teamTurn] = Math.max(0, teamScores[teamTurn] - 5);
  scores.bamboozle = Math.max(0, scores.bamboozle - 5);
  bamboozleScoreEl.textContent = scores.bamboozle;
  updateTeamUI();
  showCenterFeedback("Wrong", "wrong");
  showBamboozleResult("wrong", "Wrong");
  teamTurn = teamTurn === "A" ? "B" : "A";
  updateTeamUI();
  scheduleBamboozleStageReset("Select the next picture");
  saveProgress("bamboozle");
}

function setupSpell() {
  const item = spellWords[Math.floor(Math.random() * spellWords.length)];
  const letters = item.word.split("").sort(() => Math.random() - 0.5);
  if (spellNextTimer) {
    clearTimeout(spellNextTimer);
    spellNextTimer = null;
  }
  if (spellResultTimer) {
    clearTimeout(spellResultTimer);
    spellResultTimer = null;
  }
  spellEmoji.textContent = item.emoji;
  spellAnswer.textContent = "";
  spellResult.textContent = "";
  spellResult.classList.remove("correct", "wrong");
  spellLetters.innerHTML = "";
  for (const l of letters) {
    const btn = document.createElement("button");
    btn.textContent = l;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      spellAnswer.textContent += l;
      if (spellAnswer.textContent.length === item.word.length) {
        if (spellAnswer.textContent === item.word) {
          showSpellResult("correct", "Correct");
          scores.spell += 10;
          spellScoreEl.textContent = scores.spell;
          saveProgress("spell");
        } else {
          showSpellResult("wrong", "Wrong");
        }
        for (const b of spellLetters.querySelectorAll("button")) b.disabled = true;
        spellNextTimer = setTimeout(() => {
          setupSpell();
          spellNextTimer = null;
        }, RESULT_DISPLAY_MS);
      }
    });
    spellLetters.appendChild(btn);
  }

  spellSpeak.onclick = () => speak(item.word);
}

function setupPick() {
  if (pickNextTimer) {
    clearTimeout(pickNextTimer);
    pickNextTimer = null;
  }
  const item = pickWords[Math.floor(Math.random() * pickWords.length)];
  pickWord.textContent = item.word;
  pickOptions.innerHTML = "";
  for (const opt of item.options.sort(() => Math.random() - 0.5)) {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const correct = opt === item.answer;
      if (correct) {
        scores.pick += 8;
        pickScoreEl.textContent = scores.pick;
        saveProgress("pick");
      }
      for (const b of pickOptions.querySelectorAll("button")) b.disabled = true;
      btn.classList.add(correct ? "correct" : "wrong");
      showCenterFeedback(correct ? "Correct" : "Wrong", correct ? "correct" : "wrong");
      pickNextTimer = setTimeout(() => {
        setupPick();
        pickNextTimer = null;
      }, RESULT_DISPLAY_MS);
    });
    pickOptions.appendChild(btn);
  }
}

function setupActionDice() {
  if (!actionDiceFace || !actionDiceNumber || !actionDiceTask) return;
  actionDiceStarted = false;
  actionDiceScore = 0;
  actionDiceFace.textContent = "??";
  actionDiceNumber.textContent = "-";
  actionDiceTask.textContent = "Press Start to begin.";
  currentActionDiceTask = "";
  if (actionDiceStart) {
    actionDiceStart.disabled = false;
    actionDiceStart.textContent = "Start";
  }
  if (actionDiceRoll) actionDiceRoll.disabled = true;
  if (actionDiceCheck) actionDiceCheck.hidden = true;
  if (actionDiceStatus) {
    actionDiceStatus.textContent = "";
    actionDiceStatus.classList.remove("correct", "wrong");
  }
  if (actionDiceScoreEl) actionDiceScoreEl.textContent = String(actionDiceScore);
}

function startActionDiceGame() {
  if (!actionDiceStart || !actionDiceRoll || !actionDiceTask || !actionDiceStatus) return;
  actionDiceStarted = true;
  currentActionDiceTask = "";
  actionDiceNumber.textContent = "-";
  actionDiceTask.textContent = "Game started. Roll the dice.";
  actionDiceStatus.textContent = "";
  actionDiceStatus.classList.remove("correct", "wrong");
  if (actionDiceCheck) actionDiceCheck.hidden = true;
  actionDiceStart.disabled = true;
  actionDiceStart.textContent = "Started";
  actionDiceRoll.disabled = false;
}

function rollActionDice() {
  if (!actionDiceFace || !actionDiceRoll || !actionDiceNumber || !actionDiceTask) return;
  if (!actionDiceStarted || actionDiceRollingTimer) return;

  actionDiceRoll.disabled = true;
  if (actionDiceCheck) actionDiceCheck.hidden = true;
  if (actionDiceStatus) {
    actionDiceStatus.textContent = "";
    actionDiceStatus.classList.remove("correct", "wrong");
  }
  actionDiceTask.textContent = "Rolling... secret challenge is loading";
  actionDiceFace.classList.add("rolling");

  let ticks = 0;
  actionDiceRollingTimer = setInterval(() => {
    const randomFace = 1 + Math.floor(Math.random() * 6);
    actionDiceFace.textContent = actionDiceFaces[randomFace];
    ticks += 1;
    if (ticks >= 9) {
      clearInterval(actionDiceRollingTimer);
      actionDiceRollingTimer = null;
      const roll = 1 + Math.floor(Math.random() * 6);
      const pool = actionDiceTaskPools[roll];
      currentActionDiceTask = pool[Math.floor(Math.random() * pool.length)];
      actionDiceFace.textContent = actionDiceFaces[roll];
      actionDiceFace.classList.remove("rolling");
      actionDiceNumber.textContent = String(roll);
      actionDiceTask.textContent = currentActionDiceTask;
      if (actionDiceCheck) actionDiceCheck.hidden = false;
      actionDiceRoll.disabled = false;
      speak(currentActionDiceTask);
    }
  }, 90);
}

function markActionDiceResult(ok) {
  if (!currentActionDiceTask || !actionDiceStatus) return;
  actionDiceStatus.classList.remove("correct", "wrong");
  if (ok) {
    actionDiceScore += 10;
    actionDiceStatus.textContent = "Correct";
    actionDiceStatus.classList.add("correct");
    showCenterFeedback("Correct", "correct");
  } else {
    actionDiceScore = Math.max(0, actionDiceScore - 5);
    actionDiceStatus.textContent = "Wrong";
    actionDiceStatus.classList.add("wrong");
    showCenterFeedback("Wrong", "wrong");
  }
  if (actionDiceScoreEl) actionDiceScoreEl.textContent = String(actionDiceScore);
  if (actionDiceCheck) actionDiceCheck.hidden = true;
}

function wireGameButtons() {
  document.querySelectorAll(".game-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.game;
      document.querySelectorAll(".game").forEach((g) => {
        g.hidden = true;
        g.classList.remove("active");
      });
      const panel = document.getElementById(`game-${key}`);
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add("active"));
      if (gamePanel) gamePanel.classList.add("active");
      document.body.classList.add("game-open");
      if (key === "action-dice") setupActionDice();
    });
  });
}

function closeGamePanel() {
  document.querySelectorAll(".game").forEach((g) => {
    g.hidden = true;
    g.classList.remove("active");
  });
  if (gamePanel) gamePanel.classList.remove("active");
  document.body.classList.remove("game-open");
}

// Auth handlers

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const res = await api("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
    token = res.token;
    localStorage.setItem("token", token);
    currentUser = res.user;
    showDashboard();
    setProfile();
    await loadProgress();
  } catch (err) {
    alert(err.message);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const res = await api("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
    token = res.token;
    localStorage.setItem("token", token);
    currentUser = res.user;
    showDashboard();
    setProfile();
    await loadProgress();
  } catch (err) {
    alert(err.message);
  }
});

function setupRegisterToggle() {
  if (!showRegisterBtn || !backToLoginBtn || !registerForm) return;
  showRegisterBtn.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;
  });
  backToLoginBtn.addEventListener("click", () => {
    registerForm.hidden = true;
    loginForm.hidden = false;
  });
}

// Game buttons
bamboozleReset.addEventListener("click", setupBamboozle);
spellNext.addEventListener("click", setupSpell);
pickNext.addEventListener("click", setupPick);
if (actionDiceStart) actionDiceStart.addEventListener("click", startActionDiceGame);
if (actionDiceRoll) actionDiceRoll.addEventListener("click", rollActionDice);
if (actionDiceCorrect) actionDiceCorrect.addEventListener("click", () => markActionDiceResult(true));
if (actionDiceWrong) actionDiceWrong.addEventListener("click", () => markActionDiceResult(false));

bamboozleCheck.addEventListener("click", () => {
  if (!selectedCard) {
    showBamboozleResult("wrong", "Open a picture first.");
    return;
  }
  bamboozleAnswer.textContent = `Correct answer: ${selectedCard.word}`;
  bamboozleResult.textContent = "";
  bamboozleResult.classList.remove("correct", "wrong");
  bamboozleCorrect.hidden = false;
  bamboozleWrong.hidden = false;
});

bamboozleCorrect.addEventListener("click", () => {
  if (!selectedCard) return;
  clearBamboozleTimer();
  teamScores[teamTurn] += selectedCard.points;
  scores.bamboozle += selectedCard.points;
  bamboozleScoreEl.textContent = scores.bamboozle;
  updateTeamUI();
  saveProgress("bamboozle");
  showCenterFeedback("Correct", "correct");
  showBamboozleResult("correct", "Correct");
  teamTurn = teamTurn === "A" ? "B" : "A";
  updateTeamUI();
  scheduleBamboozleStageReset("Select the next picture");
});

bamboozleWrong.addEventListener("click", () => {
  clearBamboozleTimer();
  handleBamboozleWrong(false);
});

wireGameButtons();
setupBamboozle();
setupSpell();
setupPick();
setupActionDice();

document.querySelectorAll(".game-close").forEach((btn) => {
  btn.addEventListener("click", closeGamePanel);
});

if (profileBtn) {
  profileBtn.addEventListener("click", () => {
    document.querySelectorAll(".game").forEach((g) => {
      g.hidden = true;
      g.classList.remove("active");
    });
    const panel = document.getElementById("game-profile");
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add("active"));
    if (gamePanel) gamePanel.classList.add("active");
    document.body.classList.add("game-open");
    renderProfilePanel();
  });
}

const logoutBtn = document.getElementById("logout");
if (logoutBtn) logoutBtn.addEventListener("click", () => {
  logout();
});

if (themeToggle) {
  themeToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-btn");
    if (!btn) return;
    const theme = btn.dataset.theme;
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  });
}

setupRegisterToggle();
showAuth();
tryLoginFromStorage();

applyTheme(localStorage.getItem(THEME_KEY) || "light");


