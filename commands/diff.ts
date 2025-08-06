import { Command } from "@cliffy/command";
import { log } from "../main.ts";
import { colors } from "@cliffy/ansi/colors";
import { validateSchema, formatValidationErrors } from "./validate.ts";
import type { Field } from "../utils/types/field.d.ts";
import { Table } from "../utils/types/table.d.ts";



// Export the diff command
export const diff_schema_command = new Command()
  .description("Compare two schema files and show structural changes in a human-readable format.")
  .option (
    "-g, --git",
    "Use git commits ids for old and new schemas files",
    {default:false}
  )
  .option(
    "-o, --old <file:string>",
    "Path to the older schema file. Older commit id if --git is used",
    { required: true }
  )
  .option(
    "-n, --new <file:string>",
    "Path to the newer schema file. Newer commit id if --git is used",
    { required: true }
  )
  .option(
    "--format <format:string>",
    "Output format (text, json)",
    { default: "text" }
  )
  .option(
    "--color",
    "Use colors in the output",
    { default: true }
  )
  .action(diff);

export async function diff(options: { old: string, new: string, format: string, color: boolean }) {
    try {
        // Read and parse both schema files
        const oldSchemaText = await Deno.readTextFile(options.old);
        const newSchemaText = await Deno.readTextFile(options.new);
        
        const oldSchema = JSON.parse(oldSchemaText) as Base;
        const newSchema = JSON.parse(newSchemaText) as Base;
        
        // Validate both schemas
        const oldValid = validateSchema(oldSchema);
        if (!oldValid) {
          const formattedErrors = formatValidationErrors(validateSchema.errors || []);
          throw new Error(`The old schema file is invalid:\n${formattedErrors}`);
        }
        
        const newValid = validateSchema(newSchema);
        if (!newValid) {
          const formattedErrors = formatValidationErrors(validateSchema.errors || []);
          throw new Error(`The new schema file is invalid:\n${formattedErrors}`);
        }
        
        // Compare the schemas
        const diff = compareSchemas(oldSchema, newSchema);
        
        // Format the output based on the requested format
        let output: string;
        
        switch (options.format) {
          case "json":
            output = JSON.stringify(diff, null, 2);
            break;
          case "text":
          default:
            output = formatSchemaDiff(diff);
            if (options.color) {
              output = colorizeDiff(output);
            }
            break;
        }
        
        // Output the result
        console.log(output);
        
      } catch (error) {
        if (error instanceof Error) {
          log.error(`Error comparing schemas: ${error.message}`);
        } else {
          log.error("An unknown error occurred while comparing schemas");
        }
        throw error;
      }
}

  // Types for schema comparison
  
  interface Base {
    id: string;
    tables: Table[];
  }

  
  interface TableDiff {
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    table: Table;
    fields?: {
      created: Field[];
      updated: {
        old: Field;
        new: Field;
      }[];
      deleted: Field[];
    };
  }
  
  interface SchemaDiff {
    baseId: string;
    tables: {
      created: Table[];
      updated: TableDiff[];
      deleted: Table[];
    };
  }
  
  // Helper functions for comparing schemas
  function findTableById(schema: Base, id: string): Table | undefined {
    return schema.tables.find(table => table.id === id);
  }
  
  function compareFieldSets(oldFields: Field[], newFields: Field[]): {
    created: Field[];
    updated: { old: Field; new: Field }[];
    deleted: Field[];
  } {
    const created: Field[] = [];
    const updated: { old: Field; new: Field }[] = [];
    const deleted: Field[] = [];
    
    // Find created and updated fields
    for (const newField of newFields) {
      const oldField = oldFields.find(f => f.id === newField.id);
      if (!oldField) {
        created.push(newField);
      } else if (JSON.stringify(oldField) !== JSON.stringify(newField)) {
        updated.push({ old: oldField, new: newField });
      }
    }
    
    // Find deleted fields
    for (const oldField of oldFields) {
      if (!newFields.find(f => f.id === oldField.id)) {
        deleted.push(oldField);
      }
    }
    
    return { created, updated, deleted };
  }
  
  function compareTableSets(oldTables: Table[], newTables: Table[]): {
    created: Table[];
    updated: Table[];
    deleted: Table[];
  } {
    const created: Table[] = [];
    const updated: Table[] = [];
    const deleted: Table[] = [];
    
    // Find created and updated tables
    for (const newTable of newTables) {
      const oldTable = oldTables.find(t => t.id === newTable.id);
      if (!oldTable) {
        created.push(newTable);
      } else if (JSON.stringify(oldTable) !== JSON.stringify(newTable)) {
        updated.push(newTable);
      }
    }
    
    // Find deleted tables
    for (const oldTable of oldTables) {
      if (!newTables.find(t => t.id === oldTable.id)) {
        deleted.push(oldTable);
      }
    }
    
    return { created, updated, deleted };
  }
  
  function compareSchemas(oldSchema: Base, newSchema: Base): SchemaDiff {
    // Compare tables
    const tableDiffs = compareTableSets(oldSchema.tables, newSchema.tables);
    
    // For each modified table, compare fields
    const updatedTables = tableDiffs.updated.map(table => {
      const oldTable = findTableById(oldSchema, table.id)!;
      const fieldDiffs = compareFieldSets(oldTable.fields, table.fields);
      
      return {
        type: 'UPDATE' as const,
        table,
        fields: fieldDiffs
      };
    });
    
    return {
      baseId: newSchema.id,
      tables: {
        created: tableDiffs.created,
        updated: updatedTables,
        deleted: tableDiffs.deleted
      }
    };
  }
  
  // Format the diff for display
  function formatFieldDiff(field: Field, type: 'CREATE' | 'UPDATE' | 'DELETE'): string {
    const symbol = type === 'CREATE' ? '+' : type === 'DELETE' ? '-' : '~';
    let output = `${symbol} ${field.name} (${field.type})`;
    
    // Add options for created fields
    if (type === 'CREATE' && field.options && Object.keys(field.options).length > 0) {
      output += '\n    options:';
      for (const [key, value] of Object.entries(field.options)) {
        output += `\n      + ${key}: ${JSON.stringify(value)}`;
      }
    }
    
    return output;
  }
  
  function formatFieldChanges(oldField: Field, newField: Field): string {
    const changes: string[] = [];
    
    if (oldField.name !== newField.name) {
      changes.push(`name: ${oldField.name} → ${newField.name}`);
    }
    
    if (oldField.type !== newField.type) {
      changes.push(`type: ${oldField.type} → ${newField.type}`);
    }
    
    if (oldField.description !== newField.description) {
      changes.push(`description: "${oldField.description || ''}" → "${newField.description || ''}"`);
    }
    
    // Handle options changes
    if (oldField.options || newField.options) {
      const oldOptions = oldField.options || {};
      const newOptions = newField.options || {};
      
      // Check for added options
      for (const [key, value] of Object.entries(newOptions)) {
        if (!(key in oldOptions)) {
          changes.push(`options: + ${key}: ${JSON.stringify(value)}`);
        }
      }
      
      // Check for removed options
      for (const [key, value] of Object.entries(oldOptions)) {
        if (!(key in newOptions)) {
          changes.push(`options: - ${key}: ${JSON.stringify(value)}`);
        }
      }
      
      // Check for modified options
      for (const [key, newValue] of Object.entries(newOptions)) {
        if (key in oldOptions && JSON.stringify(oldOptions[key]) !== JSON.stringify(newValue)) {
          changes.push(`options: ~ ${key}: ${JSON.stringify(oldOptions[key])} → ${JSON.stringify(newValue)}`);
        }
      }
    }
    
    return changes.map(change => `    ${change}`).join('\n');
  }
  
  function formatTableDiff(tableDiff: TableDiff): string {
    const symbol = tableDiff.type === 'CREATE' ? '+' : tableDiff.type === 'DELETE' ? '-' : '~';
    const tableName = tableDiff.table.name;
    const typeText = tableDiff.type === 'CREATE' ? 'NEW TABLE' : 
                    tableDiff.type === 'DELETE' ? 'REMOVED TABLE' : 
                    'MODIFIED TABLE';
    
    let output = `${symbol} ${tableName} (${typeText})`;
    
    if (tableDiff.type === 'UPDATE' && tableDiff.fields) {
      // Add created fields
      for (const field of tableDiff.fields.created) {
        output += `\n  ${formatFieldDiff(field, 'CREATE')}`;
      }
      
      // Add updated fields
      for (const { old: oldField, new: newField } of tableDiff.fields.updated) {
        output += `\n  ${formatFieldDiff(newField, 'UPDATE')}`;
        output += `\n${formatFieldChanges(oldField, newField)}`;
      }
      
      // Add deleted fields
      for (const field of tableDiff.fields.deleted) {
        output += `\n  ${formatFieldDiff(field, 'DELETE')}`;
      }
    } else if (tableDiff.type === 'CREATE') {
      // For new tables, show all fields
      for (const field of tableDiff.table.fields) {
        output += `\n  ${formatFieldDiff(field, 'CREATE')}`;
      }
    }
    
    return output;
  }
  
  function formatSchemaDiff(diff: SchemaDiff): string {
    let output = `Base: ${diff.baseId}\n\n`;
    
    // Format created tables
    for (const table of diff.tables.created) {
      output += formatTableDiff({ type: 'CREATE', table }) + '\n\n';
    }
    
    // Format updated tables
    for (const tableDiff of diff.tables.updated) {
      output += formatTableDiff(tableDiff) + '\n\n';
    }
    
    // Format deleted tables
    for (const table of diff.tables.deleted) {
      output += formatTableDiff({ type: 'DELETE', table }) + '\n\n';
    }
    
    return output;
  }
  
  // Colorized version of the diff
  function colorizeDiff(diff: string): string {
    // Split the diff into lines
    const lines = diff.split('\n');
    
    // Process each line
    return lines.map((line) => {
      // Check if this is a main line (starts with +, -, or ~)
      if (/^[+\-~] /.test(line)) {
        // Colorize the entire main line
        if (line.startsWith('+')) {
          return colors.green(line);
        } else if (line.startsWith('-')) {
          return colors.red(line);
        } else if (line.startsWith('~')) {
          return colors.yellow(line);
        }
      } 
      // For field names (indented with 2 spaces)
      else if (/^ [+\-~] /.test(line)) {
        // Colorize the entire field line
        if (line.includes('+ ')) {
          return '  ' + colors.green(line.substring(2));
        } else if (line.includes('- ')) {
          return '  ' + colors.red(line.substring(2));
        } else if (line.includes('~ ')) {
          return '  ' + colors.yellow(line.substring(2));
        }
      }
      // For lines with arrows (→), colorize just the arrow
      else if (line.includes('→')) {
        return line.replace(/→/g, colors.cyan('→'));
      }
      
      // Return other lines unchanged
      return line;
    }).join('\n');
  }