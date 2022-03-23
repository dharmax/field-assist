export class AutoForm {

    /**
     * change this for supporting translation of labels
     * @param s
     */
    textTranslator = (s: string) => s

    readonly form: HTMLFormElement

    constructor(public metaData: FormMetaData = {}) {
        const form = ce('form')
        form.className = 'autoform'
        this.form = form as HTMLFormElement
    }

    render(data: any, root?: HTMLElement) {
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

    getFieldMetaData(fieldName: string, value: any, _parents: string[]): FieldMetaData {

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