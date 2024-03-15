const APP_KEY = "@SplitOpinions";
const CACHE_SETTINGS_KEY = "SETTINGS";

function setCacheSettings(settings) {
  try {
    localStorage.setItem(
      `${APP_KEY}${CACHE_SETTINGS_KEY}`,
      JSON.stringify(settings)
    );
  } catch (error) {}
}

function getCacheSettings() {
  try {
    return JSON.parse(localStorage.getItem(`${APP_KEY}${CACHE_SETTINGS_KEY}`));
  } catch (error) {}
}
