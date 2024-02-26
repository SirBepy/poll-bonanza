let currentScreen = PAGES.lobby;
let gamemode = {};
let currentQuestion = {};

const displayScreen = (screen) => {
  if (screen == currentScreen) return;
  if (!PAGES[screen]) throw new Error(`Got weird screen: ${screen}`);

  const correctSection = document.getElementById(screen);
  if (!correctSection) throw Error(`Missing section ${screen}`);

  currentScreen = screen;
  const sections = [...document.getElementsByTagName("section")];
  sections.forEach((element) => (element.style.display = "none"));
  correctSection.style.display = "flex";

  const scoreboard = document.getElementById("scoreboard");
  if (scoreboard) {
    scoreboard.className = screen == PAGES.lobby ? "" : "show-scoreboard";
  }
};

function addNewElementToElement(elemType, element, props) {
  const { id, text, className } = props ?? {};
  const newElement = document.createElement(elemType);
  element.appendChild(newElement);
  if (id) newElement.id = id;
  if (text) newElement.innerText = text;
  if (className) newElement.className = className;
  return newElement;
}

function addTextAndButtonsToSection(sectionId, btnIdPrefix, onBtnClick) {
  const container = document.getElementById(sectionId);
  if (!container) throw new Error("Container element not found!");
  addNewElementToElement("p", container, {
    text: "This text describes the topic",
    className: "topic",
  });
  addNewElementToElement("p", container, {
    text: "This text describes the gamemode",
    className: "gamemode",
  });

  for (let i = 1; i <= NUM_OF_CHOICES_PER_QUESTION; i++) {
    const button = addNewElementToElement("button", container, {
      id: `${btnIdPrefix}-${i}`,
    });
    button.className = `answer answer-${i}`;
    button.onclick = onBtnClick;
  }
}

function fillDataOfAllElementsByClass(className, text) {
  const topicElements = document.getElementsByClassName(className);
  [...topicElements].forEach((element) => (element.innerText = text));
}

function fillData() {
  fillDataOfAllElementsByClass("gamemode", gamemode.name);
  fillDataOfAllElementsByClass("topic", currentQuestion.question);

  for (let i = 1; i <= currentQuestion.answers.length; i++) {
    fillDataOfAllElementsByClass(`answer-${i}`, currentQuestion.answers[i - 1]);
  }
}
