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
const TR_SHOW_VALUE_CLASS = "show-table-value";
const DIV_CLASS_PLAYER_ANSWERS = "player_answers";

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

function getResetedTableUI(addPoints) {
  const tableElement = document
    .getElementById("pairing")
    ?.getElementsByTagName("table")[0];
  if (!tableElement) throw new Error("Table not found in pairing");

  tableElement.innerHTML = `<thead>
      <tr class="header">
        <th class="${TD_CLASS_POSITION}">#</th>
        ${addPoints ? `<th class="${TD_CLASS_POINTS}">Points</th>` : ""}
        <th class="${TD_CLASS_ANSWER}">Answer</th>
      </tr>
    </thead>`;
  return addNewElementToElement("tbody", tableElement);
}

function initOponentsPicksTableUI() {
  const { picks } = playerToGuessFrom;

  const tableElement = getResetedTableUI();

  Object.entries(picks).forEach(([position, buttonId]) => {
    const answerIndex = parseInt(buttonId.split("-")[1]);
    const rowElem = addNewElementToElement("tr", tableElement, {
      className: TR_SHOW_VALUE_CLASS,
    });

    addNewElementToElement("td", rowElem, {
      text: position,
      className: TD_CLASS_POSITION,
    });
    addNewElementToElement("td", rowElem, {
      text: currentQuestion.answers[answerIndex - 1],
      className: TD_CLASS_ANSWER,
    });
  });
}

function initBasicPicksTableUI(orderedAnswers) {
  const tableElement = getResetedTableUI(true);
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
    const answerElem = addNewElementToElement("td", rowElem, {
      text: currentQuestion.answers[answerIndex - 1],
      className: TD_CLASS_ANSWER,
    });

    const imgsWrapperElem = addNewElementToElement("div", answerElem, {
      className: DIV_CLASS_PLAYER_ANSWERS,
    });
    row.players.forEach(({ playerId, position }) => {
      const playerElem = addNewElementToElement("div", imgsWrapperElem);
      addNewElementToElement("span", playerElem, { text: position });
      addNewElementToElement("img", playerElem).src =
        airConsole.getProfilePicture(airConsole.getUID(playerId), 32);
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
      text: "Score: ",
    });
    addNewElementToElement("span", scoreElem, { text: "0" });
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
    teamElem.getElementsByClassName("players")[0].innerHTML =
      generatePlayersHTML(teams[teamColor]);
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
  rowElem.classList.add(TR_SHOW_VALUE_CLASS);
}

function updateActivePlayerUI() {
  const waitingTextElems = document.getElementsByClassName("waiting_text");

  let msg = "";
  if (
    (choicesToPickById?.length > 0 ||
      gamemode.specialRule == "match_to_player") &&
    activePlayerId
  ) {
    const nick = airConsole.getNickname(activePlayerId);
    msg = ` <img src="${airConsole.getProfilePicture(
      airConsole.getUID(activePlayerId),
      48
    )}"/> 
    <div> 
      <span>${activeTeamName} team:</span>
      <span>${nick}</span>
    </div>`;
    [...waitingTextElems].forEach((element) => {
      element.innerHTML = msg;
      element.className = `waiting_text team_${activeTeamName}`;
    });
  } else {
    const nick = airConsole.getNickname(
      airConsole.getMasterControllerDeviceId()
    );
    msg = `Waiting for party leader: ${nick}`;
    [...waitingTextElems].forEach((element) => (element.innerHTML = msg));
  }
}

function fillSettingsDataUI() {
  const tableElement = document.getElementById("settings-table");
  tableElement.innerHTML = "";
  Object.entries(SETTINGS).forEach(([key, setting]) => {
    const { name, options, onlyOneIsActive, canSayAll } = setting;
    if (onlyOneIsActive) {
      addRowToTable(tableElement, [
        name,
        options.find(({ value }) => value == gameSettings?.[key]?.[0])?.name,
      ]);
      return;
    }
    const length = gameSettings[key]?.length;
    if (canSayAll) {
      addRowToTable(tableElement, [
        name,
        length === options.length ? "All" : length,
      ]);
    } else {
      addRowToTable(tableElement, [name, length]);
    }
  });
}

function updateRoundUI() {
  const roundElem = document.getElementById("round_indicator");
  roundElem.innerText = `Round: ${currentRound} / ${gameSettings.numOfRounds?.[0]}`;
}

function fillEndOfGameUI(teamPointsSorted) {
  [
    ...document
      .getElementsByClassName("ranks-wrapper")[0]
      .getElementsByTagName("div"),
  ].forEach((rankPodiumElem, index) => {
    const team = teamPointsSorted[index];
    if (!team) {
      rankPodiumElem.className = "";
      return;
    }
    rankPodiumElem.className = `rankpodium rankpodium-${team.position}`;
    rankPodiumElem.style.backgroundColor = `var(--team-color-${team.teamKey})`;
    rankPodiumElem.getElementsByClassName("team_name")[0].innerText =
      team.teamKey;
    rankPodiumElem.getElementsByClassName("team_points")[0].innerText =
      team.points;
  });
}

function showWasCorrectAnimation(
  optionText,
  wasCorrect,
  callback,
  rightOptionText
) {
  const sectionElem = document.getElementById("is-correct-modal");
  const timeout = 5000;
  temporarilyAddClass(sectionElem, "show", timeout);
  setTimeout(callback, timeout);

  document.getElementById("is-correct-nick").innerText =
    airConsole.getNickname(activePlayerId);
  document.getElementById("is-correct-option").innerText = optionText;
  const isCorrectResultElem = document.getElementById("is-correct-result");
  const whatWasCorrectElem = document.getElementById("what-was-correct");
  if (wasCorrect) {
    isCorrectResultElem.innerText = "Correct!";
    whatWasCorrectElem.innerText = ``;
    isCorrectResultElem.style.color = "var(--color-success)";
  } else {
    isCorrectResultElem.innerText = `Wrong!`;
    if (rightOptionText) {
      whatWasCorrectElem.innerText = `It was ${rightOptionText}`;
    }
    isCorrectResultElem.style.color = "var(--color-fail)";
  }
}
