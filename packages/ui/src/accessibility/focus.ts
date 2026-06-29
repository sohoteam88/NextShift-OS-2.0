export const focusableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]",
].join(",");

export interface FocusTrapOptions {
  readonly initialFocus?: HTMLElement | null;
  readonly fallbackFocus?: HTMLElement | null;
  readonly returnFocus?: boolean;
  readonly onDeactivate?: () => void;
}

export interface FocusTrapController {
  readonly activate: () => void;
  readonly deactivate: () => void;
  readonly focusFirst: () => void;
  readonly focusLast: () => void;
  readonly handleKeyDown: (
    event: Pick<KeyboardEvent, "key" | "shiftKey" | "preventDefault">
  ) => void;
}

function canUseAttribute(element: HTMLElement, attribute: string): boolean {
  return typeof element.hasAttribute === "function" && element.hasAttribute(attribute);
}

export function isElementFocusable(element: HTMLElement): boolean {
  if (canUseAttribute(element, "disabled") || canUseAttribute(element, "hidden")) {
    return false;
  }

  if (typeof element.getAttribute === "function") {
    if (element.getAttribute("aria-hidden") === "true") {
      return false;
    }
  }

  return element.tabIndex >= 0;
}

export function getFocusableElements(root: ParentNode): HTMLElement[] {
  if (typeof root.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    isElementFocusable
  );
}

export function focusElement(element: HTMLElement | null | undefined): void {
  element?.focus?.();
}

function getActiveElement(root: HTMLElement): Element | null {
  return root.ownerDocument?.activeElement ?? null;
}

export function createFocusTrap(
  root: HTMLElement,
  options: FocusTrapOptions = {}
): FocusTrapController {
  let previouslyFocused: Element | null = null;

  const focusFirst = () => {
    const focusable = getFocusableElements(root);
    focusElement(options.initialFocus ?? focusable[0] ?? options.fallbackFocus);
  };

  const focusLast = () => {
    const focusable = getFocusableElements(root);
    focusElement(focusable[focusable.length - 1] ?? options.fallbackFocus);
  };

  return {
    activate: () => {
      previouslyFocused = getActiveElement(root);
      focusFirst();
    },
    deactivate: () => {
      if (options.returnFocus !== false) {
        focusElement(previouslyFocused as HTMLElement | null);
      }
      options.onDeactivate?.();
    },
    focusFirst,
    focusLast,
    handleKeyDown: (event) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(root);
      if (focusable.length === 0) {
        event.preventDefault();
        focusElement(options.fallbackFocus);
        return;
      }

      const activeElement = getActiveElement(root);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        focusElement(last);
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        focusElement(first);
      }
    },
  };
}
