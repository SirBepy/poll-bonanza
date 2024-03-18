const numberOfTimesAPlayerWent = {};
const teams = {};
let whoIsActive = { lastTeamToGo: 0 };

function assignTeams() {
  whoIsActive = { lastTeamToGo: 0 };
  const numOfTeams = gameSettings.teams.length;

  const controllerDeviceIds = airConsole.getControllerDeviceIds();
  const numPlayersPerTeam = controllerDeviceIds.length / numOfTeams;

  controllerDeviceIds.sort(() => Math.random() - 0.5);

  gameSettings.teams.forEach((teamName, i) => {
    teams[teamName] = controllerDeviceIds
      .slice(i * numPlayersPerTeam, (i + 1) * numPlayersPerTeam)
      .sort(
        (a, b) =>
          (numberOfTimesAPlayerWent[a] ?? 0) -
          (numberOfTimesAPlayerWent[b] ?? 0)
      );
    whoIsActive[teamName] = 0;
  });
}

function addPlayerToTeam(device_id) {
  let smallestTeam;

  Object.values(teams).forEach((team) => {
    if (!smallestTeam || team.length < smallestTeam.length) smallestTeam = team;
  });
  smallestTeam?.push(device_id);
}

function removePlayerFromTeam(device_id) {
  Object.values(teams).forEach((team) => {
    if (team.includes(device_id)) {
      team.splice(team.indexOf(device_id), 1);
      if (currentScreen !== PAGES.lobby && team.length == 0) assignTeams();
    }
  });
}

function getNextTeam() {
  let ttgfIndex = whoIsActive.lastTeamToGo + 1;
  const teamsArray = Object.entries(teams);
  if (ttgfIndex >= teamsArray.length) ttgfIndex = 0;

  const [teamKey, teamPlayers] = teamsArray[ttgfIndex];
  return { teamKey, teamPlayers };
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
  if (gamemode.specialRule == 'match_to_player') {
    airConsole.message(activePlayerId, { playersToPick: getNextTeam() });
  } else {
    airConsole.message(activePlayerId, { unavailableAnswers });
  }
  airConsole.setCustomDeviceStateProperty("activePlayer", activePlayerId);
  updateActivePlayerUI();
}

function switchTeams(device_id, teamName) {
  if (!teams[teamName]) return;
  removePlayerFromTeam(device_id);
  teams[teamName].push(device_id);
  airConsole.setCustomDeviceStateProperty("teams", teams);
  updateTeamUI();
}

function deleteNoLongerUsedTeams() {
  let changeHappened = false;

  Object.keys(teams).forEach((teamName) => {
    if (!gameSettings.teams.includes(teamName)) {
      delete teams[teamName];
      changeHappened = true;
    }
  });
  return changeHappened;
}

function addNewTeams() {
  let changeHappened = false;
  const currentTeamNames = Object.keys(teams);

  gameSettings.teams.forEach((teamName) => {
    if (!currentTeamNames.includes(teamName)) {
      teams[teamName] = [];
      changeHappened = true;
    }
  });
  return changeHappened;
}

function updateTeamsFromSettings() {
  const deletedATeam = deleteNoLongerUsedTeams();
  const newTeamWasAdded = addNewTeams();
  if (deletedATeam || newTeamWasAdded) {
    assignTeams();
    updateTeamUI();
    airConsole.setCustomDeviceStateProperty("teams", teams);
  }
}
