const SOUND_FILE_PREFIX = "assets/sounds/";

const SoundService = {};

SoundService.sounds = {
  correct: {
    max: 12,
  },
  lastquestion: {
    max: 2,
  },
  newquestion: {
    max: 9,
  },
  pop: {
    max: 6,
  },
  settings: {
    max: 1,
  },
  whoosh: {
    max: 2,
  },
};

SoundService.play = {};

Object.entries(SoundService.sounds).forEach(([soundName, options]) => {
  const min = parseInt(options.min || 1);
  const max = parseInt(options.max || 1);
  const sounds = [];

  for (let i = min; i <= max; i++) {
    sounds.push(new Audio(`${SOUND_FILE_PREFIX}${soundName}${i}.wav`));
  }

  SoundService.play[soundName] = () => {
    const sound = sounds[Math.floor(Math.random() * sounds.length)]
    sound.play()
  };
});
