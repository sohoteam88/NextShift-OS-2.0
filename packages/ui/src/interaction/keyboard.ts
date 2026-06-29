import type { KeyboardEvent } from "react";
import type { KeyboardIntent } from "../types";

export function getKeyboardIntent(key: string): KeyboardIntent | undefined {
  if (key === "Enter" || key === " ") {
    return "activate";
  }

  if (key === "Escape") {
    return "cancel";
  }

  if (key === "ArrowDown" || key === "ArrowRight") {
    return "navigate-next";
  }

  if (key === "ArrowUp" || key === "ArrowLeft") {
    return "navigate-previous";
  }

  return undefined;
}

export function isActivationKey(key: string): boolean {
  return getKeyboardIntent(key) === "activate";
}

export function shouldHandleEscape(key: string): boolean {
  return getKeyboardIntent(key) === "cancel";
}

export function callOnKeyboardIntent(
  event: KeyboardEvent,
  intent: KeyboardIntent,
  callback: () => void
): void {
  if (getKeyboardIntent(event.key) !== intent) {
    return;
  }

  event.preventDefault();
  callback();
}
