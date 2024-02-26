const PAGES = {
  lobby: "lobby",
  questions: "questions",
  pairing: "pairing",
  waitForPlayers: "waitForPlayers",
  waitForNextRound: "waitForNextRound",
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
  // bottom_to_top: {
  //   name: "Pick all, ordered from bottom to top",
  //   allowedChoices: 5,
  //   choicesToPick: [8, 7, 6, 5, 4, 3, 2],
  //   ordered: true,
  // },
  top_to_bottom: {
    name: "Pick all, ordered from top to bottom",
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
  // who_does_this_belong_to: {
  //   name: "Guess who the list belongs to",
  //   allowedChoices: 3,
  //   specialRule: 'match_to_player',
  //   usesOponentsAnswers: true,
  // },
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

const NUM_OF_CHOICES_PER_QUESTION = Object.keys(POSITION_POINTS).length