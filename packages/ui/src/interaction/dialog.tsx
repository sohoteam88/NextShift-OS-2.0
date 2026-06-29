import * as React from "react";
import { Modal, type ModalProps } from "./modal";

export interface DialogProps extends Omit<ModalProps, "role"> {
  readonly danger?: boolean;
}

export function Dialog({
  danger = false,
  ...props
}: DialogProps): React.ReactElement | null {
  return <Modal data-dialog-tone={danger ? "danger" : "default"} {...props} />;
}
