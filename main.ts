import { Command } from "@cliffy/command";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}

//When CLI is run
async function main() {
  //main command
  await new Command()
    .name("airtable-devops")
    .version("0.1.0")
    .description("Devops tools for Airtable")
    .parse(Deno.args);
}
