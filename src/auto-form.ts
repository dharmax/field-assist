export class AutoForm {

    /**
     * change this for supporting translation of labels
     * @param s
     */
    textTranslator = (s: string) => s

    readonly form: HTMLFormElement

    constructor(private data: any, public metaData: FormMetaData = {}) {
        const form = document.createElement('form')
        form.className = 'autoform'
        this.form = form
    }

    render(root?: HTMLElement) {
        this.renderFields(this.form)
        root?.appendChild(this.form)
        return this.form
    }


    private renderFields(node: HTMLElement, parents: string[] = []) {
        for (let [fieldName, value] of Object.entries(this.data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents)
            const newNode = this.renderField(fieldName, fmd, value)
            node.appendChild(newNode)
        }
    }

    getFieldMetaData(fieldName: string, value: any, parents: string[]): FieldMetaData {

        const self = this
        return findFMD(this.metaData, parents) || createFMD()

        function findFMD(meta: FormMetaData, parentsList: string[]): FieldMetaData {
            if (!parentsList.length)
                return meta[fieldName]
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
                    fmt.nested = value
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

    private renderField(fieldName: string, fmt: FieldMetaData, value: any): HTMLElement {

        let node: HTMLElement
        const block = ce('div')
        const label = ce('label') as HTMLLabelElement
        block.appendChild(label)
        // @ts-ignore
        label.textContent = fmt.label
        switch (fmt.componentType) {
            case 'input':
                node = ce('input')
                node.setAttribute('ref', fieldName)
                block.appendChild(node)
                break
            case 'date':
                node = ce('input')
                node.setAttribute('ref', fieldName)
                node.setAttribute('type', 'date')
                block.appendChild(node)
                break
            case 'table':
                node = ce('span')
                node.innerText = 'unimplemented'
                // TODO
                block.appendChild(node)
                break
            case 'select':
                node = ce('select')
                node.setAttribute('ref', fieldName)
                block.appendChild(node)
                // @ts-ignore
                fmt.options.forEach((o: any) => {
                    const option = ce('option') as HTMLOptionElement
                    node.appendChild(option)
                    option.innerText = this.textTranslator(o.text || o)
                    option.setAttribute('value', o.value || o)
                })
                break

            case 'checkbox':
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o: any) => {
                        const option = ce('input') as HTMLOptionElement
                        node.setAttribute('type', 'checkbox')
                        node.appendChild(option)
                        option.innerText = this.textTranslator(o.text || o)
                        option.setAttribute('value', o.value || o)
                        node.setAttribute('ref', fieldName)
                        node.setAttribute('name', fieldName)
                        block.appendChild(node)
                    })
                } else {
                    node = ce('input')
                    node.setAttribute('type', 'checkbox')
                    node.setAttribute('ref', fieldName)
                    block.appendChild(node)
                }
                break
            case 'radio':
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o: any) => {
                        const option = ce('input') as HTMLOptionElement
                        node.setAttribute('type', 'radio')
                        node.appendChild(option)
                        option.innerText = this.textTranslator(o.text || o)
                        option.setAttribute('value', o.value || o)
                        block.appendChild(node)

                    })
                } else {
                    node = ce('input')
                    node.setAttribute('type', 'checkbox')
                    block.appendChild(node)

                }
                break
            case 'textarea':
                node = ce('textarea')
                block.appendChild(node)
                break
            case 'object':
            default:
                node = ce('input')
                block.appendChild(node)

        }
        // @ts-ignore
        node && Object.entries(fmt.attributes || {}).forEach(([k, v]) => node.setAttribute(k, v))

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
    componentType: string
    attributes?: { [name: string]: string }
    defaultValue?: any
    nested?: any[] | object
    options?: { text: string, value: string }[] | string
    dependency?: string // if a field must be set before this one, this is the fields name

}

function ce(e: string) {
    return document.createElement(e)
}