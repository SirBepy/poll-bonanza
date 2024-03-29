let airConsole;
let playersWishingToReroll = {};
let activePlayerId;
let unavailableAnswers = [];
let choicesToPickById = [];
let gameSettings;
let points = {};
let currentRound = 0;
let playerToGuessFrom = 0;

let allPlayersAnswers = {};

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
  if (data.goBackHome) onGoBackHome();
}

function onGoBackHome() {
  setNewScreen(PAGES.lobby);
  updatePointsUI();
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
  setCacheSettings(settings);

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
    onNewRound(true);
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

  delete playersWishingToReroll[device_id];
  delete allPlayersAnswers[device_id];
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
  SETTINGS.categories.options = Object.entries(ALL_QUESTIONS_BY_CATEGORY)
    .filter(([_, questions]) => questions.length > 0)
    .map(([category]) => category);

  const savedSettings = getCacheSettings();
  if (savedSettings) {
    gameSettings = savedSettings;
  } else {
    gameSettings = { ...DEFAULT_SETTINGS };
    gameSettings.categories = [...SETTINGS.categories.options];
  }

  assignTeams();
  initTeamUI();
  fillSettingsDataUI();
}

function init() {
  initPrevQuestions();
  setupGameSettings();
  addTextAndButtonsToSection(
    "questions",
    "-",
    [...Array(NUM_OF_CHOICES_PER_QUESTION).keys()].map((i) => ++i)
  );
  setupConsole();
}

// ============================================
// ? Actual game logic
// ============================================
function onAnswersReceived(device_id, answers) {
  allPlayersAnswers[device_id] = answers;
  updatePlayerCounter();
}

function addPointsToTeam() {
  const teamNames = Object.keys(teams);
  const team = teamNames[whoIsActive.lastTeamToGo];
  if (!points[team]) points[team] = 0;
  points[team]++;
  updatePointsUI();
}

function isRoundDone() {
  const pickedAllRightChoices = choicesToPickById.length == 0;
  const pickedAllButRightChoices =
    NUM_OF_CHOICES_PER_QUESTION - unavailableAnswers.length ==
    choicesToPickById.length;
  const onlyOneChoiceRemains =
    NUM_OF_CHOICES_PER_QUESTION - unavailableAnswers.length <= 1;

  return (
    pickedAllRightChoices || pickedAllButRightChoices || onlyOneChoiceRemains
  );
}

let numOfTeamsDidMatchToPlayer = 0;

function onPairReceiveMatchToPlayer(buttonId) {
  const selectedPlayerId = parseInt(buttonId.split("-")[1]);
  const answers = allPlayersAnswers[selectedPlayerId];
  const { playerId, picks } = playerToGuessFrom;

  const wasCorrect =
    selectedPlayerId == playerId ||
    JSON.stringify(answers) === JSON.stringify(picks);

  showWasCorrectAnimation(
    airConsole.getNickname(selectedPlayerId),
    wasCorrect,
  );

  setTimeout(() => {
    if (wasCorrect) {
      addPointsToTeam();
    }
    numOfTeamsDidMatchToPlayer++;
    const isDone = numOfTeamsDidMatchToPlayer >= Object.keys(teams).length;
    if (isDone) {
      airConsole.setCustomDeviceStateProperty("screen", PAGES.waitForNextRound);
    } else {
      assignActivePlayer();
      playerToGuessFrom = getPlayerToGuessFrom();
      initOponentsPicksTableUI();
    }
  }, 250);
}

function onPairReceive(device_id, buttonId) {
  if (device_id != activePlayerId)
    throw new Error("Somehow wrong id tried pairing");
  if (!Object.values(teams).some((team) => team.includes(device_id)))
    throw new Error("Player doesnt have team when pairing");
  const buttonIdNum = parseInt(buttonId.split("-")[1]);

  numberOfTimesAPlayerWent[device_id] =
    (numberOfTimesAPlayerWent[device_id] ?? 0) + 1;

  if (gamemode.specialRule == "match_to_player") {
    onPairReceiveMatchToPlayer(buttonId);
    return;
  }

  const index = choicesToPickById.findIndex((choice) => choice.id == buttonId);
  const choice = currentQuestion.answers[buttonIdNum - 1];

  if (gamemode.ordered) {
    if (index == -1) {
      showWasCorrectAnimation(choice, false);
      assignActivePlayer();
      return;
    }
    const firstMostFreePosition = getFirstOrderedFreePosition();
    const didPickFirstPossibleChoice =
      choicesToPickById[index]?.position == firstMostFreePosition;

    if (!didPickFirstPossibleChoice) {
      showWasCorrectAnimation(choice, false);
      assignActivePlayer();
      return;
    }
  }

  unavailableAnswers.push(buttonId);
  highlightChoices();

  const wasCorrect = index > -1;
  let isDone = false;
  showWasCorrectAnimation(choice, wasCorrect, () => {
    updateTableRowToggledUI(device_id, buttonId);
    if (isDone) updateEndUI(true);
  });
  setTimeout(() => {
    if (wasCorrect) {
      choicesToPickById.splice(index, 1);
      addPointsToTeam();
    }
    isDone = isRoundDone();
    if (isDone) {
      airConsole.setCustomDeviceStateProperty("screen", PAGES.waitForNextRound);
    } else {
      assignActivePlayer();
    }
  }, 250);
}

function getFirstOrderedFreePosition() {
  return gamemode.choicesToPick.find((gamemodePosition) =>
    choicesToPickById.some(({ position }) => position == gamemodePosition)
  );
}

function getPlayerToGuessFrom() {
  const { teamKey, teamPlayers } = getNextTeam();
  const playerToGuessFromId =
    teamPlayers[Math.floor(Math.random() * teamPlayers.length)];

  return {
    team: teamKey,
    playerId: playerToGuessFromId,
    picks: allPlayersAnswers[playerToGuessFromId],
  };
}

function getCalculatedAnswers() {
  const calculatedInObj = {};
  Object.entries(allPlayersAnswers).forEach(([playerId, answers]) => {
    Object.entries(answers).forEach(([position, buttonId]) => {
      if (!calculatedInObj[buttonId])
        calculatedInObj[buttonId] = { points: 0, players: [] };
      calculatedInObj[buttonId].points += POSITION_POINTS[position];
      calculatedInObj[buttonId].players.push({ playerId, position });
    });
  });

  const orderedList = [];
  Object.entries(calculatedInObj).forEach(([buttonId, { points, players }]) => {
    players.sort((a, b) => a.position - b.position);
    orderedList.push({ buttonId, points, players });
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
        players: [],
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

function getAvailableQuestions(alreadyLooped) {
  const questionsFromSelCategories = [];
  Object.entries(ALL_QUESTIONS_BY_CATEGORY).forEach(([category, questions]) => {
    if (gameSettings.categories.includes(category)) {
      questionsFromSelCategories.push(...questions);
    }
  });

  const filteredQuestions = questionsFromSelCategories.filter(
    (question) =>
      !prevDoneQuestions.includes(`${question.category}${question.question}`)
  );

  if (filteredQuestions.length > 0) return filteredQuestions;

  const lastQuestion = prevDoneQuestions[prevDoneQuestions.length - 1];
  clearPrevQuestions();
  addPrevQuestion(lastQuestion);

  if (!alreadyLooped) return getAvailableQuestions(true);
  return questionsFromSelCategories;
}

function getRandomQuestion() {
  const questions = getAvailableQuestions();
  const selectedQuestion =
    questions[Math.floor(Math.random() * questions.length)];
  addPrevQuestion(`${selectedQuestion.category}${selectedQuestion.question}`);
  return selectedQuestion;
}

function getSortedTeamPoints() {
  let position = 1;
  const sortedTeams = Object.entries(points).map(([teamKey, points]) => ({
    teamKey,
    points,
  }));
  sortedTeams.sort((a, b) => b.points - a.points);
  sortedTeams.forEach((team, i) => {
    const previousTeam = sortedTeams[i - 1] ?? { points: 0 };
    if (team.points < previousTeam.points) position++;

    team.position = position;
  });
  return sortedTeams;
}

function onNewRound(isReroll) {
  updateEndUI(false);
  numOfTeamsDidMatchToPlayer = 0;
  choicesToPickById = [];
  allPlayersAnswers = {};
  unavailableAnswers = [];
  playersWishingToReroll = {};
  updateRerollUI();

  if (!isReroll) {
    currentRound++;
    updateRoundUI();
    if (endGame()) return;
  }

  const gamemodeKey = getRandomGamemode();
  gamemode = GAMEMODES[gamemodeKey];
  currentQuestion = getRandomQuestion();
  fillData();

  displayScreen(PAGES.questions);
  updatePlayerCounter();
  airConsole.setCustomDeviceState({
    screen: PAGES.questions,
    currentQuestion,
    gameSettings,
    gamemodeKey,
    teams,
  });
}

function endGame() {
  const shouldEndGame = currentRound > parseInt(gameSettings.numOfRounds?.[0]);
  if (!shouldEndGame) return false;
  const teamPointsSorted = getSortedTeamPoints();
  fillEndOfGameUI(teamPointsSorted);
  airConsole.setCustomDeviceStateProperty("teamPointsSorted", teamPointsSorted);
  setNewScreen(PAGES.endOfGame);

  points = {};
  currentRound = 0;
  return true;
}

function highlightChoices() {
  const { ordered, choicesToPick } = gamemode;
  if (!ordered) return highlightTableUI(choicesToPick);
  highlightTableUI([getFirstOrderedFreePosition()]);
}

function onQuestionsFinished() {
  assignActivePlayer();
  setNewScreen(PAGES.pairing);

  if (gamemode.usesOponentsAnswers) {
    playerToGuessFrom = getPlayerToGuessFrom();
    initOponentsPicksTableUI();
  } else {
    const orderedAnswers = getCalculatedAnswers();
    initBasicPicksTableUI(orderedAnswers);
    highlightChoices();
  }
}

// TODO-GAMEMODE: Add guess_enemy_list gamemode

// TODO-FIX: First player is always master
// TODO-FIX: Sometimes it says "x chose y", but in reality it should be "x chose z"
// TODO-FIX: Show everyone the options

// TODO-FUTURE: Add sounds
// TODO-FUTURE: Add extra points for the first team to pick exactly one position
// TODO-FUTURE: Just like for faking-it, a player should be able to chose the next gamemode
// TODO-FUTURE: Have an option somewhere in the controller screen to always see what answers you chose
