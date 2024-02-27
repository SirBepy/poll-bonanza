let airConsole;
let playersWishingToReroll = {};
let activePlayerId;
let unavailableAnswers = [];
let choicesToPickById = [];
let points = { red: 0, blue: 0 };
const totalNumberOfRounds = 3;
let currentRound = 1;

let allPlayersAnswers = {};
let orderedAnswers = [];

function setNewScreen(newScreen) {
  airConsole.setCustomDeviceStateProperty("screen", newScreen);
  displayScreen(newScreen);
}

function updatePlayerCounter() {
  if (currentScreen != PAGES.questions) return;
  const numOfReadyPlayers = Object.keys(allPlayersAnswers).length;
  const numOfTotalPlayers = airConsole.getControllerDeviceIds().length;
  updatePlayerCounterUI(numOfReadyPlayers, numOfTotalPlayers);

  if (numOfReadyPlayers == numOfTotalPlayers) onQuestionsFinished();
}

function onMessage(device_id, data) {
  if (data.newRound) onNewRound();
  if (data.screen) setNewScreen(data.screen);
  if (data.answers) onAnswersReceived(device_id, data.answers);
  if (data.toggleReroll) toggleReroll(device_id, data.isRerolling);
  if (data.pair) onPairReceive(device_id, data.pair);
}

function toggleReroll(device_id, isWishingToReroll) {
  playersWishingToReroll[device_id] = true;
  if (!isWishingToReroll) delete playersWishingToReroll[device_id];
  updateRerollUI();
  const numOfRerollsRequested = Object.keys(playersWishingToReroll).length;
  const numOfPlayers = airConsole.getControllerDeviceIds().length;

  if (numOfRerollsRequested > numOfPlayers * 0.6) {
    onNewRound();
  }
}

function onConnect(device_id) {
  updatePlayerCounter();
  setNewScreen(currentScreen);
  addPlayerToTeam(device_id);
  airConsole.setCustomDeviceStateProperty("teams", teams);
  updateTeamUI();
}

function onDisconnect(device_id) {
  if (activePlayerId == device_id) assignActivePlayer(true);

  updatePlayerCounter();
  removePlayerFromTeam(device_id);
  airConsole.setCustomDeviceStateProperty("teams", teams);
  updateTeamUI();
}

function setupConsole() {
  airConsole = new AirConsole({ silence_inactive_players: true });

  airConsole.onMessage = onMessage;
  airConsole.onConnect = onConnect;
  airConsole.onDisconnect = onDisconnect;
}

function init() {
  addTextAndButtonsToSection("questions");
  setupConsole();
}

// ============================================
// ? Actual game logic
// ============================================
function onAnswersReceived(device_id, answers) {
  allPlayersAnswers[device_id] = answers;
  updatePlayerCounter();
}

function onPairReceive(device_id, buttonId) {
  if (device_id != activePlayerId)
    throw new Error("Somehow wrong id tried pairing");
  if (!teams.red.includes(device_id) && !teams.blue.includes(device_id))
    throw new Error("Player doesnt have team when pairing");

  numberOfTimesAPlayerWent[device_id] =
    (numberOfTimesAPlayerWent[device_id] ?? 0) + 1;

  const index = choicesToPickById.findIndex((choice) => choice.id == buttonId);

  if (gamemode.ordered) {
    if (index == -1) return assignActivePlayer();
    const firstMostFreePosition = getFirstOrderedFreePosition();
    const didPickFirstPossibleChoice =
      choicesToPickById[index]?.position != firstMostFreePosition;
    if (didPickFirstPossibleChoice) return assignActivePlayer();
  }

  updateTableRowToggledUI(device_id, buttonId);

  numberOfTimesAPlayerWent[device_id] =
    (numberOfTimesAPlayerWent[device_id] ?? 0) + 1;

  unavailableAnswers.push(buttonId);

  if (index > -1) {
    choicesToPickById.splice(index, 1);
    const teamNames = Object.keys(teams);
    const currentTeam = teamNames[whoIsActive.lastTeamToGo];
    points[currentTeam]++;
    updatePointsUI();
  }

  if (
    choicesToPickById.length == 0 ||
    NUM_OF_CHOICES_PER_QUESTION - unavailableAnswers.length <= 1
  ) {
    airConsole.setCustomDeviceStateProperty("screen", PAGES.waitForNextRound);
    updateEndUI(true);
  } else {
    assignActivePlayer();
  }

  highlightChoices()
}

function getFirstOrderedFreePosition() {
  return gamemode.choicesToPick.find((gamemodePosition) =>
    choicesToPickById.some(({ position }) => position == gamemodePosition)
  );
}

function getCalculatedAnswers() {
  const calculatedInObj = {};
  Object.values(allPlayersAnswers).forEach((answers) => {
    Object.entries(answers).forEach(([position, buttonId]) => {
      calculatedInObj[buttonId] =
        (calculatedInObj[buttonId] ?? 0) + POSITION_POINTS[position];
    });
  });
  const orderedList = [];
  Object.entries(calculatedInObj).forEach(([buttonId, points]) => {
    orderedList.push({ buttonId, points });
  });
  orderedList.sort((a, b) => b.points - a.points);
  let currentPosition = 1;
  for (let i = 0; i < orderedList.length; i++) {
    const row = orderedList[i];
    const prevRow = orderedList[i - 1];
    if (prevRow?.points === row.points) {
      row.position = prevRow.position;
    } else {
      row.position = currentPosition++;
    }
  }

  currentQuestion.answers.forEach((_, i) => {
    const buttonId = `answer-${i + 1}`;
    if (!calculatedInObj[buttonId]) {
      orderedList.push({
        points: "0",
        position: NUM_OF_CHOICES_PER_QUESTION,
        buttonId,
      });
    }
  });

  orderedList.forEach((row) => {
    if (gamemode.choicesToPick.includes(row.position)) {
      choicesToPickById.push({
        id: `table${row.buttonId}`,
        position: row.position,
      });
    }
  });

  return orderedList;
}

function getRandomGamemode() {
  const keys = Object.keys(GAMEMODES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return randomKey;
}

function getRandomQuestion() {
  const availableQuestions = [...ALL_QUESTIONS_BY_CATEGORY.Bobo];
  return availableQuestions[
    Math.floor(Math.random() * availableQuestions.length)
  ];
}

function onNewRound(isReroll) {
  updateEndUI(false);
  allPlayersAnswers = {};
  unavailableAnswers = [];
  playersWishingToReroll = {};
  updateRerollUI();
  updatePlayerCounter();

  const gamemodeKey = getRandomGamemode();
  const questionKey = getRandomQuestion();

  gamemode = GAMEMODES[gamemodeKey];
  currentQuestion = ALL_QUESTIONS_BY_ID[questionKey];
  fillData();

  displayScreen(PAGES.questions);
  airConsole.setCustomDeviceState({
    screen: PAGES.questions,
    currentQuestion,
    gamemodeKey,
    teams,
  });
}

function highlightChoices() {
  const { ordered, choicesToPick } = gamemode;
  if (!ordered) return highlightTableUI(choicesToPick);
  highlightTableUI([getFirstOrderedFreePosition()])
}

function onQuestionsFinished() {
  setNewScreen(PAGES.pairing);
  orderedAnswers = getCalculatedAnswers();
  updateTableUI();
  highlightChoices()
  assignActivePlayer();
}

// TODO-SETTINGS: Add screen to chose what gamemodes you dont want
// TODO-SETTINGS: Add categories
// TODO-SETTINGS: Add screen to chose which category you want to see
// TODO-SETTINGS: Add screen to chose how many rounds you will play
// TODO-SETTINGS: Add screen to chose how many teams you want

// TODO-GAMEMODE: Add guess_enemy_list gamemode
// TODO-GAMEMODE: Add who_does_this_belong_to gamemode

// TODO-GENERAL: At the end of the round show what everyone else picked
// TODO-GENERAL: Remove questions that were already used
