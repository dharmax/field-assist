function normalizeValue(e, context) {
    const value = e.type == "select-multiple" ? getMultiSelect(e) :
        e.type == 'checkbox' ?
            e.checked :
            e.nodeValue || e.getAttribute('value') || e['value'] || e.textContent;
    const customValidator = e.getAttribute('validator');
    let isValid;
    if (customValidator) {
        const validationFunction = eval(customValidator.toString());
        isValid = validationFunction(value, context);
    } else
        isValid = !e.validity || e.validity.valid;
    return {value, isValid};
}

/**
 * Looks for elements with the "ref" (or whatever other  attribute then returns a map with the values
 * inside those elements, with the string in the "ref" as the name.
 * It also mark invalid values with Invalid symbol.
 *
 * @return the fields and _errors field with the list of erroneous values
 * @param node start node to look within
 * @param context an optional context object that will be injected into a custom validator
 * @param keyFieldName optional alternative reference field name
 */
export function collectValues(node, context, keyFieldName = 'ref') {
    const nodes = refs(node, keyFieldName);
    const errors = {};
    const results = nodes.reduce((a, element) => {
        const fieldName = element.getAttribute(keyFieldName);
        if (!fieldName)
            return;
        const {value, isValid} = normalizeValue(element, context);
        if (isValid)
            a[fieldName] = value;
        else {
            a[fieldName] = Invalid;
            // @ts-ignore
            errors[fieldName] = {value, element};
        }
        return a;
    }, {});
    if (Object.keys(errors).length)
        results._errors = errors;
    return results;
}

function getMultiSelect(e) {
    const values = [];
    e.querySelectorAll('option:checked').forEach(n => values.push(n.getAttribute('value')));
    return values;
}

/**
 *
 * @param node start search node
 * @param keyFieldName optional alternative reference field name
 * @return array of elements that have the "ref" attribute
 */
export function refs(node, keyFieldName = 'ref') {
    const nodes = node.querySelectorAll(`[${keyFieldName}]`);
    // @ts-ignore
    return Array.of(...nodes);
}

/**
 * @return elements map by the ref name
 * @param node
 * @param keyFieldName optional alternative reference field name
 */
export function refNodes(node, keyFieldName = 'ref') {
    const map = {};
    const elements = refs(node, keyFieldName);
    elements.reduce((a, c) => {
        // @ts-ignore
        a[c.getAttribute(keyFieldName)] = c;
        return a;
    }, map);
    return map;
}

/**
 * Utility method that let you get the field name and value of the input field that is associated with an event
 * @param event the event
 * @param context optional context for the collectValue inner call
 * @param keyFieldName optional alternative to the "ref" attribute name
 */
export function getFieldAndValue(event, context, keyFieldName = 'ref') {
    let target = event.target;
    if (!target.getAttribute(keyFieldName))
        target = target.parentNode;
    const fieldName = target.getAttribute(keyFieldName);
    const values = collectValues(target.parentNode, context, keyFieldName);
    return {field: fieldName, value: values[fieldName]};
}

/**
 * Populate a single field in a normalized way
 * @param node the field's node
 * @param value the value
 */
export function populateField(node, value) {
    if (!(node.type in ['checkbox', 'select', 'option', 'radio', 'textarea', 'select-one', 'select-multi'])) {
        // @ts-ignore
        node.value = value.toString();
        return;
    }
    if ('checked' in node) {
        // @ts-ignore
        node.checked = node.value in value;
        return;
    }
    if ('selected' in node) {
        // @ts-ignore
        node.selected = node.value in value;
        return;
    }
    if ('textContent' in node) {
        // @ts-ignore
        node.textContent = value.toString();
        return;
    }
}

/**
 * Populate a whole form from a map of field names and values
 * @param baseNode the base of the form (doesn't have to be a Form element)
 * @param values the values
 */
export function populateFields(baseNode, values) {
    const fieldMap = refNodes(baseNode);
    for (let [ref, node] of Object.entries(fieldMap))
        populateField(node, values[ref]);
}

export const Invalid = Symbol('Invalid');
