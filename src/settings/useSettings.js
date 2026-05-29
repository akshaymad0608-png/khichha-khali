import { useEffect, useState } from 'react';

const SETTINGS_KEY = 'khali-khichha-settings';
const ONBOARD_KEY = 'khali-khichha-onboarded';

const defaults = {
  simpleMode: false,
  largeText: false,
  lightTheme: false,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

export function loadOnboarded() {
  return localStorage.getItem(ONBOARD_KEY) === '1';
}

export function markOnboarded() {
  localStorage.setItem(ONBOARD_KEY, '1');
}

export function initSettings() {
  const s = loadSettings();
  const root = document.documentElement;
  root.dataset.simple = s.simpleMode ? 'true' : 'false';
  root.dataset.large = s.largeText ? 'true' : 'false';
  root.dataset.theme = s.lightTheme ? 'light' : 'dark';
}

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    const root = document.documentElement;
    root.dataset.simple = settings.simpleMode ? 'true' : 'false';
    root.dataset.large = settings.largeText ? 'true' : 'false';
    root.dataset.theme = settings.lightTheme ? 'light' : 'dark';
  }, [settings]);

  function toggle(key) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return { settings, toggle, setSettings };
}
