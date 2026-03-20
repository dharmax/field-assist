const DEFAULT_KEY_FIELDNAME = 'ref'

function normalizeValue(e: HTMLInputElement, context: any) {
    let value
    switch (e.type) {
        case 'select-multiple': value = getMultiSelect(e); break
        case 'checkbox': {
            const siblings = e.parentElement?.parentElement?.querySelectorAll(`[ref="${e.getAttribute(DEFAULT_KEY_FIELDNAME)}"]`) || []
            if (siblings.length === 1) { value = e.checked; break }
            value = Array.from(siblings).filter((s: any) => s.checked).map((s: any) => s.value)
            break
        }
        case 'radio': {
            const siblings = e.parentElement?.parentElement?.querySelectorAll(`[ref="${e.getAttribute(DEFAULT_KEY_FIELDNAME)}"]`) || []
            value = (Array.from(siblings).find((s: any) => s.checked) as HTMLInputElement)?.value
            break
        }
        default: value = e.value
    }
    if (e.getAttribute('type') === 'number') value = Number(value)
    if (e.hasAttribute('validator')) {
        const customValidator = e.getAttribute('validator')
        if (customValidator) {
            try {
                const f = eval(customValidator.toString())
                if (!f(value, context)) return Invalid
            } catch (err) { console.error(`Field ${e.getAttribute(DEFAULT_KEY_FIELDNAME)} invalid validator`, err) }
        }
    }
    return e.checkValidity() ? value : Invalid
}

const Invalid = Symbol('Invalid')
function getMultiSelect(e: any) { return Array.from(e.options).filter((option: any) => option.selected).map((option: any) => option.value) }

export function collectValues(node: HTMLElement, context?: any, keyFieldName = DEFAULT_KEY_FIELDNAME): { [ref: string]: any } {
    const nodes = refNodes(node, keyFieldName)
    const result: any = { _errors: {} }
    for (let [ref, n] of Object.entries(nodes)) {
        const value = normalizeValue(n as HTMLInputElement, context)
        if (value === Invalid) result._errors[ref] = { node: n, value: (n as HTMLInputElement).value }
        setUsingDotReference(result, ref, value)
    }
    if (Object.keys(result._errors).length === 0) delete result._errors
    return result
}

function refNodes(node: HTMLElement, keyFieldName = DEFAULT_KEY_FIELDNAME): { [ref: string]: HTMLElement } {
    const nodes = Array.from(node.querySelectorAll(`[${keyFieldName}]`))
    const result: any = {}
    nodes.forEach((n: any) => { result[n.getAttribute(keyFieldName)] = n })
    return result
}

export function getFieldAndValue(event: Event | HTMLElement, context?: any, keyFieldName = DEFAULT_KEY_FIELDNAME): { field: string, value: any } {
    const node = event instanceof HTMLElement ? event : event.target as HTMLInputElement
    const field = node.getAttribute(keyFieldName) as string
    return { field, value: normalizeValue(node as HTMLInputElement, context) }
}

export function populateField(node: HTMLInputElement, value: any, error?: any) {
    const errorMsgNode = node.parentElement?.querySelector('.error-message') as HTMLElement
    if (error) {
        node.classList.add('is-invalid')
        if (errorMsgNode) { errorMsgNode.textContent = 'Invalid value'; errorMsgNode.style.display = 'block' }
    } else {
        node.classList.remove('is-invalid')
        if (errorMsgNode) errorMsgNode.style.display = 'none'
    }
    switch (node.type) {
        case 'checkbox': {
            const siblings = node.parentElement?.parentElement?.querySelectorAll(`[ref="${node.getAttribute(DEFAULT_KEY_FIELDNAME)}"]`) || []
            if (siblings.length === 1) { node.checked = !!value; break }
            node.checked = (value as string[] || []).includes(node.value)
            break
        }
        case 'radio': { node.checked = node.value == value; break }
        case 'select-multiple': {
            const values = value as string[] || []
            Array.from((node as any).options).forEach((option: any) => { option.selected = values.includes(option.value) })
            break
        }
        default: node.value = value || ''
    }
}

export function populateFields(baseNode: HTMLElement, values: { [ref: string]: any }) {
    const fieldMap = refNodes(baseNode)
    const errors = values?._errors || {}
    for (let [ref, node] of Object.entries(fieldMap)) {
        let value: any = readUsingDotReference(values, ref)
        const error = readUsingDotReference(errors, ref)
        if (value instanceof Date) value = value.toISOString()
        if (value !== undefined && typeof value === 'object' && !Array.isArray(value) && value !== null) continue
        populateField(node as HTMLInputElement, value, error)
    }
}

export function setUsingDotReference(object: { [f: string]: any }, fieldRef: string, value: any) {
    const parts = fieldRef.split(".")
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (i === parts.length - 1) object[part] = value
        else { if (!object[part]) object[part] = {}; object = object[part] }
    }
    return object
}

export function readUsingDotReference(object: { [f: string]: any }, fieldRef: string) {
    if (!object || !fieldRef) return undefined
    return fieldRef.split(".").reduce((a, c) => (a && a[c] !== undefined) ? a[c] : undefined, object)
}

export function disable(baseNode: HTMLElement, disable: boolean, fields?: string[] | null, subfield?: string, keyFieldName = DEFAULT_KEY_FIELDNAME) {
    const nodes = baseNode.querySelectorAll(`[${keyFieldName}]`)
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        if (fields) {
            const r = n.getAttribute(keyFieldName) as string
            if (!fields.includes(r) || subfield && subfield != n.getAttribute('value')) continue
        }
        disable ? n.setAttribute('disabled', '') : n.removeAttribute('disabled')
    }
}

export class AutoForm {
    textTranslator = (s: string) => s
    readonly form: HTMLFormElement
    groups: GroupMetaData = {}

    constructor(public metaData: FormMetaData = {}) {
        this.form = ce('form', 'autoform') as HTMLFormElement
    }

    render(data: any, root?: HTMLElement): HTMLFormElement {
        this.renderFields(this.form, data)
        root?.appendChild(this.form)
        return this.form
    }

    protected renderFields(container: HTMLElement, data: any, parents: string[] = []) {
        for (let [fieldName, value] of Object.entries(data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents) as any
            if (fmd.componentType === 'object') { this.renderFields(container, value, parents.concat(fieldName)); continue }
            const newNode = this.renderField(fieldName, fmd, value, parents)
            const groupName = fmd.group || (this instanceof Wizard ? 'default' : null)
            let targetNode = container
            if (groupName) {
                let groupContainer = container.querySelector(`[data-group="${groupName}"]`) as HTMLElement
                if (!groupContainer) {
                    const gmd = this.groups[groupName] || {}
                    groupContainer = ce('div', 'field-group')
                    groupContainer.setAttribute('data-group', groupName)
                    if (this instanceof Wizard) {
                        groupContainer.classList.add('wizard-page')
                        groupContainer.style.display = 'none'
                    }
                    if (gmd.label || (groupName === 'default' && !gmd.label)) {
                        const label = ce('div', 'group-label')
                        label.textContent = this.textTranslator(gmd.label || 'Other Details')
                        groupContainer.appendChild(label)
                    }
                    if (gmd.text) {
                        const text = ce('p', 'group-text')
                        text.textContent = this.textTranslator(gmd.text)
                        groupContainer.appendChild(text)
                    }
                    container.appendChild(groupContainer)
                }
                targetNode = groupContainer
            }
            targetNode.appendChild(newNode)
        }
    }

    protected getFieldMetaData(fieldName: string, value: any, parents: string[]): FieldMetaData {
        const fullPath = [...parents, fieldName].join('.')
        const fmt = this.metaData[fullPath] || {}
        const autoFmd: FieldMetaData = { label: this.textTranslator(fieldName), componentType: 'input' }
        if (Array.isArray(value)) {
            if (typeof (value[0]) === 'object') autoFmd.componentType = 'table'
            else if (['string', 'number'].includes(typeof (value[0]))) {
                autoFmd.componentType = 'select'; autoFmd.options = value; autoFmd.attributes = { multiple: 'multiple' }
            }
        } else if (typeof value === 'object' && value !== null) {
            if (value instanceof Date) autoFmd.componentType = 'date'
            else { autoFmd.componentType = 'object'; autoFmd.nested = value }
        } else this.guessType(autoFmd, value)
        return { ...autoFmd, ...fmt }
    }

    protected renderField(fieldName: string, fmt: FieldMetaData, value: any, parents: string[]): HTMLElement {
        let node: HTMLElement
        const setRef = (n: HTMLElement) => n.setAttribute('ref', [...parents, fieldName].join('.'))
        switch (fmt.componentType) {
            case 'select':
                node = ce('select'); setRef(node)
                // @ts-ignore
                fmt.options?.forEach((o: any) => {
                    const opt = ce('option') as HTMLOptionElement; node.appendChild(opt)
                    opt.innerText = this.textTranslator(o.text || o); opt.setAttribute('value', o.value || o)
                }); break
            case 'checkbox':
                if (fmt.options) {
                    node = ce('span')
                    // @ts-ignore
                    fmt.options.forEach((o: any) => {
                        const opt = cie('checkbox', fieldName, o.value || o); node.appendChild(opt); setRef(opt)
                        node.appendChild(ce('span')).innerText = this.textTranslator(o.text || o)
                    })
                } else { node = cie('checkbox'); setRef(node) }; break
            case 'radio':
                node = ce('span', 'radio-button-set')
                // @ts-ignore
                fmt.options?.forEach((o: any) => {
                    const opt = cie('radio', fieldName, o.value || o); setRef(opt); node.appendChild(opt)
                    const text = ce('span'); node.appendChild(text); text.innerText = this.textTranslator(o.text || o)
                }) || (node = cie('radio', fieldName), setRef(node)); break
            case 'textarea': node = ce('textarea'); setRef(node); break
            case 'date': node = cie('date'); setRef(node); break
            default: node = cie(fmt.componentType === 'number' ? 'number' : 'text'); setRef(node)
        }
        // @ts-ignore
        Object.entries(fmt.attributes || {}).forEach(([k, v]) => node.setAttribute(k, v))
        // @ts-ignore
        const [block, label] = CE('div', ce('label'), node, ce('span', 'error-message'))
        // @ts-ignore
        label.textContent = fmt.label
        return block
    }

    private guessType(fmt: any, value: any) {
        if (typeof value === 'boolean') fmt.componentType = 'checkbox'
        else if (typeof value === 'number') { fmt.componentType = 'input'; fmt.attributes = { type: 'number' } }
        else if (typeof value === 'string') fmt.componentType = (value.length > 40 || value.includes('\n')) ? 'textarea' : 'input'
    }
}

export class Wizard extends AutoForm {
    onPageChange?: (step: { newIndex: number, oldIndex: number, total: number }) => void
    private currentStepIndex: number = 0

    render(data: any, root?: HTMLElement): HTMLFormElement {
        this.form.classList.add('wizard-mode')
        Object.keys(this.groups).forEach((name, i) => {
            const g = this.groups[name]
            const p = ce('div', 'field-group wizard-page')
            p.id = `wizard-page-${i}`; p.style.display = 'none'; p.setAttribute('data-group', name)
            if (g.label) { const l = ce('div', 'group-label'); l.textContent = this.textTranslator(g.label); p.appendChild(l) }
            if (g.text) { const t = ce('p', 'group-text'); t.textContent = this.textTranslator(g.text); p.appendChild(t) }
            this.form.appendChild(p)
        })
        this.renderFields(this.form, data)
        this.goTo(0)
        root?.appendChild(this.form)
        return this.form
    }

    next() {
        const pages = Array.from(this.form.querySelectorAll('.wizard-page')) as HTMLElement[]
        const cur = pages[this.currentStepIndex]
        if (cur && Object.keys(collectValues(cur)._errors || {}).length > 0) { populateFields(cur, collectValues(cur)); return }
        this.goTo(this.currentStepIndex + 1)
    }
    prev() { this.goTo(this.currentStepIndex - 1) }
    goTo(step: number | string) {
        const pages = Array.from(this.form.querySelectorAll('.wizard-page')) as HTMLElement[]
        let idx = typeof step === 'number' ? step : pages.indexOf(this.form.querySelector(`[data-group="${step}"]`) as any)
        if (idx < 0 || idx >= pages.length) return
        pages[this.currentStepIndex].style.display = 'none'
        pages[idx].style.display = 'block'
        const old = this.currentStepIndex; this.currentStepIndex = idx
        if (this.onPageChange) this.onPageChange({ newIndex: idx, oldIndex: old, total: pages.length })
    }
}

export type FormMetaData = { [fieldName: string]: FieldMetaData }
export type GroupMetaData = { [groupName: string]: { label?: string, class?: string, text?: string } }
export type FieldMetaData = FormMetaData | {
    label: string; validator?: (value: any) => boolean; tooltip?: string; helpText?: string; group?: string;
    componentType: 'table' | 'textarea' | 'checkbox' | 'date' | 'number' | 'radio' | 'input' | 'select' | 'object';
    attributes?: { [name: string]: string }; defaultValue?: any; nested?: any[] | object; options?: { text: string, value: string }[] | string; dependency?: string
}

function cie(type = 'text', name?: string, value?: string) {
    const el = document.createElement('input'); el.setAttribute('type', type)
    if (name) el.setAttribute('name', name); if (value) el.setAttribute('value', value); return el
}
function ce(e: string, className?: string) { const el = document.createElement(e); if (className) el.className = className; return el }
function CE(type: string, ...children: (HTMLElement | undefined | null)[]): HTMLElement[] {
    const e = ce(type); children.forEach(c => { if (c) e.appendChild(c) }); return [e, ...children as HTMLElement[]]
}
