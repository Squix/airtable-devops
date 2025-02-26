import { Command } from "@cliffy/command";

//get-schema command
export const get_schema_command = new Command()
  .description(
    "Generate schema files representing the structure of an Airtable base."
  )
  .action(async () => console.log("get-schema", load_PAT_from_env()));

function load_PAT_from_env() {
  return Deno.env.get("AIRTABLE_PAT");
}
