import { Command } from "@cliffy/command";
import { get_schema_command } from "./commands/get_schema.ts";
import { colors } from "@cliffy/ansi/colors";

// Define the version globally
const VERSION = "1.0.0";

//Airtable constants
export const AIRTABLE_API_URL = "https://api.airtable.com/v0";
export enum AIRTABLE_API_ENDPOINTS {
  get_base_schema = "v0/meta/bases/{baseId}/tables",
}
type AIRTABLE_PATH_PARAMS = {
  baseId?: string;
};
export const AIRTABLE_PATH_PARAMS_FORMAT = {
  baseId: /^app[a-zA-Z0-9]*$/,
};

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}

//Define theme colors
export const log = {
  error: (message: string) =>
    console.error(colors.bold.red("[ERROR] " + message)),
  warn: (message: string) =>
    console.warn(colors.bold.yellow("[WARNING] " + message)),
  info: (message: string) => console.log(colors.bold.blue("[INFO] " + message)),
};

//When CLI is run
async function main() {
  //Commands definition

  const main_command = new Command()
    //main command
    .name("airtable-devops")
    .version(VERSION)
    .description("DevOps tools for Airtable.")

    //env variables available for all subcommands
    .globalEnv(
      "AIRTABLE_PAT=<value:string>",
      "Your Airtable Personal Access Token with access to the desired bases."
    )
    .globalAction((options) => {
      if (options.env?.AIRTABLE_PAT) {
        Deno.env.set("AIRTABLE_PAT", options.env.AIRTABLE_PAT);
      }
    })

    //custom types available for all subcommands
    .globalType("AirtableBaseId", (value: { value: string }) => {
      if (AIRTABLE_PATH_PARAMS_FORMAT.baseId.test(value.value)) {
        return value;
      } else {
        throw new Error(
          "baseId must start with 'app' and contain only alphanumeric characters."
        );
      }
    })

    .action(() => main_command.showHelp())

    //subcommands
    .command("get-schema", get_schema_command);

  try {
    await main_command.parse(Deno.args);
  } catch (error: any) {
    log.error(error.message);
    Deno.exit(1);
  }
}

export const bindEndpointsParams = (
  endpoint: string,
  params: AIRTABLE_PATH_PARAMS
): string => {
  const url = new URL(AIRTABLE_API_URL); // Base URL is required for URL class

  // Replace path parameters
  let path = endpoint;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, value);
  }
  url.pathname = path;

  // Replace query parameters
  for (const [key, value] of Object.entries(params)) {
    if (url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }

  return url.href;
};
