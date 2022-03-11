export class Autoform {


    textTranslator = (s: string) => s


    constructor(private data: any, public metaData: FormMetaData = {}) {

    }

    render(root?: HTMLElement) {

        const form = document.createElement('form')
        form.className = 'autoform'
        root?.appendChild(form)

        this.renderFields(form)

        return form

    }

    private autoCreateMetaData() {

    }

    private renderFields(node: HTMLElement, parents: string[] = []) {
        for (let [fieldName, value] of Object.entries(data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents)
            const newNode = this.renderField(fieldName, fmd)
            node.appendChild(newNode)
        }
    }

    getFieldMetaData(fieldName: string, value, parents): FieldMetaData {

        const self = this
        return findFMD(this.metaData, parents) || createFMD()

        function findFMD(meta, parentsList): FieldMetaData {
            if (!parentsList.length)
                return meta[fieldName]
            const p = parents.shift()
            return findFMD(meta[p], p)
        }

        function createFMD() {
            if (typeof value === 'object' && !(value instanceof Date)) {

                return <FieldMetaData>{
                    label: self.textTranslator(fieldName),
                    nested: true
                }
            }
            const fmt: FieldMetaData = {
                label: self.textTranslator(fieldName),
                defaultValue: value,
                tooltip: '',
                helpText: ''
            }
            self.guessType(fmt, value)
        }
    }

    private renderField(fieldName: string, fieldMetaData: FieldMetaData): HTMLNodeElement {

        return null
    }

    private guessType(fmt: FieldMetaData, value: any) {
        if (Array.isArray(value))
            fmt.componentType = 'select'
        else switch (typeof value) {
            case 'boolean':
                fmt.componentType = 'checkbox'
                break
            case 'object': // date is assumed
                fmt.componentType = 'input'
                fmt.attributes['type'] = 'local-datetime'
                break
            case 'number':
                fmt.componentType = 'input'
                fmt.attributes['type'] = 'number'
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
export type FieldMetaData = FormMetaData | NestedObject | {
    label: string
    validator?: (value: any) => boolean
    tooltip?: string
    helpText?: string
    componentType: 'text'
    attributes: {}
    defaultValue?: any
    nested?: boolean
    dependency?: string // if a field must be set before this one, this is the fields name

}

