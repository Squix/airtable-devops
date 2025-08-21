---
name: Bug report
about: Create a report to help us improve
title: "\U0001F41B Bug report"
labels: bug
assignees: ''

---

### Description
When running the `get-schema` command, the schema output does not contain every information to configure rollup fields in the base.

```(json)
{
          "type": "rollup",
          "options": {
            "isValid": true,
            "recordLinkFieldId": "fld29Ly6wtLvpbnP7",
            "fieldIdInLinkedTable": "fldkzeHGv5IZ9zk3d",
            "referencedFieldIds": [],
            "result": {
              "type": "number",
              "options": {
                "precision": 1
              }
            }
          },
          "id": "fldlIKi2j4U31yAr5",
          "name": "Jours proposés",
          "description": "Total calculé des charges proposées sur le mois."
        },
```

### Steps to reproduce
1. Setup a base with a table and a rollup field (needs a link field and another table and test records to link).
2. Add conditions to the rollup field (to only take some of the linked records)
3. Run the get-schema command
4. Observe the json output lacking info

### Expected behavior
The schema should contain the conditional config of the rollup fields.

### Actual behavior
The schema does not contain the conditional config of the rollup fields

### Environment
- CLI Version: X.X.X
