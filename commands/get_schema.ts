import { Command } from "@cliffy/command";
import { AIRTABLE_API_ENDPOINTS, bindEndpointsParams, log } from "../main.ts";

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
  .action(getSchema);

//main command function
async function getSchema(options: { baseId: string }) {
  //Airtable PAT is mandatory for this command
  const PAT = load_PAT_from_env();
  if (!PAT) {
    throw new Error(
      "Missing Airtable Personal Access Token. Can't get schema."
    );
  }

  log.info("Getting schema...");

  const params = { baseId: "test" };

  console.log(
    "encodedEndpoint",
    bindEndpointsParams(AIRTABLE_API_ENDPOINTS.get_base_schema, params)
  );

  try {
    const remote_base_schema_response = await fetch(
      bindEndpointsParams(AIRTABLE_API_ENDPOINTS.get_base_schema, params),
      {
        headers: { Authorization: `Bearer ${PAT}` },
      }
    );

    console.log(remote_base_schema_response.status);

    if (remote_base_schema_response.status === 404) {
      throw new Error(
        "base id does not exists or the provided PAT does not have access to it."
      );
    }

    const remote_base_schema = remote_base_schema_response.json();

    log.info("Schema received: " + JSON.stringify(remote_base_schema));
  } catch (error: any) {
    throw new Error("Error getting schema: " + error.message);
  }
}

function load_PAT_from_env() {
  return Deno.env.get("AIRTABLE_PAT");
}
