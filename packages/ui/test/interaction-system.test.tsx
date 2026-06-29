import { nextShiftThemeTokens } from "@nextshift/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AppShell,
  Button,
  DashboardShell,
  Dialog,
  Dropdown,
  LoadingOverlay,
  Modal,
  ProgressIndicator,
  Toast,
  Tooltip,
  getFocusRingStyle,
  getInteractionStateAttributes,
  getInteractionStateStyle,
  getKeyboardIntent,
  getLoadingOverlayStyle,
  getModalBackdropStyle,
  getMotionTransition,
  getProgressBarStyle,
  isActivationKey,
  isInteractionBlocked,
  shouldHandleEscape,
  type DialogProps,
  type DropdownProps,
  type InteractionState,
  type LoadingOverlayProps,
  type ModalProps,
  type ProgressIndicatorProps,
  type ToastProps,
  type TooltipProps,
} from "../src";

describe("DS-005 interaction system", () => {
  it("exposes public interaction components, helpers, and types", () => {
    const loadingProps: LoadingOverlayProps = { label: "Loading" };
    const progressProps: ProgressIndicatorProps = { value: 20 };
    const toastProps: ToastProps = { title: "Saved" };
    const modalProps: ModalProps = { children: "Modal" };
    const dialogProps: DialogProps = { children: "Dialog", danger: true };
    const dropdownProps: DropdownProps = { trigger: "Open", children: "Menu" };
    const tooltipProps: TooltipProps = { content: "Help", children: "Target" };
    const state: InteractionState = { loading: true };

    expect(LoadingOverlay).toBeDefined();
    expect(ProgressIndicator).toBeDefined();
    expect(Toast).toBeDefined();
    expect(Modal).toBeDefined();
    expect(Dialog).toBeDefined();
    expect(Dropdown).toBeDefined();
    expect(Tooltip).toBeDefined();
    expect(loadingProps.label).toBe("Loading");
    expect(progressProps.value).toBe(20);
    expect(toastProps.title).toBe("Saved");
    expect(modalProps.children).toBe("Modal");
    expect(dialogProps.danger).toBe(true);
    expect(dropdownProps.trigger).toBe("Open");
    expect(tooltipProps.content).toBe("Help");
    expect(state.loading).toBe(true);
  });

  it("renders loading overlay and progress indicator", () => {
    const markup = renderToStaticMarkup(
      <>
        <LoadingOverlay label="Loading dashboard" placement="top" />
        <ProgressIndicator value={30} max={100} label="Completion" />
      </>
    );

    expect(markup).toContain('data-nextshift-interaction="loading-overlay"');
    expect(markup).toContain('aria-label="Loading dashboard"');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="30"');
    expect(markup).toContain('aria-label="Completion"');
  });

  it("renders toast with status semantics", () => {
    const markup = renderToStaticMarkup(
      <>
        <Toast tone="success" title="Saved" description="Changes saved." />
        <Toast tone="danger" title="Failed" />
      </>
    );

    expect(markup).toContain('data-nextshift-interaction="toast"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Changes saved.");
  });

  it("renders modal and dialog contracts with accessible names", () => {
    const markup = renderToStaticMarkup(
      <>
        <Modal title="Confirm" footer="Footer">
          Modal body
        </Modal>
        <Modal aria-label="Untitled modal">Modal without title</Modal>
        <Dialog title="Danger" danger>
          Dialog body
        </Dialog>
      </>
    );

    expect(markup).toContain('data-nextshift-interaction="modal-backdrop"');
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("aria-labelledby=");
    expect(markup).toContain("<h2 id=");
    expect(markup).toContain('aria-label="Untitled modal"');
    expect(markup).toContain("Modal body");
    expect(markup).toContain('data-dialog-tone="danger"');
    expect(markup).toContain("Dialog body");
  });

  it("injects dropdown ARIA onto the real trigger", () => {
    const markup = renderToStaticMarkup(
      <>
        <Dropdown trigger={<Button>Open</Button>} open menuLabel="Actions">
          <button type="button" role="menuitem">
            Rename
          </button>
        </Dropdown>
        <Dropdown trigger={<Button>Closed</Button>} open={false}>
          <button type="button" role="menuitem">
            Hidden
          </button>
        </Dropdown>
      </>
    );

    expect(markup).toContain('data-nextshift-interaction="dropdown"');
    expect(markup).toContain('aria-expanded="true" aria-haspopup="menu">Open</button>');
    expect(markup).toContain('aria-expanded="false" aria-haspopup="menu">Closed</button>');
    expect(markup).not.toContain('<div aria-expanded=');
    expect(markup).not.toContain('<div aria-haspopup=');
    expect(markup).toContain('role="menu"');
    expect(markup).toContain("Rename");
  });

  it("renders unique tooltip IDs and matching aria-describedby", () => {
    const markup = renderToStaticMarkup(
      <>
        <Tooltip content="Helpful text" open>
          Help
        </Tooltip>
        <Tooltip content="Second tip" open>
          Second
        </Tooltip>
      </>
    );

    expect(markup).toContain('data-nextshift-interaction="tooltip"');
    expect(markup).toContain('role="tooltip"');
    expect(markup).toContain("Helpful text");
    expect(markup).not.toContain("nextshift-tooltip");

    const describedByValues = [...markup.matchAll(/aria-describedby="([^"]+)"/g)].map(
      (match) => match[1]
    );
    const tooltipIds = [...markup.matchAll(/id="([^"]+)" role="tooltip"/g)].map(
      (match) => match[1]
    );

    expect(describedByValues).toHaveLength(2);
    expect(tooltipIds).toHaveLength(2);
    expect(new Set(tooltipIds).size).toBe(2);
    expect(describedByValues).toEqual(tooltipIds);
  });

  it("resolves keyboard interactions", () => {
    expect(getKeyboardIntent("Enter")).toBe("activate");
    expect(getKeyboardIntent(" ")).toBe("activate");
    expect(getKeyboardIntent("Escape")).toBe("cancel");
    expect(getKeyboardIntent("ArrowDown")).toBe("navigate-next");
    expect(getKeyboardIntent("ArrowLeft")).toBe("navigate-previous");
    expect(getKeyboardIntent("Tab")).toBeUndefined();
    expect(isActivationKey("Enter")).toBe(true);
    expect(shouldHandleEscape("Escape")).toBe(true);
  });

  it("provides interaction state helpers", () => {
    expect(isInteractionBlocked({ loading: true })).toBe(true);
    expect(isInteractionBlocked({ disabled: true })).toBe(true);
    expect(isInteractionBlocked({ selected: true })).toBe(false);
    expect(getInteractionStateAttributes({ loading: true })["aria-busy"]).toBe(
      true
    );
    expect(getInteractionStateStyle({ disabled: true }).opacity).toBe(
      nextShiftThemeTokens.state.disabled.opacity
    );
  });

  it("uses DS-001 tokens in interaction style contracts", () => {
    expect(getFocusRingStyle("info").outlineColor).toBe(
      nextShiftThemeTokens.color.info
    );
    expect(getMotionTransition(["opacity"])).toContain(
      nextShiftThemeTokens.motion.duration.normal
    );
    expect(getProgressBarStyle("determinate", 50, "success").background).toBe(
      nextShiftThemeTokens.color.success
    );
    expect(getLoadingOverlayStyle("center").background).toBe(
      nextShiftThemeTokens.overlay.background
    );
    expect(getModalBackdropStyle().background).toBe(
      nextShiftThemeTokens.overlay.scrim
    );
  });

  it("keeps DS-001 through DS-004 compatibility visible through exports", () => {
    expect(Button).toBeDefined();
    expect(AppShell).toBeDefined();
    expect(DashboardShell).toBeDefined();
    expect(renderToStaticMarkup(<Button>DS-002</Button>)).toContain("DS-002");
    expect(renderToStaticMarkup(<AppShell>DS-003</AppShell>)).toContain(
      "DS-003"
    );
    expect(renderToStaticMarkup(<DashboardShell>DS-004</DashboardShell>)).toContain(
      "DS-004"
    );
  });
});
