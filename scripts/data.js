const ALL_QUESTIONS_BY_CATEGORY = {};

const FILE_LOCATION = "data/";
const FILE_PREFIX = "SplitOpinions - ";

async function loadCSV(category) {
  try {
    const response = await fetch(
      `${FILE_LOCATION}${FILE_PREFIX}${category}.csv`
    );
    const csv = await response.text();
    parseCSVData(csv, category);
  } catch (error) {
    console.error("Error fetching the CSV file:", error);
  }
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

  data.shift(); // remove the first row (column names)
  const filteredData = data
    .filter((row) => row.answers.length >= NUM_OF_CHOICES_PER_QUESTION)
    .map((row) => {
      if (row.answers.length > NUM_OF_CHOICES_PER_QUESTION) {
        const newAnswers = shuffleArray(row.answers);
        row.answers = newAnswers.slice(0, NUM_OF_CHOICES_PER_QUESTION);
      }
      return row;
    });

  ALL_QUESTIONS_BY_CATEGORY[category] = filteredData.map((row) => ({
    ...row,
    category,
  }));
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

const CSV_LOADING_PROGRESS = FILES_TO_LOOK_FOR.map((fileName) => loadCSV(fileName));
