import { componentTokens, nextShiftThemeTokens } from "@nextshift/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AppShell,
  Button,
  DashboardEmptyState,
  DashboardFilterBar,
  DashboardGrid,
  DashboardLoadingState,
  DashboardPage,
  DashboardPanel,
  DashboardShell,
  DashboardToolbar,
  Header,
  PageHeader,
  Sidebar,
  WidgetBody,
  WidgetContainer,
  WidgetFooter,
  WidgetHeader,
  getDashboardGridStyle,
  getDashboardPanelStyle,
  getDashboardShellStyle,
  getToolbarStyle,
  getWidgetContainerStyle,
  type DashboardDensity,
  type DashboardEmptyStateProps,
  type DashboardFilterBarProps,
  type DashboardGridProps,
  type DashboardLoadingStateProps,
  type DashboardPageProps,
  type DashboardPanelProps,
  type DashboardShellProps,
  type DashboardToolbarProps,
  type WidgetBodyProps,
  type WidgetContainerProps,
  type WidgetFooterProps,
  type WidgetHeaderProps,
} from "../src";

describe("DS-004 dashboard framework", () => {
  it("exposes public dashboard components and types", () => {
    const density: DashboardDensity = "comfortable";
    const shellProps: DashboardShellProps = { children: "Dashboard" };
    const pageProps: DashboardPageProps = { children: "Page" };
    const gridProps: DashboardGridProps = { columns: 3 };
    const panelProps: DashboardPanelProps = { children: "Panel" };
    const widgetProps: WidgetContainerProps = { status: "success", children: "Widget" };
    const headerProps: WidgetHeaderProps = { title: "Widget title" };
    const bodyProps: WidgetBodyProps = { children: "Body" };
    const footerProps: WidgetFooterProps = { children: "Footer" };
    const toolbarProps: DashboardToolbarProps = { leading: "Tools" };
    const filterProps: DashboardFilterBarProps = { filters: "Filters" };
    const emptyProps: DashboardEmptyStateProps = { title: "No widgets" };
    const loadingProps: DashboardLoadingStateProps = { label: "Loading" };

    expect(DashboardShell).toBeDefined();
    expect(DashboardPage).toBeDefined();
    expect(DashboardGrid).toBeDefined();
    expect(DashboardPanel).toBeDefined();
    expect(WidgetContainer).toBeDefined();
    expect(WidgetHeader).toBeDefined();
    expect(WidgetBody).toBeDefined();
    expect(WidgetFooter).toBeDefined();
    expect(DashboardToolbar).toBeDefined();
    expect(DashboardFilterBar).toBeDefined();
    expect(DashboardEmptyState).toBeDefined();
    expect(DashboardLoadingState).toBeDefined();
    expect(density).toBe("comfortable");
    expect(shellProps.children).toBe("Dashboard");
    expect(pageProps.children).toBe("Page");
    expect(gridProps.columns).toBe(3);
    expect(panelProps.children).toBe("Panel");
    expect(widgetProps.status).toBe("success");
    expect(headerProps.title).toBe("Widget title");
    expect(bodyProps.children).toBe("Body");
    expect(footerProps.children).toBe("Footer");
    expect(toolbarProps.leading).toBe("Tools");
    expect(filterProps.filters).toBe("Filters");
    expect(emptyProps.title).toBe("No widgets");
    expect(loadingProps.label).toBe("Loading");
  });

  it("renders dashboard shell composed with DS-003 AppShell semantics", () => {
    const markup = renderToStaticMarkup(
      <DashboardShell
        header={<Header leading="Top" />}
        sidebar={<Sidebar>Navigation</Sidebar>}
        footer="Footer"
      >
        Dashboard content
      </DashboardShell>
    );

    expect(markup).toContain('data-nextshift-dashboard="shell"');
    expect(markup).toContain('data-nextshift-layout="app-shell"');
    expect(markup).toContain("Top");
    expect(markup).toContain("Navigation");
    expect(markup).toContain("Dashboard content");
    expect(markup).toContain("Footer");
  });

  it("renders dashboard page with header and content", () => {
    const markup = renderToStaticMarkup(
      <DashboardPage title="Executive Overview" description="Reusable shell" actions={<Button>Refresh</Button>}>
        Page content
      </DashboardPage>
    );

    expect(markup).toContain('data-nextshift-dashboard="page"');
    expect(markup).toContain("<main");
    expect(markup).toContain("Executive Overview");
    expect(markup).toContain("Reusable shell");
    expect(markup).toContain("Refresh");
    expect(markup).toContain("Page content");
  });

  it("renders dashboard grid", () => {
    const markup = renderToStaticMarkup(
      <DashboardGrid columns={4} gap="lg">
        <span>A</span>
        <span>B</span>
      </DashboardGrid>
    );

    expect(markup).toContain('data-nextshift-dashboard="grid"');
    expect(markup).toContain('data-columns="4"');
    expect(markup).toContain("A");
    expect(markup).toContain("B");
  });

  it("renders dashboard panel composition", () => {
    const markup = renderToStaticMarkup(
      <DashboardPanel variant="elevated">
        <WidgetContainer>
          <WidgetHeader title="Metric" actions={<Button>Open</Button>} />
          <WidgetBody>Widget body</WidgetBody>
          <WidgetFooter>Widget footer</WidgetFooter>
        </WidgetContainer>
      </DashboardPanel>
    );

    expect(markup).toContain('data-nextshift-dashboard="panel"');
    expect(markup).toContain('data-nextshift-dashboard="widget"');
    expect(markup).toContain("Metric");
    expect(markup).toContain("Open");
    expect(markup).toContain("Widget body");
    expect(markup).toContain("Widget footer");
  });

  it("renders toolbar and filter bar", () => {
    const markup = renderToStaticMarkup(
      <>
        <DashboardToolbar leading="Toolbar" trailing={<Button>Action</Button>} />
        <DashboardFilterBar filters="Filters" actions="Apply" />
      </>
    );

    expect(markup).toContain('data-nextshift-dashboard="toolbar"');
    expect(markup).toContain('data-nextshift-dashboard="filter-bar"');
    expect(markup).toContain("Toolbar");
    expect(markup).toContain("Action");
    expect(markup).toContain("Filters");
    expect(markup).toContain("Apply");
  });

  it("renders loading and empty states", () => {
    const markup = renderToStaticMarkup(
      <>
        <DashboardLoadingState label="Loading dashboard data" />
        <DashboardEmptyState title="No dashboard widgets" description="Add widgets later." />
      </>
    );

    expect(markup).toContain('data-nextshift-dashboard="loading-state"');
    expect(markup).toContain('aria-label="Loading dashboard data"');
    expect(markup).toContain("No dashboard widgets");
    expect(markup).toContain("Add widgets later.");
  });

  it("uses DS-001 tokens in dashboard style contracts", () => {
    expect(getDashboardShellStyle("comfortable").background).toBe(
      nextShiftThemeTokens.color.background
    );
    expect(getDashboardGridStyle("auto", "md", "18rem").gap).toBe(
      nextShiftThemeTokens.spacing["4"]
    );
    expect(getDashboardPanelStyle("elevated", "comfortable").boxShadow).toBe(
      componentTokens.card.shadow
    );
    expect(getWidgetContainerStyle("info").border).toContain(
      nextShiftThemeTokens.color.info
    );
    expect(getToolbarStyle().border).toContain(nextShiftThemeTokens.color.border);
  });

  it("keeps DS-002 and DS-003 exports available", () => {
    expect(Button).toBeDefined();
    expect(AppShell).toBeDefined();
    expect(PageHeader).toBeDefined();
    expect(renderToStaticMarkup(<Button>DS-002</Button>)).toContain("DS-002");
    expect(renderToStaticMarkup(<PageHeader title="DS-003" />)).toContain("DS-003");
  });
});
