let gameSettings = {};
let temporarySettings = { values: [] };

function goHome() {
  displayScreen(PAGES.lobby);
}

function goToSettings() {
  sendScreenEvent({ getGameSettings: true });
  displayScreen(PAGES.allSettings);
}

function openSettingDetail(setting) {
  temporarySettings.key = setting.key;
  temporarySettings.values = [...(gameSettings?.[setting.key] ?? [])];
  console.log('=>', temporarySettings)
  fillSettingDetailUI(setting);
  updateSettingDetailUI();
  displayScreen(PAGES.settingsDetail);
}

function onToggleSetting(value) {
  const { onlyOneIsActive } = SETTINGS[temporarySettings.key];

  const index = temporarySettings.values.indexOf(value);
  if (index > -1) {
    temporarySettings.values.splice(index, 1);
  } else {
    if (onlyOneIsActive) {
      temporarySettings.values = [value];
    } else {
      temporarySettings.values.push(value);
    }
  }
  updateSettingDetailUI();
}

function onSaveSettings() {
  gameSettings[temporarySettings.key] = temporarySettings.values;
  sendScreenEvent({ gameSettings });
  displayScreen(PAGES.allSettings);
  temporarySettings = { values: [] };
}

function onCancelSettings() {
  displayScreen(PAGES.allSettings);
}
