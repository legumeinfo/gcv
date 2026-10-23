// Checks a tool's arguments against its input schema. Browsers pass agents'
// arguments to tools unchecked, so a tool can't rely on its schema's types,
// limits or required properties without this. It implements the JSON Schema
// keywords GCV's tools use; a unit test keeps the tools to them.

type Schema = {
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: Schema;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
};

// the keywords checked, and those that only describe
export const CHECKED_KEYWORDS = [
  'type',
  'enum',
  'const',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minLength',
  'maxLength',
  'pattern',
  'items',
  'minItems',
  'maxItems',
  'properties',
  'required',
  'additionalProperties',
];
export const ANNOTATION_KEYWORDS = ['title', 'description', 'default'];

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function hasType(value: unknown, type: string): boolean {
  switch (type) {
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'object':
      return typeOf(value) === 'object';
    default:
      return typeOf(value) === type;
  }
}

const show = (value: unknown): string => JSON.stringify(value) ?? 'undefined';

const plural = (n: number, noun: string): string =>
  `${n} ${noun}${n === 1 ? '' : 's'}`;

function check(
  schema: Schema,
  value: unknown,
  path: string,
  problems: string[],
): void {
  const problem = (message: string) =>
    problems.push(path === '' ? message : `${path}: ${message}`);
  if (schema.type !== undefined) {
    const types = [schema.type].flat();
    if (!types.some((t) => hasType(value, t))) {
      problem(`must be ${types.join(' or ')}, not ${show(value)}`);
      return;
    }
  }
  if (schema.enum !== undefined && !schema.enum.includes(value)) {
    problem(
      `must be one of ${schema.enum.map(show).join(', ')}, not ${show(value)}`,
    );
  }
  if (schema.const !== undefined && value !== schema.const) {
    problem(`must be ${show(schema.const)}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      problem(`must be at least ${schema.minimum}, not ${value}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      problem(`must be at most ${schema.maximum}, not ${value}`);
    }
    if (
      schema.exclusiveMinimum !== undefined &&
      value <= schema.exclusiveMinimum
    ) {
      problem(`must be more than ${schema.exclusiveMinimum}, not ${value}`);
    }
    if (
      schema.exclusiveMaximum !== undefined &&
      value >= schema.exclusiveMaximum
    ) {
      problem(`must be less than ${schema.exclusiveMaximum}, not ${value}`);
    }
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      problem(`must have at least ${plural(schema.minLength, 'character')}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      problem(`must have at most ${plural(schema.maxLength, 'character')}`);
    }
    if (
      schema.pattern !== undefined &&
      !new RegExp(schema.pattern, 'u').test(value)
    ) {
      problem(`must match ${schema.pattern}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      problem(`must have at least ${plural(schema.minItems, 'item')}`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      problem(`must have at most ${plural(schema.maxItems, 'item')}`);
    }
    if (schema.items !== undefined) {
      value.forEach((item, i) =>
        check(schema.items, item, `${path}[${i}]`, problems),
      );
    }
  }
  if (typeOf(value) === 'object') {
    const object = value as Record<string, unknown>;
    const properties = schema.properties ?? {};
    const at = (key: string) => (path === '' ? key : `${path}.${key}`);
    (schema.required ?? [])
      .filter((key) => object[key] === undefined)
      .forEach((key) => problems.push(`${at(key)}: is required`));
    Object.entries(object)
      .filter(([, v]) => v !== undefined)
      .forEach(([key, v]) => {
        if (key in properties) {
          check(properties[key], v, at(key), problems);
        } else if (schema.additionalProperties === false) {
          const known = Object.keys(properties);
          problems.push(
            `${at(key)}: is not a parameter` +
              (known.length > 0 ? `; use ${known.join(', ')}` : ''),
          );
        } else if (typeof schema.additionalProperties === 'object') {
          check(schema.additionalProperties, v, at(key), problems);
        }
      });
  }
}

// What is wrong with the arguments, one problem per entry; empty when they
// satisfy the schema. Calls without arguments count as {}.
export function argumentProblems(schema: unknown, args: unknown): string[] {
  const problems: string[] = [];
  check(schema as Schema, args ?? {}, '', problems);
  return problems;
}
