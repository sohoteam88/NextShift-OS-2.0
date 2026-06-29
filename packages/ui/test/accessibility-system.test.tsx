import { nextShiftThemeTokens } from "@nextshift/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AppShell,
  Button,
  DashboardShell,
  Landmark,
  LiveRegion,
  LoadingOverlay,
  Sparkline,
  VisuallyHidden,
  createAccessibleId,
  createAccessibleIdFactory,
  createFocusScope,
  createFocusTrap,
  createLiveRegionMessage,
  createScreenReaderText,
  getAccessibleFieldIds,
  getAriaDescriptionProps,
  getAriaExpandedProps,
  getContrastRatio,
  getFocusableElements,
  getHighContrastOutlineStyle,
  getHighContrastStyle,
  getLandmarkProps,
  getLiveRegionProps,
  getNextRovingFocusIndex,
  getReducedMotionStyle,
  getReducedMotionTransition,
  getRovingFocusDirectionForKey,
  getRovingFocusItemProps,
  getRovingTabIndex,
  getSkipLinkStyle,
  getVisuallyHiddenStyle,
  isElementFocusable,
  meetsContrast,
  mergeAccessibleIds,
  shouldReduceMotion,
  validateAccessibleName,
  validateAriaReferences,
  validateLandmarkSemantics,
  type AccessibilityLandmarkRole,
  type AccessibilityLiveRegionPoliteness,
  type AccessibilityValidationResult,
  type FocusTrapController,
  type LiveRegionProps,
  type ReducedMotionPreference,
  type RovingFocusOrientation,
} from "../src";

function createFocusableFixture() {
  const documentRef: { activeElement: unknown } = { activeElement: null };

  const makeElement = (id: string, tabIndex = 0): HTMLElement => {
    const element = {
      getAttribute: (attribute: string) =>
        attribute === "aria-hidden" ? null : undefined,
      hasAttribute: () => false,
      id,
      ownerDocument: documentRef,
      tabIndex,
      focus: () => {
        documentRef.activeElement = element;
      },
    };

    return element as unknown as HTMLElement;
  };

  const first = makeElement("first");
  const second = makeElement("second");
  const hidden = makeElement("hidden", -1);
  const root = {
    ownerDocument: documentRef,
    querySelectorAll: () => [first, second, hidden],
  } as unknown as HTMLElement;

  documentRef.activeElement = first;

  return { documentRef, first, hidden, root, second };
}

describe("DS-007 accessibility system", () => {
  it("exposes accessibility helpers, components, and types", () => {
    const role: AccessibilityLandmarkRole = "main";
    const politeness: AccessibilityLiveRegionPoliteness = "polite";
    const preference: ReducedMotionPreference = "system";
    const orientation: RovingFocusOrientation = "both";
    const liveRegionProps: LiveRegionProps = { children: "Saved" };
    const validation: AccessibilityValidationResult = validateAccessibleName({
      text: "Submit",
    });
    const focusTrap: FocusTrapController = createFocusTrap(
      createFocusableFixture().root
    );

    expect(Landmark).toBeDefined();
    expect(LiveRegion).toBeDefined();
    expect(VisuallyHidden).toBeDefined();
    expect(role).toBe("main");
    expect(politeness).toBe("polite");
    expect(preference).toBe("system");
    expect(orientation).toBe("both");
    expect(liveRegionProps.children).toBe("Saved");
    expect(validation.valid).toBe(true);
    expect(focusTrap.activate).toBeDefined();
  });

  it("manages focus trap boundaries and focus scopes", () => {
    const { documentRef, first, root, second } = createFocusableFixture();
    const trap = createFocusTrap(root);

    trap.activate();
    expect(documentRef.activeElement).toBe(first);

    documentRef.activeElement = second;
    let prevented = false;
    trap.handleKeyDown({
      key: "Tab",
      shiftKey: false,
      preventDefault: () => {
        prevented = true;
      },
    } as KeyboardEvent);

    expect(prevented).toBe(true);
    expect(documentRef.activeElement).toBe(first);

    const scope = createFocusScope(root);
    expect(scope.focusById("second")).toBe(true);
    expect(documentRef.activeElement).toBe(second);
    expect(scope.focusById("missing")).toBe(false);
  });

  it("filters focusable elements", () => {
    const { first, hidden, root, second } = createFocusableFixture();
    const focusable = getFocusableElements(root);

    expect(isElementFocusable(first)).toBe(true);
    expect(isElementFocusable(hidden)).toBe(false);
    expect(focusable).toEqual([first, second]);
  });

  it("resolves roving focus and keyboard navigation", () => {
    expect(getRovingTabIndex(1, 1)).toBe(0);
    expect(getRovingTabIndex(2, 1)).toBe(-1);
    expect(
      getNextRovingFocusIndex({
        currentIndex: 0,
        direction: "next",
        disabledIndexes: [1],
        itemCount: 3,
      })
    ).toBe(2);
    expect(
      getNextRovingFocusIndex({
        currentIndex: 0,
        direction: "previous",
        itemCount: 3,
      })
    ).toBe(2);
    expect(getRovingFocusDirectionForKey("ArrowDown")).toBe("next");
    expect(getRovingFocusDirectionForKey("Home")).toBe("first");
    expect(getRovingFocusItemProps({ activeIndex: 0, index: 0 }).tabIndex).toBe(
      0
    );
  });

  it("renders landmarks, screen reader helpers, and live regions", () => {
    const markup = renderToStaticMarkup(
      <>
        <Landmark roleName="main" label="Main content" as="main">
          Dashboard
        </Landmark>
        <VisuallyHidden>Screen reader text</VisuallyHidden>
        <LiveRegion politeness="assertive">Saved</LiveRegion>
      </>
    );

    expect(markup).toContain('data-nextshift-accessibility="landmark"');
    expect(markup).toContain('role="main"');
    expect(markup).toContain('aria-label="Main content"');
    expect(markup).toContain('data-nextshift-accessibility="visually-hidden"');
    expect(markup).toContain("Screen reader text");
    expect(markup).toContain('data-nextshift-accessibility="live-region"');
    expect(markup).toContain('aria-live="assertive"');
    expect(markup).toContain('role="alert"');
  });

  it("provides ID, ARIA, landmark, and live-region helpers", () => {
    const nextId = createAccessibleIdFactory("nextshift-control");

    expect(createAccessibleId("field", "Customer Name")).toBe(
      "field-Customer-Name"
    );
    expect(nextId()).toBe("nextshift-control-1");
    expect(mergeAccessibleIds("a b", "b c")).toBe("a b c");
    expect(getAccessibleFieldIds("customer").errorId).toBe("customer-error");
    expect(getAriaExpandedProps(true, "menu")["aria-controls"]).toBe("menu");
    expect(
      getAriaDescriptionProps({
        describedBy: "description",
        errorId: "error",
        invalid: true,
      })["aria-describedby"]
    ).toBe("description error");
    expect(getLandmarkProps({ role: "navigation", label: "Primary" }).role).toBe(
      "navigation"
    );
    expect(getLiveRegionProps({ politeness: "polite" })["aria-atomic"]).toBe(
      true
    );
    expect(createScreenReaderText("Revenue", "up 12 percent")).toBe(
      "Revenue. up 12 percent"
    );
    expect(createLiveRegionMessage("Saved", "Customer updated")).toBe(
      "Saved: Customer updated"
    );
  });

  it("supports reduced motion and high contrast helpers", () => {
    expect(shouldReduceMotion("always")).toBe(true);
    expect(shouldReduceMotion("never", { matches: true })).toBe(false);
    expect(shouldReduceMotion("system", { matches: true })).toBe(true);
    expect(
      getReducedMotionTransition(["opacity"], {
        preference: "always",
      })
    ).toBe("none");
    expect(getReducedMotionStyle(true).transition).toBe("none");
    expect(getHighContrastStyle(true).color).toBe(
      nextShiftThemeTokens.color.foreground
    );
    expect(getHighContrastOutlineStyle().outlineColor).toBe(
      nextShiftThemeTokens.color.foreground
    );
    expect(getVisuallyHiddenStyle().position).toBe("absolute");
    expect(getSkipLinkStyle(true).position).toBe("fixed");
  });

  it("validates accessible names, ARIA references, landmarks, and contrast", () => {
    expect(validateAccessibleName({}).valid).toBe(false);
    expect(validateAccessibleName({ ariaLabel: "Close" }).valid).toBe(true);
    expect(
      validateAriaReferences({
        availableIds: ["label"],
        referencedIds: ["label", "missing"],
      }).issues[0]?.code
    ).toBe("aria-reference-missing");
    expect(validateLandmarkSemantics({ role: "navigation" }).valid).toBe(false);
    expect(
      validateLandmarkSemantics({ role: "navigation", label: "Primary" }).valid
    ).toBe(true);
    expect(getContrastRatio("#000000", "#ffffff")).toBeGreaterThan(20);
    expect(meetsContrast("#000000", "#ffffff")).toBe(true);
  });

  it("keeps DS-001 through DS-006 compatibility visible through exports", () => {
    expect(Button).toBeDefined();
    expect(AppShell).toBeDefined();
    expect(DashboardShell).toBeDefined();
    expect(LoadingOverlay).toBeDefined();
    expect(Sparkline).toBeDefined();
    expect(renderToStaticMarkup(<Button>DS-002</Button>)).toContain("DS-002");
    expect(renderToStaticMarkup(<AppShell>DS-003</AppShell>)).toContain(
      "DS-003"
    );
    expect(renderToStaticMarkup(<DashboardShell>DS-004</DashboardShell>)).toContain(
      "DS-004"
    );
    expect(renderToStaticMarkup(<LoadingOverlay label="DS-005" />)).toContain(
      "DS-005"
    );
    expect(
      renderToStaticMarkup(<Sparkline points={[{ x: 0, y: 1 }]} />)
    ).toContain('data-nextshift-visualization="sparkline"');
  });
});
