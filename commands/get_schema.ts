import { load } from "@std/dotenv";
import { Command } from "@cliffy/command";
import { AIRTABLE_API_ENDPOINTS, bindEndpointsParams, log } from "../main.ts";
import { dirname, join } from "@std/path";
import { Table } from "../utils/types/table.d.ts";

//get-schema command
export const get_schema_command = new Command()
  .description(
    "Create a schema file representing the structure of a given Airtable base."
  )
  .env(
    "AIRTABLE_PAT=<value:string>",
    "Your Airtable Personal Access Token with access to the desired bases."
  )
  .option(
    "-b, --base-id <baseId:AirtableBaseId>",
    "The base id to get the schema from.",
    { required: true }
  )
  .option(
    "-o, --output-dir <file:string>",
    "The directory where to save the schema file. Using this option will name the file with the following format: <baseId>_schema_<timestamp>.json. Default is './output/'.",
    { conflicts: ["file"] }
  )
  .option(
    "-f, --file <file:string>",
    "The absolute path to save the schema file. Default is './output/schema.json'.",
    { default: "./output/schema.json", conflicts: ["output-dir"] }
  )
  .action(getSchema);

//main command function
async function getSchema(options: { baseId: unknown; outputDir?: string; file: string; airtablePat?: string   }) {
  //Airtable PAT is mandatory for this command
  const PAT = await load_PAT_from_env(options.airtablePat);
  if (!PAT) {
    throw new Error(
      "Missing Airtable Personal Access Token. Can't get schema."
    );
  }

  log.info("Getting schema...");

  const params = { baseId: options.baseId as string };

  try {
    const remote_base_schema_response = await fetch(
      bindEndpointsParams(AIRTABLE_API_ENDPOINTS.get_base_schema, params),
      {
        headers: { Authorization: `Bearer ${PAT}` },
      }
    );

    if (remote_base_schema_response.status === 401) {
      throw new Error(
        "Invalid Airtable Personal Access Token. Please check your PAT."
      );
    }
    
    if (remote_base_schema_response.status === 404) {
      throw new Error(
        "base id does not exists or the provided PAT does not have access to it."
      );
    }

    const remote_base_schema = await remote_base_schema_response.json();

    //strip views from schema
    const tables = remote_base_schema.tables.map((table: Table) => {
      delete table.views;
      return table;
    });

    const schema = { id: params.baseId, tables };

    //ensure output path ends with /
    if (options.outputDir && !options.outputDir.endsWith("/")) {
      options.outputDir += "/";
    }



    //write schema to file
    const now = new Date();

    const schema_file_path = options.outputDir ? join(options.outputDir, `${options.baseId}_schema_${now
        .toISOString()
        .replace(/[:.]/g, "-")}.json`) //replace : and . with - to avoid issues with file names
        
        : options.file; 

    // Ensure the directory exists
    await Deno.mkdir(dirname(schema_file_path), { recursive: true });

    await Deno.writeTextFile(schema_file_path, JSON.stringify(schema, null, 2));

    log.success(
      `Schema of base ${params.baseId} saved to: ${schema_file_path}.`
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error("Error getting schema: " + error.message);
    } else {
      throw new Error("Error getting schema: " + error);
    }
  }
}
async function load_PAT_from_env(shell_PAT?: string) {
  //load Airtable PAT from .env file
  const { AIRTABLE_PAT: envFilePAT } = await load();
  return shell_PAT || envFilePAT;
}

