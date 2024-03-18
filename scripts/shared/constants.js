const PAGES = {
  lobby: "lobby",
  questions: "questions",
  pairing: "pairing",
  waitForPlayers: "waitForPlayers",
  waitForNextRound: "waitForNextRound",
  allSettings: "allSettings",
  settingsDetail: "settingsDetail",
  endOfGame: "endOfGame",
};

const GAMEMODES = {
  top_3: {
    name: "Pick top 3",
    allowedChoices: 3,
    choicesToPick: [1, 2, 3],
  },
  second_top_3: {
    name: "Pick 2 - 4",
    allowedChoices: 4,
    choicesToPick: [2, 3, 4],
  },
  bottom_to_top: {
    name: "Ordered pick from bottom to top",
    allowedChoices: 5,
    choicesToPick: [8, 7, 6, 5, 4, 3, 2],
    ordered: true,
  },
  top_to_bottom: {
    name: "Ordered pick from top to bottom",
    allowedChoices: 5,
    choicesToPick: [1, 2, 3, 4, 5, 6, 7],
    ordered: true,
  },
  // guess_enemy_list: {
  //   name: "Guess a specific players top 3",
  //   choicesToPick: [1, 2, 3],
  //   allowedChoices: 3,
  //   usesOponentsAnswers: true,
  // },
  who_does_this_belong_to: {
    name: "Guess who the list belongs to",
    allowedChoices: 3,
    specialRule: 'match_to_player',
    usesOponentsAnswers: true,
  },
};

const POSITION_POINTS = {
  1: 21,
  2: 15,
  3: 10,
  4: 7,
  5: 5,
  6: 3,
  7: 2,
  8: 1,
};

const NUM_OF_CHOICES_PER_QUESTION = Object.keys(POSITION_POINTS).length;

const SETTINGS = {
  teams: {
    name: "Teams",
    hintText: "It's most fun to have atleast 4 players per team",
    minNumOfOptionsChosen: 2,
    options: [
      { name: "Red", value: "red" },
      { name: "Blue", value: "blue" },
      { name: "Green", value: "green" },
      { name: "Yellow", value: "yellow" },
    ],
  },
  numOfRounds: {
    name: "Number of rounds",
    options: [
      { name: "2", value: "2" },
      { name: "3", value: "3" },
      { name: "4", value: "4" },
      { name: "5", value: "5" },
      { name: "6", value: "6" },
      { name: "Infinite", value: "9999" },
    ],
    onlyOneIsActive: true,
  },
  categories: {
    name: "Categories",
    options: [],
  },
  gamemodes: {
    name: "Gamemodes",
    options: Object.entries(GAMEMODES).map(([gamemodeKey, gamemode]) => ({
      name: gamemode.name,
      value: gamemodeKey,
    })),
  },
};

const FILES_TO_LOOK_FOR = ["Misc", "Movies and Shows", "Music"];

const DEFAULT_SETTINGS = {
  teams: ["red", "blue"],
  numOfRounds: ["3"],
  categories: FILES_TO_LOOK_FOR,
  gamemodes: Object.keys(GAMEMODES),
};
