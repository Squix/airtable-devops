import { Command } from "@cliffy/command";

// Define the version globally
const VERSION = "1.0.0";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}

//When CLI is run
async function main() {
  //Commands definition

  //get-schema command
  const get_schema_command = new Command()
    .description(
      "Generate schema files representing the structure of an Airtable base."
    )
    .action(async () => console.log("get-schema"));

  const main_command = new Command()
    //main command
    .name("airtable-devops")
    .version(VERSION)
    .description("DevOps tools for Airtable.")
    .action(() => main_command.showHelp())
    .command("get-schema", get_schema_command);

  try {
    await main_command.parse(Deno.args);
  } catch (error: any) {
    console.error("Error: ", error.message);
    Deno.exit(1);
  }
}
