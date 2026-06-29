import type * as React from "react";
import type { ReducedMotionPreference } from "../types";
import { getMotionTransition } from "../styles";

export function shouldReduceMotion(
  preference: ReducedMotionPreference = "system",
  matcher?: Pick<MediaQueryList, "matches">
): boolean {
  if (preference === "always") {
    return true;
  }

  if (preference === "never") {
    return false;
  }

  return matcher?.matches ?? false;
}

export function getReducedMotionTransition(
  properties: readonly string[],
  options: {
    readonly preference?: ReducedMotionPreference;
    readonly matcher?: Pick<MediaQueryList, "matches">;
    readonly speed?: "fast" | "normal" | "slow";
  } = {}
): string {
  return shouldReduceMotion(options.preference, options.matcher)
    ? "none"
    : getMotionTransition(properties, options.speed);
}

export function getReducedMotionStyle(
  reduced: boolean
): React.CSSProperties {
  return reduced
    ? {
        animation: "none",
        scrollBehavior: "auto",
        transition: "none",
      }
    : {};
}
