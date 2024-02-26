const ALL_QUESTIONS_BY_CATEGORY = {};
const ALL_QUESTIONS_BY_ID = {};

function loadCSV(fileName, category) {
  fetch(fileName)
    .then((response) => response.text())
    .then((csv) => parseCSVData(csv, category))
    .catch((error) => console.error("Error fetching the CSV file:", error));
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function parseCSVData(csv, category) {
  const rows = csv.split("\n");
  const data = [];

  rows.forEach((row) => {
    const columns = parseRow(row);
    data.push(columns);
  });

  const firstRow = data.shift();
  const numOfAnswers = firstRow.answers.filter((colName) =>
    colName.includes("Answer")
  ).length;
  const filteredData = data
    .filter((row) => row.answers.length >= numOfAnswers)
    .map((row) => {
      if (row.answers.length > numOfAnswers) {
        const newAnswers = shuffleArray(row.answers);
        row.answers = newAnswers.slice(0, 8);
      }
      return row;
    });

  filteredData.forEach((row) => (ALL_QUESTIONS_BY_ID[row.question] = row));
  ALL_QUESTIONS_BY_CATEGORY[category] = filteredData.map((row) => row.question);
}

// Normally we wouldnt need such complicated logic here
// But some rows have commas in them
// To combat this, we look for quotes,
// Sections within quotes are one column
function parseRow(row) {
  const columns = [];
  let currentColumn = "";
  let withinQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      withinQuotes = !withinQuotes;
    } else if (char === "," && !withinQuotes) {
      columns.push(currentColumn.trim());
      currentColumn = "";
    } else {
      currentColumn += char;
    }
  }

  // Push the last column
  columns.push(currentColumn.trim());
  const filteredColumns = columns.filter((text) => text.length > 0);
  const question = filteredColumns.shift();
  const toReturn = {
    question,
    answers: filteredColumns,
  };
  return toReturn;
}

loadCSV("data/SplitOpinions - Bobo.csv", "Bobo");

// const data = {
//   "data": [
//     {
//       "category": "Movies",
//       "polls": [
//         {
//           "topic": "Which movie franchise do you think should be revived?",
//           "answers": ["Matrix", "Back to the Future", "Indiana Jones", "Jurassic Park", "The Godfather", "Harry Potter", "Die Hard", "Ghostbusters"]
//         },
//         {
//           "topic": "What's your favorite movie of all time?",
//           "answers": ["The Shawshank Redemption", "The Godfather", "Pulp Fiction", "The Dark Knight", "Schindler's List", "The Lord of the Rings: The Return of the King", "Fight Club", "Forrest Gump"]
//         },
//         {
//           "topic": "Which movie director is the most influential?",
//           "answers": ["Steven Spielberg", "Alfred Hitchcock", "Quentin Tarantino", "Martin Scorsese", "Christopher Nolan", "Stanley Kubrick", "Francis Ford Coppola", "Akira Kurosawa"]
//         }
//       ]
//     },
//     {
//       "category": "Technology",
//       "polls": [
//         {
//           "topic": "Which tech company has the best innovations?",
//           "answers": ["Apple", "Google", "Microsoft", "Amazon", "Tesla", "Facebook", "Samsung", "IBM"]
//         },
//         {
//           "topic": "What's the most important tech trend of the decade?",
//           "answers": ["Artificial Intelligence", "Blockchain", "Internet of Things", "Augmented Reality", "Virtual Reality", "5G", "Quantum Computing", "Biotechnology"]
//         },
//         {
//           "topic": "Which programming language is the most versatile?",
//           "answers": ["Python", "JavaScript", "Java", "C++", "C#", "Ruby", "Go", "Swift"]
//         },
//         {
//           "topic": "What's the best tech gadget of all time?",
//           "answers": ["iPhone", "Nintendo Game Boy", "Sony Walkman", "Amazon Kindle", "Apple iPod", "Tesla Model S", "Fitbit", "DJI Phantom"]
//         },
//         {
//           "topic": "Which tech CEO is the most visionary?",
//           "answers": ["Elon Musk", "Tim Cook", "Jeff Bezos", "Satya Nadella", "Mark Zuckerberg", "Larry Page", "Sundar Pichai", "Jack Ma"]
//         }
//       ]
//     },
//     {
//       "category": "Sports",
//       "polls": [
//         {
//           "topic": "Who is the greatest athlete of all time?",
//           "answers": ["Michael Jordan", "Serena Williams", "Muhammad Ali", "Usain Bolt", "Lionel Messi", "Cristiano Ronaldo", "Roger Federer", "Pelé"]
//         },
//         {
//           "topic": "Which sport is the most exciting to watch?",
//           "answers": ["Football (Soccer)", "American Football", "Basketball", "Tennis", "Cricket", "Baseball", "Ice Hockey", "Golf"]
//         },
//         {
//           "topic": "What's the best sports moment in history?",
//           "answers": ["The Miracle on Ice (1980 Winter Olympics)", "Jesse Owens at the 1936 Berlin Olympics", "The Hand of God (Maradona, 1986 World Cup)", "Rumble in the Jungle (Ali vs. Foreman, 1974)", "The Shot (Michael Jordan, 1989 NBA Playoffs)", "The Catch (Joe Montana, 1982 NFC Championship)", "The Immaculate Reception (Franco Harris, 1972 NFL Playoffs)", "The Fumble (Earnest Byner, 1987 AFC Championship)"]
//         },
//         {
//           "topic": "Which sports league is the most competitive?",
//           "answers": ["English Premier League", "NFL", "NBA", "MLB", "NHL", "La Liga", "Bundesliga", "Serie A"]
//         },
//         {
//           "topic": "Who is the most dominant sports team in history?",
//           "answers": ["The 1990s Chicago Bulls", "Brazil Men's National Football Team (1958-1970)", "New Zealand All Blacks", "Real Madrid (1950s)", "New England Patriots (2000s)", "Golden State Warriors (2010s)", "New York Yankees (1920s)", "Manchester United (1990s-2000s)"]
//         }
//       ]
//     }
//   ]
// }
