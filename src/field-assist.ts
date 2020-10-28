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
export function collectValues(node: Element, context?: any, keyFieldName = 'ref'): { [k: string]: any } {

    const nodes = refs(node, keyFieldName)
    const errors = {}

    const results: any = nodes.reduce((a: any, e) => {
        const fieldName = e.getAttribute('ref')
        if (!fieldName)
            return
        const value = e.type == "select-multiple" ? getMultiSelect(e) :
            e.type == 'checkbox' ? e.checked :
                e.nodeValue || e.getAttribute('value') || e['value'] || e.textContent

        const customValidator = e.getAttribute('validator')
        let isValid
        if (customValidator) {
            const validationFunction = eval(customValidator.toString());
            isValid = validationFunction(value, context)
        } else
            isValid = !e.validity || e.validity.valid

        if (isValid)
            a[fieldName] = value
        else {
            a[fieldName] = Invalid
            // @ts-ignore
            errors[fieldName] = value
        }

        return a
    }, {})
    if (Object.keys(errors).length)
        results._errors = errors
    return results

    function getMultiSelect(e: HTMLElement) {
        const values: any = []
        e.querySelectorAll('option:checked').forEach(n =>
            values.push(n.getAttribute('value')))
        return values
    }
}

/**
 *
 * @param node start search node
 * @param keyFieldName optional alternative reference field name
 * @return array of elements that have the "ref" attribute
 */
export function refs(node: Element, keyFieldName = 'ref'): HTMLInputElement[] {
    const nodes = node.querySelectorAll(`[${keyFieldName}]`)
    // @ts-ignore
    return Array.of(...nodes) as HTMLInputElement[]
}

/**
 * @return elements map by the ref name
 * @param node
 * @param keyFieldName optional alternative reference field name
 */
export function refNodes(node: Element, keyFieldName = 'ref'): { [ref: string]: HTMLInputElement } {

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
export function getFieldAndValue(event: Event, context?: any, keyFieldName = 'ref'): { field: string, value: any } {
    let target = event.target as HTMLElement;
    if (!target.getAttribute(keyFieldName))
        target = target.parentNode as HTMLElement
    const fieldName = target.getAttribute(keyFieldName) as string
    const values = collectValues(target, context, keyFieldName)
    return {field: fieldName, value: values[fieldName]};
}

/**
 * Populate a single field in a normalized way
 * @param node the field's node
 * @param value the value
 */
export function populateField(node: HTMLInputElement, value: string | number | boolean | string[]) {

    if (!(node.type in ['checkbox', 'select', 'option', 'radio', 'textarea', 'select-one', 'select-multi'])) {
        // @ts-ignore
        node.value = value.toString()
        return
    }

    if ('checked' in node) {
        // @ts-ignore
        node.checked = node.value in value
        return;
    }
    if ('selected' in node) {
        // @ts-ignore
        node.selected = node.value in value
        return;
    }

    if ('textContent' in node) {
        // @ts-ignore
        node.textContent = value.toString()
        return
    }
}

/**
 * Populate a whole form from a map of field names and values
 * @param baseNode the base of the form (doesn't have to be a Form element)
 * @param values the values
 */
export function populateFields(baseNode: HTMLElement, values: { [ref: string]: string | string[] | boolean | number }) {
    const fieldMap = refNodes(baseNode)
    for (let [ref, node] of Object.entries(fieldMap))
        populateField(node, values[ref])

}


export const Invalid = Symbol('Invalid')
