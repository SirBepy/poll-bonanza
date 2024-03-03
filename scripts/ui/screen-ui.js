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

const TEAM_ELEM_ID_PREFIX = "team_";

function initTeamUI() {
  const scoreboard = document.getElementById("scoreboard");
  SETTINGS.teams.options.forEach((option) => {
    const teamColor = option.value;

    const teamElem = addNewElementToElement("div", scoreboard, {
      id: `${TEAM_ELEM_ID_PREFIX}${teamColor}`,
      className: "team_container",
    });
    teamElem.style.backgroundColor = `var(--team-color-${teamColor})`;
    addNewElementToElement("div", teamElem, { className: "players" });
    const scoreElem = addNewElementToElement("div", teamElem, {
      className: "score",
      text: "Score:",
    });
    addNewElementToElement("span", scoreElem);
  });
}

function updateTeamUI() {
  const teamContainers = document
    .getElementById("scoreboard")
    .getElementsByClassName("team_container");
  [...teamContainers].forEach((teamElem) => {
    const teamColor = teamElem.id.replaceAll(TEAM_ELEM_ID_PREFIX, "");
    if (!teams[teamColor]) {
      teamElem.style.display = "none";
      return;
    }
    teamElem.style.display = "flex";
    teamElem.getElementsByClassName("players")[0].innerHTML = teams[teamColor]
      .map((playerId) => `<span>${airConsole.getNickname(playerId)}</span>`)
      .join("");
  });
}

function updatePointsUI() {
  Object.keys(teams).forEach((teamColor) => {
    const pointsElem = document
      .getElementById(`${TEAM_ELEM_ID_PREFIX}${teamColor}`)
      ?.getElementsByClassName("score")?.[0]
      ?.getElementsByTagName("span")?.[0];
    pointsElem.innerText = "" + (points[teamColor] ?? 0);
  });
}

function updateTableRowToggledUI(device_id, buttonId) {
  const rowElem = document.getElementById(buttonId);
  Object.entries(teams).forEach(([teamName, team]) => {
    if (team.includes(device_id)) {
      rowElem.classList.add(`${teamName}-pick`);
    }
  });
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
