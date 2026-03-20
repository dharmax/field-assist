# Field-Assist

**TL;DR**: Effortlessly map HTML forms to JSON objects and vice versa.

1.  `collectValues(element)` -> Returns a clean JSON object (with dot-notation nesting support).
2.  `populateFields(element, data)` -> Fills form fields from a JSON object.
3.  `AutoForm` -> Generates a functional HTML form from raw data/metadata.

## Installation

```bash
npm install field-assist
```

---

## 🤖 Developer & AI Quick Reference

### Core Functions
- **`collectValues(node, context?, attr='ref')`**: Recursively gathers values from elements with a `ref` attribute.
    - Supports dot-notation: `ref="user.name"` creates `{ user: { name: '...' } }`.
    - Returns `{ ..., _errors: { ... } }` if validation fails.
- **`populateFields(node, data)`**: The inverse of `collectValues`. Maps JSON keys back to `ref` attributes.
- **`getFieldAndValue(event, context?)`**: Useful for "update-as-you-type" patterns. Returns `{ field, value }`.
- **`disable(node, shouldDisable, fields?, subfield?)`**: Toggle `disabled` state for all or specific fields.

### AutoForm & Wizard
```typescript
const form = new AutoForm(metaData);
form.groups = { step1: { label: 'Start' }, step2: { label: 'End' } };
form.wizard = true; // Enables step-by-step mode
form.render(initialData, container);
```

---

## Key Features

### 1. Smart Normalization
`field-assist` automatically handles:
- **Checkboxes**: Single (boolean) or Multiple (array of values).
- **Radios**: Returns the selected value.
- **Multi-select**: Returns an array of selected options.
- **Nested Objects**: Use `ref="a.b.c"` in HTML to get `{ a: { b: { c: value } } }`.

### 2. Validation
Supports standard HTML validation (pattern, required, type) and custom logic.
- **Custom Validator**: Add a `validator` attribute with a function string: `validator="(v) => v > 10"`.
- **Error Handling**: If a field is invalid, its value in the result object becomes the `Invalid` Symbol, and details are placed in `_errors`.

### 3. Auto-Form Generation
The `AutoForm` class "guesses" the correct input type based on your data:
- `string` -> `<input type="text">` or `<textarea>`
- `number` -> `<input type="number">`
- `boolean` -> `<input type="checkbox">`
- `Date` -> `<input type="date">`
- `Array` -> `<select multiple>`

---

## Example Usage

### HTML
```html
<div id="my-form">
  <input ref="user.firstName" value="John">
  <input ref="user.age" type="number" validator="(v) => v < 120" value="30">
  <input type="checkbox" ref="tags" value="js" checked>
  <input type="checkbox" ref="tags" value="ts">
</div>
```

### JavaScript
```javascript
import { collectValues } from 'field-assist';

const data = collectValues(document.getElementById('my-form'));
// Result: { user: { firstName: 'John', age: 30 }, tags: ['js'] }
```

---

## 📜 Full API Documentation
See [api.md](./api.md) for detailed function signatures.

## License
[ISC](https://opensource.org/licenses/ISC)
