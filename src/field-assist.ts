
/**
 *
 * @param node start search node
 * @return array of elements that have the "ref" attribute
 */
export function refs(node: Element): HTMLInputElement[] {
    const nodes = node.querySelectorAll('[ref]')
    // @ts-ignore
    return (Array.of(...nodes) as HTMLInputElement[])
}

/**
 * @return elements map by the ref name
 * @param node
 */
export function refNodes(node: Element): { [ref: string]: HTMLInputElement } {

    const map = {}
    refs(node).reduce((a, c) => {
        a[c.getAttribute('ref')] = c
        return a
    }, map)
    return map
}

/**
 * Looks for elements with the "ref" attribute then returns a map with the values
 * inside those elements, with the string in the "ref" as the name.
 * It also mark invalid values with Invalid symbol.
 *
 * @return the fields and _errors field with the list of erroneous values
 * @param node start node to look within
 */
export function collectValues(node: Element, context?): { [k: string]: any } {

    const nodes = refs(node)
    const errors = {}

    const results: any = nodes.reduce((a, e) => {
        const fieldName = e.getAttribute('ref')

        const value = e.type == "select-multiple" ? getMultiSelect(e) :
            e.type == 'checkbox' ? e.checked :
                e.nodeValue || e.getAttribute('value') || e['value'] || e.textContent

        const customValidator = e.getAttribute('validator')
        let isValid = true
        if (customValidator) {
            const validationFunction = eval(customValidator.toString());
            isValid = validationFunction(value, context)
        } else
            isValid = !e.validity || e.validity.valid

        if (isValid)
            a[fieldName] = value
        else {
            a[fieldName] = Invalid
            errors[fieldName] = value
        }

        return a
    }, {})
    if (Object.keys(errors).length)
        results._errors = errors
    return results

    function getMultiSelect(e) {
        const values = []
        e.querySelectorAll('option:checked').forEach(n =>
            values.push(n.getAttribute('value')))
        return values
    }
}
