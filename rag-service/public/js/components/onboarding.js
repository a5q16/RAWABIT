/**
 * Rawabit v2 — Onboarding Helper Module
 */

import { openLanguageSelector } from './overlay.js';

const ONBOARDING_KEY = 'rawabit_has_onboarded_v2';

export function shouldShowOnboarding() {
  try {
    return !localStorage.getItem(ONBOARDING_KEY);
  } catch (e) {
    return false;
  }
}

export function showOnboarding() {
  return openLanguageSelector(true);
}
