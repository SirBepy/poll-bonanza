// ? UI functionality
function updateRerollUI() {
  const numOfRerollPlayersElem = document.getElementById("numOfRerollPlayers");
  const num = Object.keys(playersWishingToReroll).length;

  if (num > 0) {
    numOfRerollPlayersElem.innerText = num;
    numOfRerollPlayersElem.parentElement.style.opacity = 1;
  } else {
    numOfRerollPlayersElem.parentElement.style.opacity = 0;
  }
}

function updatePlayerCounterUI(numOfReadyPlayers, numOfTotalPlayers) {
  const numOfReadyPlayersElem = document.getElementById("numOfReadyPlayers");
  const numOfTotalPlayersElems =
    document.getElementsByClassName("numOfTotalPlayers");

  numOfReadyPlayersElem.innerText = numOfReadyPlayers;
  [...numOfTotalPlayersElems].forEach(
    (elem) => (elem.innerText = numOfTotalPlayers)
  );
}

const TD_CLASS_POSITION = "col_rank";
const TD_CLASS_POINTS = "col_points";
const TD_CLASS_ANSWER = "col_answer";

function highlightTableUI(choices) {
  const tableElement = document
    .getElementById("pairing")
    ?.getElementsByTagName("table")[0];

  const rows = tableElement.getElementsByTagName("tr");
  [...rows].forEach((rowElem) => {
    const rowPosition =
      rowElem.getElementsByClassName(TD_CLASS_POSITION)?.[0]?.innerText;
    if (!rowPosition) return;

    if (choices.includes(parseInt(rowPosition))) {
      rowElem.classList.add("highlight");
    }
  });
}

function updateTableUI() {
  const tableElement = document
    .getElementById("pairing")
    ?.getElementsByTagName("table")[0];
  if (!tableElement) throw new Error("Table not found in pairing");
  const tableHeader = tableElement.getElementsByClassName("header")?.[0];

  // Clear previous pairing
  tableElement.innerHTML = "";
  tableElement.appendChild(tableHeader);
  orderedAnswers.forEach((row) => {
    const answerIndex = parseInt(row.buttonId.split("-")[1]);

    const rowElem = addNewElementToElement("tr", tableElement, {
      id: `tableanswer-${answerIndex}`,
    });

    addNewElementToElement("td", rowElem, {
      text: row.position,
      className: TD_CLASS_POSITION,
    });
    addNewElementToElement("td", rowElem, {
      text: row.points,
      className: TD_CLASS_POINTS,
    });
    addNewElementToElement("td", rowElem, {
      text: currentQuestion.answers[answerIndex - 1],
      className: TD_CLASS_ANSWER,
    });
  });
}

function updateEndUI(isDone) {
  const pairingSectionElem = document.getElementById("pairing");
  pairingSectionElem.className = isDone ? "show-end" : "";
}

function updateTeamUI() {
  const redPlayersElem = document
    .getElementById("red_team")
    .getElementsByClassName("players")[0];
  const bluePlayersElem = document
    .getElementById("blue_team")
    .getElementsByClassName("players")[0];

  redPlayersElem.innerHTML = teams.red
    .map((playerId) => `<span>${airConsole.getNickname(playerId)}</span>`)
    .join("");

  bluePlayersElem.innerHTML = teams.blue
    .map((playerId) => `<span>${airConsole.getNickname(playerId)}</span>`)
    .join("");
}

function updatePointsUI() {
  document.getElementById("red_team_score").innerText = "" + points.red;
  document.getElementById("blue_team_score").innerText = "" + points.blue;
}

function updateTableRowToggledUI(device_id, buttonId) {
  const rowElem = document.getElementById(buttonId);
  if (teams.red.includes(device_id)) {
    rowElem.classList.add("red-pick");
  } else if (teams.blue.includes(device_id)) {
    rowElem.classList.add("blue-pick");
  }
  rowElem.classList.add("show-table-value");
}

function updateActivePlayerUI() {
  const waitingTextElems = document.getElementsByClassName("waiting_text");

  let nick = "";
  if (choicesToPickById?.length > 0 && activePlayerId) {
    nick = airConsole.getNickname(activePlayerId);
  } else {
    nick = airConsole.getNickname(airConsole.getMasterControllerDeviceId());
  }
  [...waitingTextElems].forEach(
    (element) => (element.innerText = `Waiting for ${nick}`)
  );
}

function fillSettingsDataUI() {
  const tableElement = document.getElementById("settings-table");
  const { teams, numOfRounds, categories, gamemodes } = SETTINGS;
  tableElement.innerHTML = "";
  addRowToTable(tableElement, [teams.name, gameSettings.teams?.length]);
  addRowToTable(tableElement, [
    numOfRounds.name,
    numOfRounds.options.find(
      ({ value }) => value == gameSettings.numOfRounds?.[0]
    )?.name,
  ]);

  const categoriesNum = gameSettings.categories?.length;
  addRowToTable(tableElement, [
    categories.name,
    categoriesNum === categories.options.length ? "All" : categoriesNum,
  ]);

  const gamemodesNum = gameSettings.gamemodes?.length;
  addRowToTable(tableElement, [
    gamemodes.name,
    gamemodesNum === gamemodes.options.length ? "All" : gamemodesNum,
  ]);
}
