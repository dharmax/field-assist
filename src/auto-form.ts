export class AutoForm {

    /**
     * change this for supporting translation of labels
     * @param s
     */
    textTranslator = (s: string) => s

    readonly form: HTMLFormElement

    constructor(public metaData: FormMetaData = {}) {
        const form = document.createElement('form')
        form.className = 'autoform'
        this.form = form
    }

    render(data: any, root?: HTMLElement) {
        this.renderFields(this.form, data)
        root?.appendChild(this.form)
        return this.form
    }


    private renderFields(node: HTMLElement, data: any, parents: string[] = []) {
        for (let [fieldName, value] of Object.entries(data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents)
            const newNode = this.renderField(fieldName, fmd, value, parents)
            node.appendChild(newNode)
        }
    }

    getFieldMetaData(fieldName: string, value: any, parents: string[]): FieldMetaData {

        const self = this
        const autoFmd = createFMD()
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
        const block = ce('div')
        const label = ce('label') as HTMLLabelElement
        block.appendChild(label)
        // @ts-ignore
        label.textContent = fmt.label
        switch (fmt.componentType) {
            case 'input': {
                node = ce('input')
                node.setAttribute('ref', fieldName)
                break
            }
            case 'date': {
                node = ce('input')
                node.setAttribute('ref', fieldName)
                node.setAttribute('type', 'date')
                break
            }
            case 'table': {
                node = ce('span')
                const header = ce('h' + parents.length + 1)
                // @ts-ignore
                header.innerText = this.textTranslator(fmt.label)
                node.innerText = 'unimplemented'
                // TODO
                break
            }
            case 'select': {
                node = ce('select')
                node.setAttribute('ref', fieldName)
                // @ts-ignore
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
                        const option = ce('input') as HTMLOptionElement
                        node.appendChild(option)
                        option.setAttribute('type', 'checkbox')
                        option.setAttribute('value', o.value || o)
                        option.setAttribute('ref', [...parents, fieldName].join('.'))
                        option.innerText = this.textTranslator(o.text || o)
                    })
                } else {
                    node = ce('input')
                    node.setAttribute('type', 'checkbox')
                    node.setAttribute('ref', fieldName)
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
                        const option = ce('input') as HTMLOptionElement
                        option.setAttribute('type', 'radio')
                        option.setAttribute('name', fieldName)
                        option.setAttribute('ref', [...parents, fieldName].join('.'))
                        node.appendChild(option)
                        const text = ce('span')
                        node.appendChild(text)
                        text.innerText = this.textTranslator(o.text || o)
                        option.setAttribute('value', o.value || o)
                    })
                } else {
                    node = ce('input')
                    node.setAttribute('type', 'checkbox')
                }
                break
            }
            case 'textarea': {
                node = ce('textarea')
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
        block.appendChild(node)

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

function cie(type: string, name: string, value?: string) {
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