import { Field } from "./field.d.ts";

/**
 * Airtable table with its fields.
 */
export interface Table {
    id: string;
    name: string;
    fields: Field[];
    views?: Record<string, unknown>[];
  }