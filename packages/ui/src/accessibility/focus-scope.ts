import { createFocusTrap, focusElement, getFocusableElements } from "./focus";

export interface FocusScopeController {
  readonly activate: () => void;
  readonly deactivate: () => void;
  readonly focusFirst: () => void;
  readonly focusLast: () => void;
  readonly focusById: (id: string) => boolean;
}

export function createFocusScope(root: HTMLElement): FocusScopeController {
  const trap = createFocusTrap(root);

  return {
    activate: trap.activate,
    deactivate: trap.deactivate,
    focusFirst: trap.focusFirst,
    focusLast: trap.focusLast,
    focusById: (id: string) => {
      const target = getFocusableElements(root).find((element) => element.id === id);
      if (!target) {
        return false;
      }

      focusElement(target);
      return true;
    },
  };
}
