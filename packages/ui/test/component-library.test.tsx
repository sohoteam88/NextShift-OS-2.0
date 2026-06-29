import { componentTokens, nextShiftThemeTokens } from "@nextshift/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  getButtonStyle,
  getFieldStyle,
  nextShiftUiKeyframes,
  type AlertProps,
  type BadgeProps,
  type ButtonProps,
  type CardProps,
  type EmptyStateProps,
  type InputProps,
  type SelectProps,
  type SpinnerProps,
  type TableProps,
  type TextareaProps,
} from "../src";

describe("DS-002 component library", () => {
  it("exposes public components and prop types", () => {
    const buttonProps: ButtonProps = { variant: "primary", size: "md" };
    const inputProps: InputProps = { label: "Email", size: "sm" };
    const textareaProps: TextareaProps = { label: "Notes" };
    const selectProps: SelectProps = { options: [], label: "Status" };
    const cardProps: CardProps = { children: "Card" };
    const badgeProps: BadgeProps = { variant: "success" };
    const alertProps: AlertProps = { variant: "info" };
    const tableProps: TableProps = { children: null };
    const spinnerProps: SpinnerProps = { label: "Loading data" };
    const emptyStateProps: EmptyStateProps = { title: "No results" };

    expect(Button).toBeDefined();
    expect(Input).toBeDefined();
    expect(Textarea).toBeDefined();
    expect(Select).toBeDefined();
    expect(Card).toBeDefined();
    expect(Badge).toBeDefined();
    expect(Alert).toBeDefined();
    expect(Table).toBeDefined();
    expect(Spinner).toBeDefined();
    expect(EmptyState).toBeDefined();
    expect(buttonProps.variant).toBe("primary");
    expect(inputProps.size).toBe("sm");
    expect(textareaProps.label).toBe("Notes");
    expect(selectProps.options).toEqual([]);
    expect(cardProps.children).toBe("Card");
    expect(badgeProps.variant).toBe("success");
    expect(alertProps.variant).toBe("info");
    expect(tableProps.children).toBeNull();
    expect(spinnerProps.label).toBe("Loading data");
    expect(emptyStateProps.title).toBe("No results");
  });

  it("renders button variants, sizes, disabled and loading states", () => {
    const markup = renderToStaticMarkup(
      <>
        <Button variant="primary" size="sm">
          Save
        </Button>
        <Button variant="secondary" size="md" disabled>
          Cancel
        </Button>
        <Button variant="ghost" size="lg">
          More
        </Button>
        <Button variant="danger" loading loadingLabel="Saving">
          Delete
        </Button>
      </>
    );

    expect(markup).toContain('data-variant="primary"');
    expect(markup).toContain('data-size="sm"');
    expect(markup).toContain('data-variant="ghost"');
    expect(markup).toContain("disabled");
    expect(markup).toContain('aria-busy="true"');
  });

  it("renders form controls with invalid and disabled states", () => {
    const markup = renderToStaticMarkup(
      <>
        <Input label="Email" name="email" error="Required" placeholder="email" />
        <Textarea label="Notes" name="notes" disabled error="Invalid notes" />
        <Select
          label="Status"
          name="status"
          placeholder="Select status"
          error="Required"
          options={[
            { value: "new", label: "New" },
            { value: "won", label: "Won", disabled: true },
          ]}
        />
      </>
    );

    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain("Required");
    expect(markup).toContain("Invalid notes");
    expect(markup).toContain("Select status");
    expect(markup).toContain("disabled");
  });

  it("renders card structure", () => {
    const markup = renderToStaticMarkup(
      <Card header="Header" footer="Footer" variant="elevated">
        Body
      </Card>
    );

    expect(markup).toContain("<header");
    expect(markup).toContain("Header");
    expect(markup).toContain("Body");
    expect(markup).toContain("<footer");
    expect(markup).toContain('data-variant="elevated"');
  });

  it("renders badge variants", () => {
    const markup = renderToStaticMarkup(
      <>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="info">Info</Badge>
      </>
    );

    expect(markup).toContain('data-variant="neutral"');
    expect(markup).toContain('data-variant="primary"');
    expect(markup).toContain('data-variant="success"');
    expect(markup).toContain('data-variant="warning"');
    expect(markup).toContain('data-variant="danger"');
    expect(markup).toContain('data-variant="info"');
  });

  it("renders alert variants with accessible roles", () => {
    const markup = renderToStaticMarkup(
      <>
        <Alert variant="info" title="Info">
          Message
        </Alert>
        <Alert variant="danger" title="Danger">
          Failure
        </Alert>
      </>
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('data-variant="danger"');
  });

  it("renders spinner with an accessible label", () => {
    const markup = renderToStaticMarkup(<Spinner label="Loading customers" />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Loading customers"');
    expect(markup).toContain("Loading customers");
    expect(markup).toContain("nextshift-ui-spin");
  });

  it("renders empty state structure", () => {
    const markup = renderToStaticMarkup(
      <EmptyState title="No customers" description="Add a customer to begin." />
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain("No customers");
    expect(markup).toContain("Add a customer to begin.");
  });

  it("renders table primitive structure and empty slot", () => {
    const markup = renderToStaticMarkup(
      <Table emptyState="No rows" isEmpty columnCount={2}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Acme</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(markup).toContain("<table");
    expect(markup).toContain("<thead");
    expect(markup).toContain("<tbody");
    expect(markup).toContain("No rows");
    expect(markup).toContain('colSpan="2"');
  });

  it("uses DS-001 tokens in style contracts", () => {
    expect(getButtonStyle("primary", "md", false).background).toBe(
      componentTokens.button.primary.background
    );
    expect(getButtonStyle("danger", "md", false).background).toBe(
      componentTokens.button.danger.background
    );
    expect(getFieldStyle("md", true, false).borderColor).toBe(
      componentTokens.input.borderError
    );
    expect(getFieldStyle("md", false, true).background).toBe(
      nextShiftThemeTokens.color.surfaceMuted
    );
    expect(nextShiftUiKeyframes).toContain("@keyframes nextshift-ui-spin");
  });
});
