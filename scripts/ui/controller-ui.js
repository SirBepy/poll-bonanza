function updateIsActivePlayerClass(player_id) {
  const pairingElem = document.getElementById("pairing");
  if (airConsole.device_id == player_id) {
    pairingElem.className = "isActivePlayer";
  } else {
    pairingElem.className = "";
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
  const { red, blue } = teams;
  const bodyElem = document.getElementsByTagName("body")[0];
  if (red.includes(airConsole.device_id)) {
    bodyElem.classList.add("red_team");
    bodyElem.classList.remove("blue_team");
  } else if (blue.includes(airConsole.device_id)) {
    bodyElem.classList.add("blue_team");
    bodyElem.classList.remove("red_team");
  } else {
    throw new Error("Player wasnt in either team");
  }
}
