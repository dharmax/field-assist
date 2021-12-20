const DEFAULT_KEY_FIELDNAME = 'ref'

function normalizeValue(e: HTMLInputElement, context: any) {

    let value
    switch (e.type) {
        case 'select-multiple':
            value = getMultiSelect(e)
            break
        case 'checkbox':
            // @ts-ignore
            const siblings = e.parentElement.parentElement.querySelectorAll(`[ref="${e.getAttribute(DEFAULT_KEY_FIELDNAME)}"]`) || []
            if (siblings.length < 2)
                value = !!e.checked
            else {
                // @ts-ignore
                value = Array.from(siblings).filter(e => e.checked).map(e => e.value)
            }
            break
        case 'radio':
            if (!!e.checked)
                value = e.value
            else
                return {skip: true}
            break
        default:
            value = e.nodeValue || e.getAttribute('value') || e['value'] || e.textContent
    }

    const customValidator = e.getAttribute('validator')
    let isValid
    if (customValidator) {
        const validationFunction = eval(customValidator.toString());
        isValid = validationFunction(value, context)
    } else
        isValid = !e.validity || e.validity.valid
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
export function collectValues(node: Element, context?: any, keyFieldName = DEFAULT_KEY_FIELDNAME): { [k: string]: any } {

    const nodes = refs(node, keyFieldName)
    const errors = {}

    const results: any = nodes.reduce((result: any, element) => {
        const fieldName = element.getAttribute(keyFieldName)
        if (!fieldName)
            return

        const {value, isValid, skip} = normalizeValue(element, context);
        if (skip)
            return result

        if (isValid)
            setUsingDotReference(result, fieldName, value)
        else {
            setUsingDotReference(result, fieldName, Invalid)
            // @ts-ignore
            setUsingDotReference(errors, fieldName, {value, element})
        }

        return result
    }, {})
    if (Object.keys(errors).length)
        results._errors = errors
    return results

}

function getMultiSelect(e: HTMLElement) {
    const values: any = []
    e.querySelectorAll('option:checked').forEach(n =>
        values.push(n.getAttribute('value')))
    return values
}

/**
 *
 * @param node start search node
 * @param keyFieldName optional alternative reference field name
 * @return array of elements that have the "ref" attribute
 */
export function refs(node: Element, keyFieldName = DEFAULT_KEY_FIELDNAME): HTMLInputElement[] {
    const nodes = node.querySelectorAll(`[${keyFieldName}]`)
    // @ts-ignore
    return Array.of(...nodes) as HTMLInputElement[]
}

/**
 * @return elements map by the ref name
 * @param node
 * @param keyFieldName optional alternative reference field name
 */
export function refNodes(node: Element, keyFieldName = DEFAULT_KEY_FIELDNAME): { [ref: string]: HTMLInputElement } {

    const map: { [ref: string]: HTMLInputElement } = {}
    const elements = refs(node, keyFieldName)
    elements.reduce((a, c: HTMLElement) => {
        // @ts-ignore
        a[c.getAttribute(keyFieldName)] = c
        return a
    }, map)
    return map
}

/**
 * Utility method that let you get the field name and value of the input field that is associated with an event
 * @param event the event
 * @param context optional context for the collectValue inner call
 * @param keyFieldName optional alternative to the "ref" attribute name
 */
export function getFieldAndValue(event: Event, context?: any, keyFieldName = DEFAULT_KEY_FIELDNAME): { field: string, value: any } {
    let target = event.target as HTMLElement;
    if (!target.getAttribute(keyFieldName))
        target = target.parentNode as HTMLElement
    const fieldName = target.getAttribute(keyFieldName) as string
    const values = collectValues(target.parentNode as HTMLElement, context, keyFieldName)
    const value = readUsingDotReference(values, fieldName)
    return {field: fieldName, value};
}

/**
 * Populate a single field in a normalized way
 * @param node the field's node
 * @param value the value
 */
export function populateField(node: HTMLInputElement, value: string | number | boolean | string[]) {

    switch (node.type) {
        case 'checkbox':
        case 'radio':
            // @ts-ignore
            const siblings = node.parentElement.parentElement.querySelectorAll(`[ref="${node.getAttribute(DEFAULT_KEY_FIELDNAME)}"]`) || []
            siblings.forEach(n =>
                // @ts-ignore
                n.checked = Array.isArray(value) ? value.includes(n.value) : n.value === value)

            return
        case 'select-multiple':
            // @ts-ignore
            Array.from(node.children).forEach(option => option.selected = (value || []).indexOf(option.value) != -1)
            return
        case 'option':
            // @ts-ignore
            node.selected = Array.isArray(value) ? value.includes(nodeValue) : nodeValue === value
            return
        case 'textarea':
            node.textContent = value.toString()
            return
        case 'date':
            node.value = (value as String)?.slice(0, 10) || ''
            return
        case 'datetime-local':
            node.value = (value as String)?.slice(0, 16) || ''
            return
        case 'select':
        case 'select-one':
        default:
            node.value = value?.toString() || ''

    }
}

/**
 * Populate a whole form from a map of field names and values
 * @param baseNode the base of the form (doesn't have to be a Form element)
 * @param values the values
 */
export function populateFields(baseNode: HTMLElement, values: { [ref: string]: string | string[] | boolean | number }) {
    const fieldMap = refNodes(baseNode)
    for (let [ref, node] of Object.entries(fieldMap)) {
        let value = readUsingDotReference(values, ref);
        if (value instanceof Date)
            value = value.toISOString()
        if (typeof value === 'object' && !Array.isArray(value))
            console.error(`Field ${ref} is an object and therefore unassignable to a single input.`)
        else
            populateField(node, value)
    }

}


export const Invalid = Symbol('Invalid')


export function setUsingDotReference(object: { [f: string]: any }, fieldRef: string, value: any) {


    let keys = fieldRef.split("."),
        keyChainEnd = keys.length - 1,
        i
    for (i = 0; i < keyChainEnd; ++i) {
        let key = keys[i];
        object[key] = object[key] || {};
        object = object[key];
    }
    object[keys[i]] = value

    return object

}

export function readUsingDotReference(object: { [f: string]: any }, fieldRef: string) {
    let result: any = {...object}
    result = fieldRef.split(".").reduce((a, c) => a[c], result)
    return result
}

/**
 * disable or enable all or part of the fields
 * @param baseNode
 * @param disable
 * @param fields null means all, otherwise an array of field name is expected
 * @param subfield lets you specify specific cases in a multiple options inputs
 * @param keyFieldName
 */
export function disable(baseNode: HTMLElement, disable = true, fields?: string[], subfield?: string, keyFieldName = DEFAULT_KEY_FIELDNAME) {

    const nodes: HTMLElement[] = refs(baseNode, keyFieldName)
    for (let n of nodes) {
        if (fields) {
            const r = n.getAttribute(keyFieldName) as string
            if (!fields.includes(r) || subfield && subfield != n.getAttribute('value'))
                continue
        }
        disable ?
            n.setAttribute('disabled', '') :
            n.removeAttribute('disabled')
    }

}