import { build, emptyDir } from "@deno/dnt";
import { join } from "@std/path";
import { VERSION } from "../version.ts";

const OUTPUT_DIR = "./dist/npm";

await emptyDir(OUTPUT_DIR);

await build({
  entryPoints: [
    {
      kind: "bin",
      name: "airtable-devops", // command name
      path: "./main.ts",
    },
  ],
  outDir: OUTPUT_DIR,
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  filterDiagnostic(diagnostic) {
    if (diagnostic.file?.fileName.endsWith("deno_command_node_polyfill.ts")) {
      return false; // ignore all diagnostics in this file
    }
    // etc... more checks here
    return true;
  },
  package: {
    // package.json properties
    name: "airtable-devops",
    version: VERSION,
    description:
      "A command-line tool to build reliable complex Airtable bases.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/Squix/airtable-devops.git",
    },
    bugs: {
      url: "https://github.com/Squix/airtable-devops/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE.md", join(OUTPUT_DIR, "/LICENSE.md"));
    Deno.copyFileSync("README.md", join(OUTPUT_DIR, "/README.md"));
  },
});
