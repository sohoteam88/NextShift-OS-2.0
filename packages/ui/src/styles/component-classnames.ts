export function cx(
  ...values: ReadonlyArray<string | false | null | undefined>
): string | undefined {
  const className = values.filter(Boolean).join(" ");
  return className.length > 0 ? className : undefined;
}
