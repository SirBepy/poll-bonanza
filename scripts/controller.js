let isRerolling = false;

let teamName;
let airConsole;
let isPaused;

// Init functionality
function onCustomDeviceStateChange(sender_id, data) {
  if (data.activePlayer) updateIsActivePlayerClass(data.activePlayer);
  if (data.teams) onTeamUpdate(data.teams);
  if (data.teamPointsSorted) updateYouWinLoseTextUI(data.teamPointsSorted);
  if (data.screen) onNewScreen(data.screen);
  if (data.unavailableAnswers) {
    updateSubmitButtonUI("pairing-normal-submit");
    hideAnswersUI(data.unavailableAnswers);
  }
  if (data.playersToPick) showPlayersToPick(data.playersToPick);

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
  updateSubmitButtonUI("questions-submit");
}

function onTeamUpdate(teams) {
  SETTINGS.teams.options.forEach(({ value: teamName }) => {
    if (teams[teamName]?.includes(airConsole.device_id)) currentTeam = teamName;
  });
  updateTeamClass(teams);
  checkIfTeamsAreSafe(teams);
  disableUnusedTeams(teams);
}

function onNewScreen(screen) {
  const newScreenIsSettings = [
    PAGES.allSettings,
    PAGES.settingsDetail,
  ].includes(currentScreen);

  const isWaitingForPlayers = currentScreen == PAGES.waitForPlayers;
  const isBringingBackToQuestions = isWaitingForPlayers
    ? screen == PAGES.questions
    : false;

  if ((!newScreenIsSettings || !getIsMaster()) && !isBringingBackToQuestions) {
    displayScreen(screen);
  }
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
    toggleChoiceAnswer,
    onPair
  );
  fillDataOfAllElementsByClass("gamemode", gamemode.name);
  fillDataOfAllElementsByClass("topic", currentQuestion.question);
}

function initUI() {
  const btnIds = [...Array(NUM_OF_CHOICES_PER_QUESTION).keys()].map((i) => ++i);
  addTextAndButtonsToSection(
    "questions",
    "answer",
    btnIds,
    toggleQuestionAnswer,
    onSubmitQuestions
  );
  addTextAndButtonsToSection(
    "pairing-normal",
    "tableanswer",
    btnIds,
    toggleChoiceAnswer,
    onPair
  );
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

function toggleChoiceAnswer(button, id) {
  if (button.classList.contains("toggled")) {
    button.classList.remove("toggled");
    delete choices.choice;
  } else {
    button.classList.add("toggled");
    if (choices.choice) {
      document.getElementById(choices.choice).classList.remove("toggled");
    }
    choices.choice = button.id;
  }

  updateSubmitButtonUI(id, 1);
}

function toggleQuestionAnswer(button) {
  if (button.classList.contains("toggled")) {
    button.classList.remove("toggled");
    const span = button.querySelector("span");
    if (span) button.removeChild(span);
    const number = parseInt(span.textContent);
    delete choices[number];
  } else {
    if (Object.keys(choices).length < gamemode.allowedChoices) {
      const availableNumber = getAvailableNumber();
      if (availableNumber !== null) {
        button.classList.add("toggled");
        addNewElementToElement("span", button, { text: availableNumber });
        choices[availableNumber] = button.id;
      }
    }
  }

  updateSubmitButtonUI("questions-submit");
}

function onPair(button) {
  sendScreenEvent({ pair: choices.choice });
  choices = {};
}

function getAvailableNumber() {
  for (let i = 1; i <= NUM_OF_CHOICES_PER_QUESTION; i++) {
    if (!choices[i]) return i;
  }
}

function onSubmitQuestions() {
  displayScreen(PAGES.waitForPlayers);
  sendScreenEvent({ answers: choices });
  choices = {};
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
