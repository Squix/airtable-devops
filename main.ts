import { Command } from "@cliffy/command";
import { get_schema_command } from "./commands/get_schema.ts";
import { colors } from "@cliffy/ansi/colors";

// Define the version globally
const VERSION = "1.0.0";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}

//Define theme colors
export const log_colors = {
  error: colors.bold.red,
  warn: colors.bold.yellow,
  info: colors.bold.blue,
};

//When CLI is run
async function main() {
  //Commands definition

  const main_command = new Command()
    //main command
    .name("airtable-devops")
    .version(VERSION)
    .description("DevOps tools for Airtable.")
    .globalEnv(
      "AIRTABLE_PAT=<value:string>",
      "Your Airtable Personal Access Token with access to the desired bases."
    )
    .globalAction((options) => {
      if (options.env?.AIRTABLE_PAT) {
        Deno.env.set("AIRTABLE_PAT", options.env.AIRTABLE_PAT);
      }
    })
    .action(() => main_command.showHelp())

    //subcommands
    .command("get-schema", get_schema_command);

  try {
    await main_command.parse(Deno.args);
  } catch (error: any) {
    console.error("Error: ", error.message);
    Deno.exit(1);
  }
}
