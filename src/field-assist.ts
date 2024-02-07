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
            value = e.nodeValue || e['value'] || e.textContent
    }

    const customValidator = e.getAttribute('validator')
    let isValid
    if (customValidator) {
        const validationFunction = eval(customValidator.toString());
        isValid = validationFunction(value, context)
        e.setCustomValidity(isValid ? "" : "Invalid value")
    } else
        isValid = !e.validity || e.validity.valid

    e.reportValidity()
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
export function getFieldAndValue(event: Event | HTMLElement, context?: any, keyFieldName = DEFAULT_KEY_FIELDNAME): { field: string, value: any } {
    let target = event instanceof HTMLElement ? event : event.target as HTMLElement
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
        case 'checkbox': {
            // @ts-ignore
            const siblings = node.parentElement.parentElement.querySelectorAll(`[ref="${node.getAttribute(DEFAULT_KEY_FIELDNAME)}"]`) || []
            if (siblings.length === 1) {
                node.checked = !!value
                break;
            }
            // don't break on purpose
        }
        case 'radio': {
            // @ts-ignore
            const siblings = node.parentElement.parentElement.querySelectorAll(`[ref="${node.getAttribute(DEFAULT_KEY_FIELDNAME)}"]`) || []
            siblings.forEach(n =>
                // @ts-ignore
                n.checked = Array.isArray(value) ? value.includes(n.value) : n.value === value)

            return
        }
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

/**
 * This class generate forms out of raw data and optional meta-data.
 * It supports automatic translation (of labels and display values).
 * It generates raw DOM elements without styling, so it is your responsibility to style it (which is very easy).
 *
 */
export class AutoForm {

    /**
     * change this for supporting translation of labels
     * @param s
     */
    textTranslator = (s: string) => s

    /**
     * The generated form.
     */
    readonly form: HTMLFormElement

    /**
     * You can provide the metadata right in the constructor or anytime before rendering
     * @param metaData the metadata
     * @see FormMetaData
     */
    constructor(public metaData: FormMetaData = {}) {
        const form = ce('form')
        form.className = 'autoform'
        this.form = form as HTMLFormElement
    }

    /**
     * This method does the DOM element creation
     * @param data the data by which to "guess" the form
     * @param root optionally, you can tell it to render right into that element
     * @return the generated form
     */
    render(data: any, root?: HTMLElement): HTMLFormElement {
        this.renderFields(this.form, data)
        root?.appendChild(this.form)
        return this.form
    }


    private renderFields(node: HTMLElement, data: any, parents: string[] = []) {
        console.log(parents)
        for (let [fieldName, value] of Object.entries(data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents)
            const newNode = this.renderField(fieldName, fmd, value, parents)
            node.appendChild(newNode)
        }
    }

    private getFieldMetaData(fieldName: string, value: any, _parents: string[]): FieldMetaData {

        const self = this
        const autoFmd = createFMD()
        const parents = _parents.concat()
        const fmt = findFMD(this.metaData, parents)
        return fmt ? {...autoFmd, ...fmt} : autoFmd

        function findFMD(meta: FormMetaData, parentsList: string[]): FieldMetaData {
            if (!parentsList.length)
                return meta?.[fieldName]
            // if we're here, it means it's a nested object/form
            const p: string = <string>parents.shift()
            return findFMD(meta[p] as FormMetaData, parents)
        }

        function createFMD() {
            const fmt: FieldMetaData = {
                label: self.textTranslator(fieldName),
                componentType: 'input',
                tooltip: '',
                helpText: ''
            }
            if (Array.isArray(value)) {
                if (typeof (value[0]) === 'object') {
                    fmt.componentType = 'table'
                    return fmt
                } else if (['string', 'number'].includes(typeof (value[0]))) {
                    fmt.componentType = 'select'
                    fmt.options = value
                    fmt.attributes = {multiple: 'multiple'}
                    return fmt
                } else {
                    // arrays of other types aren't handled
                }
            }
            if (typeof value === 'object') {
                if (value instanceof Date) {
                    fmt.componentType = 'date'
                    return fmt
                } else {
                    fmt.componentType = 'object'
                    fmt.nested = value
                    return fmt
                }
            }
            // primitive type
            self.guessType(fmt, value)
            return fmt
        }
    }

    private renderField(fieldName: string, fmt: FieldMetaData, value: any, parents: string[]): HTMLElement {

        let node: HTMLElement
        const setRef = (n: HTMLElement) => n.setAttribute('ref', [...parents, fieldName].join('.'))
        switch (fmt.componentType) {
            case 'input': {
                node = cie()
                setRef(node)
                break
            }
            case 'date': {
                node = cie('date')
                setRef(node)
                break
            }

            case 'select': {
                node = ce('select')
                setRef(node)                // @ts-ignore
                fmt.options.forEach((o: any) => {
                    const option = ce('option') as HTMLOptionElement
                    node.appendChild(option)
                    option.innerText = this.textTranslator(o.text || o)
                    option.setAttribute('value', o.value || o)
                })
                break
            }
            case 'checkbox': {
                if (fmt.options) {
                    node = ce('span')
                    // @ts-ignore
                    fmt.options.forEach((o: any) => {
                        const option = cie('checkbox', fieldName, o.value || o)
                        node.appendChild(option)
                        setRef(option)
                        node.appendChild(ce('span')).innerText = this.textTranslator(o.text || o)
                    })
                } else {
                    const node = cie('checkbox')
                    setRef(node)
                }
                break
            }
            case 'radio': {
                node = ce('span')
                // @ts-ignore
                node.className = 'radio-button-set'
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o: any) => {
                        const option = cie('radio', fieldName, o.value || o)
                        setRef(option)
                        node.appendChild(option)
                        const text = ce('span')
                        node.appendChild(text)
                        text.innerText = this.textTranslator(o.text || o)
                    })
                } else {
                    node = cie('checkbox')
                }
                break
            }
            case 'textarea': {
                node = ce('textarea')
                setRef(node)
                break
            }
            case 'object': {
                node = ce('div')
                // @ts-ignore
                node.className = 'nested'
                const header = ce('h' + parents.length + 1)
                // @ts-ignore
                header.innerText = this.textTranslator(fmt.label)
                this.renderFields(node, value, parents.concat(fieldName))
                break
            }
            default:
                node = ce('input')
        }
        // @ts-ignore
        Object.entries(fmt.attributes || {}).forEach(([k, v]) => node.setAttribute(k, v))
        // @ts-ignore
        const [block, label] = CE('div', ce('label'), node)
        // @ts-ignore
        label.textContent = fmt.label

        return block
    }

    private guessType(fmt: FieldMetaData, value: any) {

        switch (typeof value) {
            case 'boolean':
                fmt.componentType = 'checkbox'
                break
            case 'number':
                fmt.componentType = 'input'
                fmt.attributes = {type: 'number'}
                break
            case 'string':
                fmt.componentType = (value.length > 40 || value.includes('\n')) ? 'textarea' : 'input'
                break
            case 'undefined':
            default:
                fmt.componentType = 'input'
                break
        }

    }
}

export type FormMetaData = { [fieldName: string]: FieldMetaData }
export type FieldMetaData = FormMetaData | {
    label: string
    validator?: (value: any) => boolean
    tooltip?: string
    helpText?: string
    componentType: 'table' | 'textarea' | 'checkbox' | 'date' | 'number' | 'radio' | 'input' | 'select' | 'object';
    attributes?: { [name: string]: string }
    defaultValue?: any
    nested?: any[] | object
    options?: { text: string, value: string }[] | string
    dependency?: string // if a field must be set before this one, this is the fields name

}

function cie(type: string = 'text', name?: string, value?: string): HTMLInputElement {
    const el = document.createElement('input')
    el.setAttribute('type', type)
    value && el.setAttribute('value', value)
    return el
}

function ce(e: string, className?: string): HTMLElement {
    const el = document.createElement(e)
    className && (el.className = className)
    return el
}

function CE(type: string, ...children: HTMLElement[]): HTMLElement[] {
    const e = ce(type)
    children.forEach(c => e.appendChild(c))
    return [e, ...children]
}
