# 🪄 Airtable DevOps Tools

A set of DevOps tools for managing Airtable bases using the command line. The main idea is to track structure changes (like deleting a field in a table) with version control like Git.

## ✨ Features

- 🔎 Generate schema files representing the structure of Airtable bases.
- ✅ Validate schema files to ensure they follow the correct structure used by this CLI.
- 📋 Compare two schema files to see structural changes in a human-readable format.

## 📦 Installation

### Option 1: Download pre-compiled binary (recommended)

1. Visit the [releases page](https://github.com/Squix/airtable-devops/releases)
2. Download the appropriate binary for your operating system
3. Make the binary executable (Unix/Linux/macOS):
   ```sh
   chmod +x airtable-devops
   ```
4. Move the binary to a directory in your PATH (optional)

### Option 2: Run with Deno

If you prefer to run the tool directly with Deno:

1. Install [Deno](https://deno.land/manual/getting_started/installation)
2. Clone this repository:
   ```sh
   git clone https://github.com/Squix/airtable-devops.git
   cd airtable-devops
   ```

## 🛠️ Usage

### Setting up Airtable PAT

The *get-schema* command requires to interact with the Airtable API, hence you need to supply a valid [Airtable Personal Access Token (PAT)](https://support.airtable.com/docs/creating-personal-access-tokens) that grants access to the resources you want the CLI to process.

You can provide your PAT in one of two ways:

1. Using a `.env` file in your project root (recommended):
   ```sh
   AIRTABLE_PAT=your_airtable_pat
   ```

2. Exporting the variable in your shell:
   ```sh
   # Bash
   export AIRTABLE_PAT=your_airtable_pat
   
   # Powershell
   $env:AIRTABLE_PAT=your_airtable_pat
   ```

The tool will automatically load the PAT from your `.env` file if present. If not found, it will fall back to checking the shell environment variable.

### Commands

#### 🔎 Get schema

Generate schema files representing the structure of an Airtable base.

```sh
./airtable-devops get-schema --base-id <your_base_id> --output-dir <output_directory>
```

- `--base-id` (required): The base ID to get the schema from.
- `--output-dir` (optional): The directory to save the schema file. Default is `./output/`.

Created schema files names follow this format : `{baseId}_schema_{currentISOdate}.json`

Example:

```sh
./airtable-devops get-schema --base-id app1234567890 --output-dir ./schemas/
```

#### ✅ Validate schema

Validate a schema file to ensure it follows the correct structure for an Airtable base.

```sh
./airtable-devops validate --file <path_to_schema_file>
```

- `--file` (required): The path to the schema file to validate.

Example:
```sh
./airtable-devops validate --file ./schemas/base_schema.json
```

The command will provide detailed error messages if the schema is invalid, showing exactly what needs to be fixed and where.

#### 📋 Diff schema

Compare two schema files and show structural changes in a human-readable format.

```sh
./airtable-devops diff --old <old_schema_file> --new <new_schema_file> [--format <format>] [--color]
```

- `--old` (required): Path to the old schema file.
- `--new` (required): Path to the new schema file.
- `--format` (optional): Output format (text, json). Default is "text".
- `--color` (optional): Use colors in the output. Default is true.

Example:
```sh
./airtable-devops diff --old ./schemas/base_schema_v1.json --new ./schemas/base_schema_v2.json
```

The command will show a human-readable diff of the changes between the two schema files, including:
- Created, modified, and deleted tables
- Created, modified, and deleted fields
- Changes to field properties (name, type, description, options)

Example output:
```
Base: app123456

+ Projects (NEW TABLE)
  + Name (single_line_text)
  + Status (single_select)

~ Customers (MODIFIED TABLE)
  ~ Phone
      type: text → phone_number
  + Email (email)
  ~ Address
      type: single_line_text → multiline_text
      options: + maxLength: 1000
  - ZipCode (REMOVED)

- Archives (REMOVED TABLE)
```

## 🔧 Running with Deno

If you're running the tool directly with Deno, you'll need to include the appropriate permission flags:

```sh
# Get Schema command
deno run --allow-net --allow-env --allow-write --allow-read main.ts get-schema --base-id <your_base_id> --output-dir <output_directory>

# Validate Schema command
deno run --allow-read main.ts validate --file <path_to_schema_file>

# Diff Schema command
deno run --allow-read main.ts diff --old <old_schema_file> --new <new_schema_file> [--format <format>] [--color]
```

Breakdown of needed Deno permissions:
| **Permission flag** | **Usage**                              |
|---------------------|----------------------------------------|
| --allow-net         | Access the Airtable REST API.          |
| --allow-env         | Load Airtable PAT from environment.    |
| --allow-write       | Write schema to a json file on disk.   |
| --allow-read        | Parse schema from a json file on disk. And tries to read PAT from .env file. |

## 🤝 Contributing

Contributions are welcome! Please open an issue first for any improvements or bug fixes.

## ⚖️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.
