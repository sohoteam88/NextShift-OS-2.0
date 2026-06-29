const unsafeIdCharacters = /[^a-zA-Z0-9_-]+/g;

export function sanitizeAccessibleIdPart(part: string | number): string {
  return String(part).trim().replace(unsafeIdCharacters, "-").replace(/^-|-$/g, "");
}

export function createAccessibleId(
  prefix: string,
  ...parts: ReadonlyArray<string | number | undefined>
): string {
  const cleanParts = [prefix, ...parts]
    .filter((part): part is string | number => part !== undefined)
    .map(sanitizeAccessibleIdPart)
    .filter(Boolean);

  return cleanParts.join("-");
}

export function createAccessibleIdFactory(prefix: string): () => string {
  let nextId = 0;

  return () => {
    nextId += 1;
    return createAccessibleId(prefix, nextId);
  };
}

export function mergeAccessibleIds(
  ...ids: ReadonlyArray<string | undefined>
): string | undefined {
  const merged = ids
    .flatMap((id) => id?.split(/\s+/) ?? [])
    .filter(Boolean);

  return merged.length > 0 ? Array.from(new Set(merged)).join(" ") : undefined;
}

export function getAccessibleFieldIds(baseId: string): {
  readonly inputId: string;
  readonly labelId: string;
  readonly descriptionId: string;
  readonly errorId: string;
} {
  return {
    inputId: createAccessibleId(baseId, "input"),
    labelId: createAccessibleId(baseId, "label"),
    descriptionId: createAccessibleId(baseId, "description"),
    errorId: createAccessibleId(baseId, "error"),
  };
}
