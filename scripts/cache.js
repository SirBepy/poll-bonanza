const APP_KEY = "@SplitOpinions";
const CACHE_SETTINGS_KEY = "SETTINGS";
const PREV_DONE_QUESTIONS_KEY = "PREV_DONE_QUESTIONS";
let prevDoneQuestions = [];

function setCacheSettings(settings) {
  const key = `${APP_KEY}${CACHE_SETTINGS_KEY}`;
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {}
}

function getCacheSettings() {
  const key = `${APP_KEY}${CACHE_SETTINGS_KEY}`;
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {}
}

function addPrevQuestion(questionId) {
  prevDoneQuestions.push(questionId);

  const key = `${APP_KEY}${PREV_DONE_QUESTIONS_KEY}`;
  try {
    localStorage.setItem(key, JSON.stringify(prevDoneQuestions));
  } catch (error) {}
}

function clearPrevQuestions() {
  prevDoneQuestions = [];

  const key = `${APP_KEY}${PREV_DONE_QUESTIONS_KEY}`;
  try {
    localStorage.setItem(key, "[]");
  } catch (error) {}
}

function initPrevQuestions() {
  const key = `${APP_KEY}${PREV_DONE_QUESTIONS_KEY}`;
  try {
    prevDoneQuestions = JSON.parse(localStorage.getItem(key)) ?? [];
  } catch (error) {}
}
