# Field-Assist API Reference

## Core Functions

<dl>
<dt><a href="#collectValues">collectValues(node, context, keyFieldName)</a> ⇒ <code>Object</code></dt>
<dd><p>Recursively gathers values from elements with a reference attribute (default "ref"). Supports dot-notation for nested objects.</p></dd>

<dt><a href="#populateFields">populateFields(baseNode, values)</a></dt>
<dd><p>Populates form fields from a map of values. Also handles visual error states if <code>values._errors</code> is present.</p></dd>

<dt><a href="#populateField">populateField(node, value, error)</a></dt>
<dd><p>Populates a single field and toggles the <code>.is-invalid</code> class and <code>.error-message</code> visibility.</p></dd>

<dt><a href="#getFieldAndValue">getFieldAndValue(event, context, keyFieldName)</a> ⇒ <code>Object</code></dt>
<dd><p>Utility to get the name and normalized value of a field associated with a DOM event.</p></dd>

<dt><a href="#disable">disable(baseNode, disable, fields, subfield, keyFieldName)</a></dt>
<dd><p>Enables or disables fields within a container.</p></dd>
</dl>

---

## AutoForm Class

The `AutoForm` class generates HTML forms dynamically from data and metadata.

### Properties
- **`metaData`**: `FormMetaData` - Configuration for field labels, types, and validation.
- **`groups`**: `GroupMetaData` - Defines logical sections/fieldsets.
- **`wizard`**: `boolean` - If true, enables multi-step "Wizard" mode.
- **`textTranslator`**: `Function` - A hook for translating labels (default returns the string as-is).

### Methods
- **`render(data, root?)`**: Generates the form elements.
- **`next()`**: (Wizard mode) Navigates to the next group.
- **`prev()`**: (Wizard mode) Navigates to the previous group.
- **`goTo(step)`**: (Wizard mode) Navigates to a specific step index or group name.

---

## Types

### `FieldMetaData`
```typescript
{
    label: string;
    componentType: 'input' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'date' | 'number' | 'table' | 'object';
    group?: string;        // Logical group name
    validator?: Function;  // Custom validation logic
    attributes?: Object;   // Raw HTML attributes
    options?: Array;       // Options for select/radio/checkbox-groups
    nested?: Object;       // Nested metadata for 'object' type
}
```

### `GroupMetaData`
```typescript
{
    [groupName: string]: {
        label?: string;    // Display title for the group
        class?: string;    // Custom CSS class for the group container
    }
}
```

---

<a name="collectValues"></a>
## collectValues(node, context, keyFieldName)
**Returns**: An object where keys are the `ref` names and values are normalized. If validation fails, the entry value is the `Invalid` Symbol, and details are in `_errors`.

| Param | Description |
| --- | --- |
| node | The container element to search within. |
| context | Optional object passed to custom validators. |
| keyFieldName | The attribute to use as a key (default is "ref"). |

<a name="populateFields"></a>
## populateFields(baseNode, values)
| Param | Description |
| --- | --- |
| baseNode | The container element. |
| values | Data object (optionally containing `_errors`). |

<a name="getFieldAndValue"></a>
## getFieldAndValue(event, context, keyFieldName)
**Returns**: `{ field: string, value: any }`
