export declare const DIGITAL_SOURCE_TYPES: string[];
export declare const ID_PATTERN: RegExp;
export declare function buildRecords(
  manifest: unknown,
  editorial: unknown,
): Record<string, unknown>[];
export declare function serialize(record: unknown): string;
