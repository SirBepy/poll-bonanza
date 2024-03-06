let airConsole;
let playersWishingToReroll = {};
let activePlayerId;
let unavailableAnswers = [];
let choicesToPickById = [];
let gameSettings;
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
  if (data.switchTeams) switchTeams(device_id, data.switchTeams);
  if (data.screen) setNewScreen(data.screen);
  if (data.answers) onAnswersReceived(device_id, data.answers);
  if (data.toggleReroll) toggleReroll(device_id, data.isRerolling);
  if (data.pair) onPairReceive(device_id, data.pair);
  if (data.gameSettings) onNewSettings(device_id, data.gameSettings);
  if (data.getGameSettings) sendBackGameSettings(device_id);
}

function sendBackGameSettings(device_id) {
  const categories = Object.entries(ALL_QUESTIONS_BY_CATEGORY)
    .filter(([_, questions]) => questions.length > 0)
    .map(([category, questions]) => ({
      name: category,
      value: category,
      hint: `${questions.length} questions`,
    }));
  airConsole.message(device_id, { categories, gameSettings });
}

function onNewSettings(device_id, settings) {
  if (!getIsMaster(device_id)) return;
  gameSettings = settings;
  updateTeamsFromSettings();
  fillSettingsDataUI();
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

async function setupGameSettings() {
  await Promise.all(CSV_LOADING_PROGRESS);
  gameSettings = DEFAULT_SETTINGS;
  gameSettings.categories = Object.entries(ALL_QUESTIONS_BY_CATEGORY)
    .filter(([_, questions]) => questions.length > 0)
    .map(([category]) => category);
  SETTINGS.categories.options = gameSettings.categories;

  fillSettingsDataUI();
}

function init() {
  initTeamUI();
  setupGameSettings();
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
  if (!Object.values(teams).some((team) => team.includes(device_id)))
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

  highlightChoices();
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
  const keys = Object.keys(GAMEMODES).filter((gamemode) =>
    gameSettings.gamemodes.some((option) => option == gamemode)
  );
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return randomKey;
}

function getRandomQuestion() {
  const availableQuestions = [];
  Object.entries(ALL_QUESTIONS_BY_CATEGORY).forEach(([category, questions]) => {
    if (gameSettings.categories.includes(category)) {
      availableQuestions.push(...questions);
    }
  });
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
  gamemode = GAMEMODES[gamemodeKey];
  currentQuestion = getRandomQuestion();
  fillData();

  displayScreen(PAGES.questions);
  airConsole.setCustomDeviceState({
    screen: PAGES.questions,
    currentQuestion,
    gameSettings,
    gamemodeKey,
    teams,
  });
}

function highlightChoices() {
  const { ordered, choicesToPick } = gamemode;
  if (!ordered) return highlightTableUI(choicesToPick);
  highlightTableUI([getFirstOrderedFreePosition()]);
}

function onQuestionsFinished() {
  setNewScreen(PAGES.pairing);
  orderedAnswers = getCalculatedAnswers();
  updateTableUI();
  highlightChoices();
  assignActivePlayer();
}

// TODO-SETTINGS: Make settings persist
// TODO-SETTINGS: Make settings influence numOfRounds properly

// TODO-GAMEMODE: Add guess_enemy_list gamemode
// TODO-GAMEMODE: Add who_does_this_belong_to gamemode

// TODO-GENERAL: At the end of the round show what everyone else picked
// TODO-GENERAL: Remove questions that were already used
