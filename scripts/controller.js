let isRerolling = false;

let airConsole;
let isPaused;

// Init functionality
function onCustomDeviceStateChange(sender_id, data) {
  if (data.activePlayer) updateIsActivePlayerClass(data.activePlayer);
  if (data.teams) {
    updateTeamClass(data.teams);
    checkIfTeamsAreSafe(data.teams);
    disableUnusedTeams(data.teams);
  }
  if (data.screen) {
    const newScreenIsSettings = [
      PAGES.allSettings,
      PAGES.settingsDetail,
    ].includes(currentScreen);

    const isWaitingForPlayers = currentScreen == PAGES.waitForPlayers;
    const isBringingBackToQuestions = isWaitingForPlayers
      ? data.screen == PAGES.questions
      : false;

    if (
      (!newScreenIsSettings || !getIsMaster()) &&
      !isBringingBackToQuestions
    ) {
      displayScreen(data.screen);
    }
  }

  if (
    !data.gamemodeKey ||
    !data.currentQuestion?.question ||
    (gamemode.key == data.gamemodeKey &&
      currentQuestion?.question == data.currentQuestion.question)
  )
    return;
  gamemode = GAMEMODES[data.gamemodeKey];
  updateGamemodeClass();
  currentQuestion = data.currentQuestion;

  choices = {};
  resetReroll();
  fillData();
  updateSubmitButtonUI();
}

function checkIfTeamsAreSafe(teams) {
  const oneTeamIsEmpty = Object.values(teams).some((team) => team.length == 0);
  const startBtnElem = document.getElementById("start-button");
  if (oneTeamIsEmpty) {
    startBtnElem.disabled = true;
    startBtnElem.innerText = "All teams need atleast 1 player";
  } else {
    startBtnElem.disabled = false;
    startBtnElem.innerText = "Play";
  }
}

function onMessage(device_id, data) {
  if (data.unavailableAnswers) hideAnswersUI(data.unavailableAnswers);
  if (data.playersToPick) showPlayersToPick(data.playersToPick);
  if (data.gameSettings) gameSettings = data.gameSettings;
  if (data.categories) SETTINGS.categories.options = data.categories;
}

function showPlayersToPick(playersToPick) {
  const pairingPlayersElem = document.getElementById("pairing-players");
  pairingPlayersElem.innerHTML = "";
  addTextAndButtonsToSection(
    "pairing-players",
    "playersanswer",
    playersToPick,
    onPair
  );
}

function initUI() {
  const btnIds = [...Array(NUM_OF_CHOICES_PER_QUESTION).keys()].map((i) => ++i);
  addTextAndButtonsToSection("questions", "answer", btnIds, toggleAnswer);
  addTextAndButtonsToSection("pairing-normal", "tableanswer", btnIds, onPair);
  fillAllSettingsUI();
  initTeamsTogglerUI();
}

function init() {
  initUI();
  airConsole = new AirConsole({ orientation: "portrait" });

  airConsole.onActivePlayersChange = updateIsActivePlayerClass;
  airConsole.onConnect = updateIsMasterClass;
  airConsole.onDisconnect = updateIsMasterClass;
  airConsole.onCustomDeviceStateChange = onCustomDeviceStateChange;
  airConsole.onMessage = onMessage;
}

function sendScreenEvent(body) {
  airConsole.message(AirConsole.SCREEN, body);
}

function startGame() {
  sendScreenEvent({ newRound: true });
}

// ============================================
// ? Actual game logic
// ============================================

let choices = {};

function toggleAnswer(button) {
  const span = button.querySelector("span");

  if (span) {
    button.removeChild(span);
    const number = parseInt(span.textContent);
    delete choices[number];
  } else {
    if (Object.keys(choices).length < gamemode.allowedChoices) {
      const availableNumber = getAvailableNumber();
      if (availableNumber !== null) {
        addNewElementToElement("span", button, { text: availableNumber });
        choices[availableNumber] = button.id;
      }
    }
  }

  updateSubmitButtonUI();
}

function onPair(button) {
  sendScreenEvent({ pair: button.id });
}

function getAvailableNumber() {
  for (let i = 1; i <= NUM_OF_CHOICES_PER_QUESTION; i++) {
    if (!choices[i]) return i;
  }
}

function onSubmit() {
  displayScreen(PAGES.waitForPlayers);
  sendScreenEvent({ answers: choices });
}

function resetReroll() {
  isRerolling = false;
  toggleRerollActiveClass(isRerolling);
}

function toggleRerollQuestion() {
  isRerolling = !isRerolling;
  sendScreenEvent({ toggleReroll: true, isRerolling: isRerolling });
  toggleRerollActiveClass(isRerolling);
}

function nextRound() {
  sendScreenEvent({ newRound: true });
}

function switchTeams(teamName) {
  sendScreenEvent({ switchTeams: teamName });
}

function goBackHome() {
  sendScreenEvent({ goBackHome: true });
}
