import { Command } from "@cliffy/command";
import {Ajv2020, ErrorObject} from "ajv/dist/2020.js";
// Import schemas directly
import baseSchema from "../utils/schemas/base_json_schema.json" with { type: "json" };
import tableSchema from "../utils/schemas/table_json_schema.json" with { type: "json" };
import fieldSchema from "../utils/schemas/field_json_schema.json" with { type: "json" };
import { log } from "../main.ts";

// Function to format validation errors in a user-friendly way
export function formatValidationErrors(errors: ErrorObject[]): string {
  return errors.map(error => {
    const path = error.instancePath;
    const message = error.message ?? "unknown error";
    const schemaPath = error.schemaPath.replace("https://squixtech.com/schemas/", "");

    const details = `(${Object.entries(error.params)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')})`

      return `- Path: ${path}\n  Reference schema: ${schemaPath}\n   Object ${error.data ? "with value "+JSON.stringify(error.data) : ""} ${message}. Details: ${details}.`;

    
  }).join('\n');
}

// Pre-compile the validator at module level
const ajv = new Ajv2020({ 
  allErrors: true,
  verbose: true,
  schemas: {
    "airtable-base-schema": baseSchema,
    "airtable-table-schema": tableSchema,
    "airtable-field-schema": fieldSchema,
  },
});

// Pre-compile the validation function
export const validateSchema = ajv.compile({ $ref: "airtable-base-schema" });

//validate command
export const validate_schema_command = new Command()
  .description(
    "Validate a schema file representing the structure of an Airtable base."
  )
  .option(
    "-f, --file <file:string>",
    "The path to the schema file to validate.",
    { required: true }
  )
  .action(validate);
  
//main command function
export async function validate(options: { file: string }) {
  try {
    // Read and parse the input file
    const inputSchema = JSON.parse(await Deno.readTextFile(options.file));

    // Use pre-compiled validator
    const valid = validateSchema(inputSchema);

    if (!valid) {
      const formattedErrors = formatValidationErrors(validateSchema.errors || []);
      throw new Error(`The provided schema is invalid:\n${formattedErrors}`);
    }

    log.success("The provided schema file is valid!");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}
