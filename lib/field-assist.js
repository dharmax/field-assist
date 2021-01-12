function normalizeValue(e, context) {
    let value;
    switch (e.type) {
        case 'select-multiple':
            value = getMultiSelect(e);
            break;
        case 'checkbox':
            // @ts-ignore
            const siblings = e.parentElement.parentElement.querySelectorAll(`[ref="${e.getAttribute('ref')}"]`) || [];
            if (siblings.length < 2)
                value = !!e.checked;
            else {
                // @ts-ignore
                value = Array.from(siblings).filter(e => e.checked).map(e => e.value);
            }
            break;
        case 'radio':
            if (!!e.checked)
                value = e.value;
            else
                return {skip: true};
            break;
        default:
            value = e.nodeValue || e.getAttribute('value') || e['value'] || e.textContent;
    }
    const customValidator = e.getAttribute('validator');
    let isValid;
    if (customValidator) {
        const validationFunction = eval(customValidator.toString());
        isValid = validationFunction(value, context);
    } else
        isValid = !e.validity || e.validity.valid;
    return {value, isValid, skip: false};
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
    const results = nodes.reduce((result, element) => {
        const fieldName = element.getAttribute(keyFieldName);
        if (!fieldName)
            return;
        const {value, isValid, skip} = normalizeValue(element, context);
        if (skip)
            return result;
        if (isValid)
            setUsingDotReference(result, fieldName, value);
        else {
            setUsingDotReference(result, fieldName, Invalid);
            // @ts-ignore
            setUsingDotReference(errors, fieldName, {value, element});
        }
        return result;
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
    const value = readUsingDotReference(values, fieldName);
    return {field: fieldName, value};
}
/**
 * Populate a single field in a normalized way
 * @param node the field's node
 * @param value the value
 */
export function populateField(node, value) {
    if (['checkbox', 'option', 'radio', 'textarea', 'select-multi'].indexOf(node.type) == -1) {
        // @ts-ignore
        node.value = value.toString();
        return;
    }
    const nodeValue = node.value;
    switch (node.type) {
        case 'checkbox':
        case 'radio':
            node.checked = Array.isArray(value) ? value.includes(nodeValue) : nodeValue === value;
            return;
        case 'select':
        case 'select-one':
            return;
        case 'select-multi':
            return;
        case 'option':
            // @ts-ignore
            node.selected = Array.isArray(value) ? value.includes(nodeValue) : nodeValue === value;
            return;
        case 'textarea':
            node.textContent = value.toString();
            return;
        default:
    }
}
/**
 * Populate a whole form from a map of field names and values
 * @param baseNode the base of the form (doesn't have to be a Form element)
 * @param values the values
 */
export function populateFields(baseNode, values) {
    const fieldMap = refNodes(baseNode);
    for (let [ref, node] of Object.entries(fieldMap)) {
        let value = readUsingDotReference(values, ref);
        if (typeof value === 'object' && !Array.isArray(value))
            console.error(`Field ${ref} is an object and therefore unassignable to a single input.`);
        else
            populateField(node, value);
    }
}
export const Invalid = Symbol('Invalid');
export function setUsingDotReference(object, fieldRef, value) {
    let keys = fieldRef.split("."), keyChainEnd = keys.length - 1, i;
    for (i = 0; i < keyChainEnd; ++i) {
        let key = keys[i];
        object[key] = object[key] || {};
        object = object[key];
    }
    object[keys[i]] = value;
    return object;
}
export function readUsingDotReference(object, fieldRef) {
    let result = {...object};
    result = fieldRef.split(".").reduce((a, c) => a[c], result);
    return result;
}
