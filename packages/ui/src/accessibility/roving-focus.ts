import type * as React from "react";
import type { RovingFocusDirection, RovingFocusOrientation } from "../types";

export interface RovingFocusOptions {
  readonly currentIndex: number;
  readonly itemCount: number;
  readonly direction: RovingFocusDirection;
  readonly loop?: boolean;
  readonly disabledIndexes?: readonly number[];
}

function isDisabled(index: number, disabledIndexes: readonly number[]): boolean {
  return disabledIndexes.includes(index);
}

export function getRovingTabIndex(
  index: number,
  activeIndex: number,
  disabled = false
): 0 | -1 {
  return !disabled && index === activeIndex ? 0 : -1;
}

export function getNextRovingFocusIndex({
  currentIndex,
  itemCount,
  direction,
  loop = true,
  disabledIndexes = [],
}: RovingFocusOptions): number {
  if (itemCount <= 0) {
    return -1;
  }

  if (direction === "first") {
    return Array.from({ length: itemCount }, (_, index) => index).find(
      (index) => !isDisabled(index, disabledIndexes)
    ) ?? -1;
  }

  if (direction === "last") {
    return Array.from({ length: itemCount }, (_, index) => itemCount - index - 1).find(
      (index) => !isDisabled(index, disabledIndexes)
    ) ?? -1;
  }

  const step = direction === "next" ? 1 : -1;
  let nextIndex = currentIndex;

  for (let checked = 0; checked < itemCount; checked += 1) {
    nextIndex += step;

    if (nextIndex >= itemCount) {
      if (!loop) {
        return currentIndex;
      }
      nextIndex = 0;
    }

    if (nextIndex < 0) {
      if (!loop) {
        return currentIndex;
      }
      nextIndex = itemCount - 1;
    }

    if (!isDisabled(nextIndex, disabledIndexes)) {
      return nextIndex;
    }
  }

  return currentIndex;
}

export function getRovingFocusDirectionForKey(
  key: string,
  orientation: RovingFocusOrientation = "both"
): RovingFocusDirection | undefined {
  if (key === "Home") {
    return "first";
  }

  if (key === "End") {
    return "last";
  }

  if (
    (orientation === "horizontal" || orientation === "both") &&
    key === "ArrowRight"
  ) {
    return "next";
  }

  if (
    (orientation === "horizontal" || orientation === "both") &&
    key === "ArrowLeft"
  ) {
    return "previous";
  }

  if (
    (orientation === "vertical" || orientation === "both") &&
    key === "ArrowDown"
  ) {
    return "next";
  }

  if (
    (orientation === "vertical" || orientation === "both") &&
    key === "ArrowUp"
  ) {
    return "previous";
  }

  return undefined;
}

export function getRovingFocusItemProps(options: {
  readonly index: number;
  readonly activeIndex: number;
  readonly disabled?: boolean;
  readonly selected?: boolean;
}): Pick<React.HTMLAttributes<HTMLElement>, "tabIndex" | "aria-selected" | "aria-disabled"> & {
  readonly "data-roving-focus-item": string;
} {
  return {
    "aria-disabled": options.disabled || undefined,
    "aria-selected": options.selected,
    "data-roving-focus-item": "",
    tabIndex: getRovingTabIndex(options.index, options.activeIndex, options.disabled),
  };
}
