import { nextShiftThemeTokens } from "@nextshift/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AppShell,
  Badge,
  Button,
  Container,
  Grid,
  Header,
  Inline,
  MainContent,
  PageHeader,
  PageShell,
  Section,
  Sidebar,
  SplitPanel,
  Stack,
  getAppShellStyle,
  getContainerStyle,
  getGridStyle,
  getHeaderStyle,
  getSidebarStyle,
  layoutResponsiveCss,
  resolveLayoutGap,
  type AppShellProps,
  type ContainerProps,
  type GridProps,
  type HeaderProps,
  type InlineProps,
  type LayoutAlign,
  type LayoutDensity,
  type LayoutGap,
  type LayoutJustify,
  type MainContentProps,
  type PageHeaderProps,
  type PageShellProps,
  type SectionProps,
  type SidebarProps,
  type SplitPanelProps,
  type StackProps,
} from "../src";

describe("DS-003 layout system", () => {
  it("exposes public layout components and types", () => {
    const gap: LayoutGap = "md";
    const density: LayoutDensity = "comfortable";
    const align: LayoutAlign = "center";
    const justify: LayoutJustify = "between";
    const appShellProps: AppShellProps = { children: "content" };
    const pageShellProps: PageShellProps = { children: "content" };
    const headerProps: HeaderProps = { leading: "Lead" };
    const sidebarProps: SidebarProps = { children: "Nav" };
    const mainContentProps: MainContentProps = { children: "Main" };
    const containerProps: ContainerProps = { size: "lg" };
    const stackProps: StackProps = { gap };
    const inlineProps: InlineProps = { align, justify };
    const gridProps: GridProps = { columns: 3 };
    const splitPanelProps: SplitPanelProps = {
      primary: "Primary",
      secondary: "Secondary",
    };
    const sectionProps: SectionProps = { children: "Section" };
    const pageHeaderProps: PageHeaderProps = { title: "Title" };

    expect(AppShell).toBeDefined();
    expect(PageShell).toBeDefined();
    expect(Header).toBeDefined();
    expect(Sidebar).toBeDefined();
    expect(MainContent).toBeDefined();
    expect(Container).toBeDefined();
    expect(Stack).toBeDefined();
    expect(Inline).toBeDefined();
    expect(Grid).toBeDefined();
    expect(SplitPanel).toBeDefined();
    expect(Section).toBeDefined();
    expect(PageHeader).toBeDefined();
    expect(density).toBe("comfortable");
    expect(appShellProps.children).toBe("content");
    expect(pageShellProps.children).toBe("content");
    expect(headerProps.leading).toBe("Lead");
    expect(sidebarProps.children).toBe("Nav");
    expect(mainContentProps.children).toBe("Main");
    expect(containerProps.size).toBe("lg");
    expect(stackProps.gap).toBe("md");
    expect(inlineProps.justify).toBe("between");
    expect(gridProps.columns).toBe(3);
    expect(splitPanelProps.primary).toBe("Primary");
    expect(sectionProps.children).toBe("Section");
    expect(pageHeaderProps.title).toBe("Title");
  });

  it("renders AppShell with header, sidebar, main, and footer", () => {
    const markup = renderToStaticMarkup(
      <AppShell
        header={<Header leading="Top" />}
        sidebar={<Sidebar collapsed>Nav</Sidebar>}
        footer="Footer"
        sidebarCollapsed
      >
        <MainContent>Main</MainContent>
      </AppShell>
    );

    expect(markup).toContain('data-nextshift-layout="app-shell"');
    expect(markup).toContain("Top");
    expect(markup).toContain("Nav");
    expect(markup).toContain("<main");
    expect(markup).toContain("Footer");
    expect(markup).toContain('aria-label="Application sidebar"');
  });

  it("renders PageShell density and action structure", () => {
    const markup = renderToStaticMarkup(
      <PageShell header="Header" actions={<Button>Action</Button>} density="compact">
        Content
      </PageShell>
    );

    expect(markup).toContain('data-density="compact"');
    expect(markup).toContain("Header");
    expect(markup).toContain("Action");
    expect(markup).toContain("Content");
  });

  it("renders Header slots", () => {
    const markup = renderToStaticMarkup(
      <Header leading="Leading" center="Center" trailing="Trailing" sticky />
    );

    expect(markup).toContain("<header");
    expect(markup).toContain("Leading");
    expect(markup).toContain("Center");
    expect(markup).toContain("Trailing");
    expect(markup).toContain('data-sticky="true"');
  });

  it("renders Sidebar collapsed state", () => {
    const markup = renderToStaticMarkup(
      <Sidebar header="Logo" footer="Footer" collapsed label="Primary navigation">
        Links
      </Sidebar>
    );

    expect(markup).toContain("<aside");
    expect(markup).toContain('data-collapsed="true"');
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain("Links");
  });

  it("renders MainContent as a semantic main element", () => {
    const markup = renderToStaticMarkup(
      <MainContent maxWidth="lg" scrollable>
        Main area
      </MainContent>
    );

    expect(markup).toContain("<main");
    expect(markup).toContain("Main area");
  });

  it("renders Container size and padding props", () => {
    const markup = renderToStaticMarkup(
      <Container size="xl" padding="lg">
        Container
      </Container>
    );

    expect(markup).toContain('data-size="xl"');
    expect(markup).toContain('data-padding="lg"');
  });

  it("renders Stack and Inline gap and alignment behavior", () => {
    const markup = renderToStaticMarkup(
      <>
        <Stack gap="lg" align="center" fullWidth>
          <span>One</span>
        </Stack>
        <Inline gap="sm" justify="between" wrap fullWidth>
          <span>Two</span>
        </Inline>
      </>
    );

    expect(markup).toContain('data-gap="lg"');
    expect(markup).toContain('data-gap="sm"');
    expect(markup).toContain("One");
    expect(markup).toContain("Two");
  });

  it("renders Grid columns and gap behavior", () => {
    const markup = renderToStaticMarkup(
      <Grid columns={3} gap="xl">
        <span>A</span>
        <span>B</span>
      </Grid>
    );

    expect(markup).toContain('data-columns="3"');
    expect(markup).toContain('data-gap="xl"');
  });

  it("renders SplitPanel ratio and responsive marker", () => {
    const markup = renderToStaticMarkup(
      <SplitPanel primary="Primary" secondary="Secondary" ratio="2:1" />
    );

    expect(markup).toContain('data-ratio="2:1"');
    expect(markup).toContain('data-nextshift-layout="split-panel"');
    expect(markup).toContain("Primary");
    expect(markup).toContain("Secondary");
  });

  it("renders Section title, actions, and content", () => {
    const markup = renderToStaticMarkup(
      <Section title="Section title" description="Section description" actions={<Badge>New</Badge>}>
        Section content
      </Section>
    );

    expect(markup).toContain("<section");
    expect(markup).toContain("Section title");
    expect(markup).toContain("Section description");
    expect(markup).toContain("New");
    expect(markup).toContain("Section content");
  });

  it("renders PageHeader variants and actions", () => {
    const markup = renderToStaticMarkup(
      <PageHeader
        title="Customers"
        description="Manage customers"
        eyebrow="CRM"
        actions={<Button>Add</Button>}
        metadata="Updated today"
        variant="split"
      />
    );

    expect(markup).toContain("<h1");
    expect(markup).toContain("Customers");
    expect(markup).toContain("Manage customers");
    expect(markup).toContain("CRM");
    expect(markup).toContain("Updated today");
    expect(markup).toContain('data-variant="split"');
  });

  it("uses DS-001 tokens in layout style contracts", () => {
    expect(resolveLayoutGap("md")).toBe(nextShiftThemeTokens.spacing["4"]);
    expect(getHeaderStyle(true, "md").borderBottom).toContain(
      nextShiftThemeTokens.color.border
    );
    expect(getSidebarStyle(true, true).width).toBe(
      nextShiftThemeTokens.spacing["16"]
    );
    expect(getContainerStyle("lg", "md", true).maxWidth).toBe(
      nextShiftThemeTokens.breakpoint.lg
    );
    expect(getGridStyle("auto", "sm", "12rem").gap).toBe(
      nextShiftThemeTokens.spacing["3"]
    );
    expect(getAppShellStyle(false, "responsive").background).toBe(
      nextShiftThemeTokens.color.background
    );
    expect(layoutResponsiveCss).toContain(nextShiftThemeTokens.breakpoint.md);
  });

  it("keeps DS-002 exports available", () => {
    expect(Button).toBeDefined();
    expect(Badge).toBeDefined();
    expect(renderToStaticMarkup(<Button>Still exported</Button>)).toContain(
      "Still exported"
    );
  });
});
