export function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);

  for (const property of Object.values(value)) {
    if (
      property !== null &&
      (typeof property === "object" || typeof property === "function") &&
      !Object.isFrozen(property)
    ) {
      deepFreeze(property);
    }
  }

  return value;
}
