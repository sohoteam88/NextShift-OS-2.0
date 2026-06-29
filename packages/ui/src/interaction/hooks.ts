import * as React from "react";
import { callOnKeyboardIntent } from "./keyboard";

export interface DisclosureControls {
  readonly open: boolean;
  readonly setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  readonly show: () => void;
  readonly hide: () => void;
  readonly toggle: () => void;
}

export function useDisclosure(defaultOpen = false): DisclosureControls {
  const [open, setOpen] = React.useState(defaultOpen);
  const show = React.useCallback(() => setOpen(true), []);
  const hide = React.useCallback(() => setOpen(false), []);
  const toggle = React.useCallback(() => setOpen((current) => !current), []);

  return { open, setOpen, show, hide, toggle };
}

export function useKeyboardActivation(callback: () => void) {
  return React.useCallback(
    (event: React.KeyboardEvent) => {
      callOnKeyboardIntent(event, "activate", callback);
    },
    [callback]
  );
}
