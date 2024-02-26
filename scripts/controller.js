let isRerolling = false;

let airConsole;
let isPaused;

function getIsMaster() {
  return airConsole.getMasterControllerDeviceId() === airConsole.device_id;
}

// Init functionality
function onCustomDeviceStateChange(sender_id, data) {
  if (data.activePlayer) {
    updateIsActivePlayerClass(data.activePlayer);
  }
  if (data.screen == PAGES.questions) {
    updateTeamClass(data.teams)

    if (
      gamemode == GAMEMODES[data.gamemodeKey] &&
      currentQuestion?.question == data.currentQuestion?.question
    )
      return;
    gamemode = GAMEMODES[data.gamemodeKey];
    currentQuestion = data.currentQuestion;

    choices = {};
    resetReroll();
    fillData();
    updateSubmitButtonUI();
  }
  if (data.screen) displayScreen(data.screen);
}

function onMessage(device_id, data) {
  if (data.unavailableAnswers) hideAnswersUI(data.unavailableAnswers);
}

function init() {
  addTextAndButtonsToSection("questions", "answer", function () {
    toggleAnswer(this);
  });
  addTextAndButtonsToSection("pairing", "tableanswer", function () {
    onPair(this);
  });
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
  for (let i = 1; i <= 8; i++) {
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
