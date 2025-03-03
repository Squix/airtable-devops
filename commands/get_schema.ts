import { Command } from "@cliffy/command";
import { AIRTABLE_API_ENDPOINTS, bindEndpointsParams, log } from "../main.ts";
import { dirname, join, parse } from "@std/path";

//get-schema command
export const get_schema_command = new Command()
  .description(
    "Generate schema files representing the structure of an Airtable base."
  )
  .option(
    "-b, --base-id <baseId:AirtableBaseId>",
    "The base id to get the schema from.",
    { required: true }
  )
  .option(
    "-o, --output-dir <file:string>",
    "The directory to save the schema file. Default is './output/'.",
    { default: "./output/" }
  )
  .action(getSchema);

//main command function
async function getSchema(options: { baseId: string; outputDir: string }) {
  //Airtable PAT is mandatory for this command
  const PAT = load_PAT_from_env();
  if (!PAT) {
    throw new Error(
      "Missing Airtable Personal Access Token. Can't get schema."
    );
  }

  log.info("Getting schema...");

  const params = { baseId: options.baseId };

  try {
    const remote_base_schema_response = await fetch(
      bindEndpointsParams(AIRTABLE_API_ENDPOINTS.get_base_schema, params),
      {
        headers: { Authorization: `Bearer ${PAT}` },
      }
    );

    if (remote_base_schema_response.status === 404) {
      throw new Error(
        "base id does not exists or the provided PAT does not have access to it."
      );
    }

    const remote_base_schema = await remote_base_schema_response.json();

    //strip views from schema
    const tables = remote_base_schema.tables.map((table: any) => {
      delete table.views;
      return table;
    });

    const schema = { id: params.baseId, tables };

    //ensure output path ends with /
    if (!options.outputDir.endsWith("/")) {
      options.outputDir += "/";
    }

    //write schema to file
    const now = new Date();
    const schema_file_path = join(
      `${options.outputDir}${options.baseId}_schema_${now
        .toISOString()
        .replace(/[:.]/g, "-")}.json`
    ); //replace : and . with - to avoid issues with file names

    // Ensure the directory exists
    await Deno.mkdir(dirname(schema_file_path), { recursive: true });

    await Deno.writeTextFile(schema_file_path, JSON.stringify(schema, null, 2));

    log.success(
      `Schema of base ${params.baseId} saved to: ${schema_file_path}.`
    );
  } catch (error: any) {
    throw new Error("Error getting schema: " + error.message);
  }
}

function load_PAT_from_env() {
  return Deno.env.get("AIRTABLE_PAT");
}
