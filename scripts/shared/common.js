let currentScreen = PAGES.lobby;
let gamemode = {};
let currentQuestion = {};

function getIsMaster(device_id = airConsole.device_id) {
  return airConsole.getMasterControllerDeviceId() === device_id;
}

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

/**
 *
 * @param {string} elemType h1, h2, div, button...
 * @param {Node} element Element you want to add to
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.text
 * @param {string} props.className
 * @param {Function} props.onClick
 * @returns
 */
function addNewElementToElement(elemType, element, props) {
  const { id, text, className, onClick } = props ?? {};
  const newElement = document.createElement(elemType);
  element.appendChild(newElement);
  if (id) newElement.id = id;
  if (text) newElement.innerText = text;
  if (className) newElement.className = className;
  if (onClick) newElement.onclick = onClick;
  return newElement;
}

function addRowToTable(table, values) {
  const row = addNewElementToElement("tr", table);
  values.forEach((value) => addNewElementToElement("td", row, { text: value }));
}

function addTextAndButtonsToSection(
  sectionId,
  btnIdPrefix,
  options,
  onBtnClick,
  onBottomBtnClick
) {
  const container = document.getElementById(sectionId);
  if (!container) throw new Error("Container element not found!");
  addNewElementToElement("h2", container, {
    text: "This text describes the topic",
    className: "topic",
  });
  addNewElementToElement("p", container, {
    text: "This text describes the gamemode",
    className: "gamemode",
  });

  options.forEach((option) => {
    let id = option;
    if (gamemode.hasToDestructureOption) id = option.id;

    const btnElem = addNewElementToElement("button", container, {
      id: `${btnIdPrefix}-${id}`,
      className: `answer answer-${id}`,
      onClick: function () {
        onBtnClick(this, `${sectionId}-submit`);
      },
    });
    if (gamemode.hasToDestructureOption) {
      btnElem.innerText = option.text;
    }
  });
  if (onBottomBtnClick) {
    addBottomButtonWithCard(container, sectionId, onBottomBtnClick);
  }
}

function fillDataOfAllElementsByClass(className, text, classToRemove) {
  const topicElements = document.getElementsByClassName(className);
  [...topicElements].forEach((element) => {
    element.innerText = text;
    element.classList.remove(classToRemove);
  });
}

function fillData() {
  fillDataOfAllElementsByClass("gamemode", gamemode.name);
  fillDataOfAllElementsByClass("topic", currentQuestion.question);

  for (let i = 1; i <= currentQuestion.answers.length; i++) {
    fillDataOfAllElementsByClass(
      `answer-${i}`,
      currentQuestion.answers[i - 1],
      "toggled"
    );
  }
}

function temporarilyAddClass(elem, cssClass, time = 1000) {
  elem?.classList.add(cssClass);

  setTimeout(() => elem?.classList.remove(cssClass), time);
}

function addBottomButtonWithCard(parentElem, id, onClick) {
  const wrapper = addNewElementToElement("div", parentElem, {
    className: "stick-to-bottom-with-card-bg",
  });
  const bottomBtnId = `${id}-submit`;
  addNewElementToElement("button", wrapper, {
    className: "primary",
    text: "Submit",
    id: bottomBtnId,
    onClick,
  });
  updateSubmitButtonUI(bottomBtnId)
}
