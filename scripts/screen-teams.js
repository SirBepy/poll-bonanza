const numberOfTimesAPlayerWent = {};
const whoIsActive = { lastTeamToGo: 0, red: 0, blue: 0 };
const teams = {
  red: [],
  blue: [],
};

function assignTeams() {
  const controllerDeviceIds = airConsole.getControllerDeviceIds();
  const numPlayersPerTeam = Math.floor(controllerDeviceIds.length / 2);

  controllerDeviceIds.sort(() => Math.random() - 0.5);

  teams.red = controllerDeviceIds
    .slice(0, numPlayersPerTeam)
    .sort(
      (a, b) =>
        (numberOfTimesAPlayerWent[a] ?? 0) - (numberOfTimesAPlayerWent[b] ?? 0)
    );
  teams.blue = controllerDeviceIds
    .slice(numPlayersPerTeam)
    .sort(
      (a, b) =>
        (numberOfTimesAPlayerWent[a] ?? 0) - (numberOfTimesAPlayerWent[b] ?? 0)
    );
}

function addPlayerToTeam(device_id) {
  if (teams.red.length <= teams.blue.length) {
    teams.red.push(device_id);
  } else if (teams.red.length > teams.blue.length) {
    teams.blue.push(device_id);
  }
}

function removePlayerFromTeam(device_id) {
  if (teams.red.includes(device_id)) {
    teams.red.splice(teams.red.indexOf(device_id), 1);
    if (currentScreen !== PAGES.lobby && teams.red.length == 0) assignTeams();
  } else if (teams.blue.includes(device_id)) {
    teams.blue.splice(teams.blue.indexOf(device_id), 1);
    if (currentScreen !== PAGES.lobby && teams.blue.length == 0) assignTeams();
  }
}

function assignActivePlayer(didPlayerLeave) {
  const teamNames = Object.keys(teams);
  const numOfTeams = teamNames.length;

  if (!didPlayerLeave && ++whoIsActive.lastTeamToGo >= numOfTeams) {
    whoIsActive.lastTeamToGo = 0;
  }
  const currentTeam = teamNames[whoIsActive.lastTeamToGo];
  if (++whoIsActive[currentTeam] >= teams[currentTeam].length) {
    whoIsActive[currentTeam] = 0;
  }

  activePlayerId = teams[currentTeam][whoIsActive[currentTeam]];
  airConsole.message(activePlayerId, { unavailableAnswers });
  airConsole.setCustomDeviceStateProperty("activePlayer", activePlayerId);
  updateActivePlayerUI();
}

function switchTeams(device_id) {
  let teamToAddTo;
  if (teams.red.includes(device_id)) {
    teamToAddTo = teams.blue;
  } else if (teams.blue.includes(device_id)) {
    teamToAddTo = teams.red;
  }
  removePlayerFromTeam(device_id);
  teamToAddTo.push(device_id);
  airConsole.setCustomDeviceStateProperty("teams", teams);
  updateTeamUI();
}
