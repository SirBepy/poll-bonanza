function updateIsActivePlayerClass(player_id) {
  const pairingElem = document.getElementById("pairing");

  if (airConsole.device_id == player_id) {
    if (currentScreen != PAGES.waitForPlayers) {
      temporarilyAddClass(pairingElem, "isShowingResult", 7000);
    }
    pairingElem.classList.add("isActivePlayer");
  } else {
    pairingElem.classList.remove("isActivePlayer");
  }
}

function updateIsMasterClass() {
  const bodyElem = document.getElementsByTagName("body")[0];
  if (getIsMaster()) {
    bodyElem.classList.add("isMaster");
    bodyElem.classList.remove("isNotMaster");
  } else {
    bodyElem.classList.add("isNotMaster");
    bodyElem.classList.remove("isMaster");
  }
}

function updateSubmitButtonUI() {
  const submitButton = document.getElementById("submit-answers");
  if (Object.keys(choices).length == gamemode.allowedChoices) {
    submitButton.disabled = false;
    submitButton.innerText = "Submit";
  } else {
    submitButton.disabled = true;
    submitButton.innerText = `${
      gamemode?.allowedChoices - Object.keys(choices).length
    } Choices left to pick`;
  }
}

function toggleRerollActiveClass(isRerolling) {
  document.getElementById("reroll").className = isRerolling ? "toggled" : "";
}

function hideAnswersUI(unavailableAnswers) {
  const hideButtonClass = "hide-pair-button";
  const hiddenButtons = document.getElementsByClassName(hideButtonClass);

  [...hiddenButtons].forEach((btn) => btn.classList.remove(hideButtonClass));

  unavailableAnswers.forEach((buttonId) =>
    document.getElementById(buttonId).classList.add(hideButtonClass)
  );
}

function updateTeamClass(teams) {
  const bodyElem = document.getElementsByTagName("body")[0];
  SETTINGS.teams.options.forEach(({ value: teamName }) => {
    const team = teams[teamName] ?? [];
    if (team.includes(airConsole.device_id)) {
      bodyElem.classList.add(`team_${teamName}`);
    } else {
      bodyElem.classList.remove(`team_${teamName}`);
    }
  });
}

function fillAllSettingsUI() {
  const allSettingsElem = document.getElementById("allSettings");
  allSettingsElem.innerHTML = "";
  addNewElementToElement("h1", allSettingsElem, { text: "Types of settings" });
  Object.entries(SETTINGS).forEach(([key, setting]) => {
    addNewElementToElement("button", allSettingsElem, {
      text: setting.name,
      onClick: () => openSettingDetail({ ...setting, key }),
    });
  });
  addNewElementToElement("button", allSettingsElem, {
    text: "Done",
    className: "stick-to-bottom primary",
    onClick: () => goHome(),
  });
}

const settingBtnIdPrefix = "settingdetail-";
function fillSettingDetailUI(setting, listOfToggled) {
  const bottomBtnsElem = document.getElementsByClassName(
    "stick-to-bottom-with-card-bg"
  )?.[0];

  const settingDetailElem = document.getElementById("settingsDetail");
  settingDetailElem.innerHTML = "";
  addNewElementToElement("h1", settingDetailElem, { text: setting.name });
  settingDetailElem.appendChild(bottomBtnsElem);
  setting.options.forEach((option) => {
    const button = addNewElementToElement("button", settingDetailElem, {
      text: option.name,
      className: listOfToggled?.includes(option.value) ? "toggled" : "",
      id: `${settingBtnIdPrefix}${option.value}`,
      onClick: () => onToggleSetting(option.value),
    });
    if (option.hint) {
      addNewElementToElement("span", button, {
        text: option.hint,
        className: "hint",
      });
    }
  });
}

function updateSettingDetailUI() {
  const settingDetailElem = document.getElementById("settingsDetail");
  const toggledBtns = settingDetailElem.getElementsByClassName("toggled");
  [...toggledBtns].forEach((btnElem) => {
    const answerIndex = btnElem.id.replaceAll(settingBtnIdPrefix, "");
    if (!temporarySettings.values[answerIndex]) {
      btnElem.classList.remove("toggled");
    }
  });
  temporarySettings.values.forEach((value) => {
    document
      .getElementById(`${settingBtnIdPrefix}${value}`)
      ?.classList.add("toggled");
  });

  const saveBtnElem = document.getElementById("settingsDetail-save");
  const { minNumOfOptionsChosen } = SETTINGS[temporarySettings?.key] ?? {};
  if (
    minNumOfOptionsChosen &&
    temporarySettings.values.length < minNumOfOptionsChosen
  ) {
    saveBtnElem.disabled = true;
    saveBtnElem.innerText = `Must select atleast ${minNumOfOptionsChosen} options`;
  } else if (temporarySettings.values.length == 0) {
    saveBtnElem.disabled = true;
    saveBtnElem.innerText = "No option was selected";
  } else {
    saveBtnElem.disabled = false;
    saveBtnElem.innerText = "Save";
  }
}

const TEAM_TOGGLE_BTN_ID_PREFIX = "team-toggle-button-";
function initTeamsTogglerUI() {
  const teamsTogglerElem = document.getElementById("teams-toggler");
  SETTINGS.teams.options.forEach((color) => {
    addNewElementToElement("button", teamsTogglerElem, {
      id: `${TEAM_TOGGLE_BTN_ID_PREFIX}${color.value}`,
      onClick: () => switchTeams(color.value),
      text: color.name,
    });
  });
}

function disableUnusedTeams(teams) {
  SETTINGS.teams.options.forEach((color) => {
    const btnElem = document.getElementById(
      `${TEAM_TOGGLE_BTN_ID_PREFIX}${color.value}`
    );

    btnElem.disabled = !teams[color.value];
  });
}

function updateGamemodeClass() {
  const pairingSectionElem = document.getElementById("pairing");
  if (gamemode.specialRule == "match_to_player") {
    pairingSectionElem.classList.add("match_to_player");
  } else {
    pairingSectionElem.classList.remove("match_to_player");
  }
}

function updateYouWinLoseTextUI(teamPointsSorted) {
  const playersTeamPoints = teamPointsSorted.find(
    (team) => team.teamKey === currentTeam
  );
  const didWin = playersTeamPoints.position == 1;
  const textElem = document
    .getElementById("endOfGame")
    .getElementsByTagName("h1")?.[0];

  if (!textElem) return console.error("Couldnt find h1 elem");

  textElem.innerText = `You ${didWin ? "win" : "lose"}!`;
}
