# Airtable DevOps Tools

A set of DevOps tools for managing Airtable bases using the command line. The main idea is to track structure changes (like deleting a field in a table) with version control like Git.

## Features

- Generate schema files representing the structure of Airtable bases.

## Installation

To use this CLI, you need to have [Deno](https://deno.land/) installed on your machine.

1. Install Deno by following the instructions on the [official website](https://deno.land/manual/getting_started/installation).
2. Clone this repository:
    ```sh
    git clone https://github.com/Squix/airtable-devops.git
    cd airtable-devops
    ```

## Usage

### Setting Up Airtable PAT

Some commands require to interact with the Airtable API, hence you need to supply a valid [Airtable Personal Access Token (PAT)](https://support.airtable.com/docs/creating-personal-access-tokens) that grants access to the resources you want the CLI to process.

You can do this by exporting the variable in your shell or using an .env file with an `AIRTABLE_PAT` property.

Bash :
```sh
export AIRTABLE_PAT=your_airtable_pat
```
Powershell :
```powershell
$env:$AIRTABLE_PAT=your_airtable_pat
```

### Commands

#### Get Schema

Generate schema files representing the structure of an Airtable base.

```sh
deno run --allow-net --allow-env --allow-write main.ts get-schema --base-id <your_base_id> --output-dir <output_directory>
```

- `--base-id` (required): The base ID to get the schema from.
- `--output-dir` (optional): The directory to save the schema file. Default is `./output/`.

Example:

```sh
deno run --allow-net --allow-env --allow-write main.ts get-schema --base-id app1234567890 --output-dir ./schemas/
```

Breakdown of permissions :
| **Permission flag** | **Optional** | **Usage**                            |
|---------------------|--------------|--------------------------------------|
| --allow-net         | No           | Access the Airtable REST API.        |
| --allow-env         | No           | Load Airtable PAT from environment.  |
| --allow-write       | No           | Write schema to a json file on disk. |
| --env-file          | Yes          | Load Airtable PATH from env file.    |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.
