const DEFAULT_KEY_FIELDNAME = 'ref';
function normalizeValue(e, context, root) {
    let value;
    const ref = e.getAttribute(DEFAULT_KEY_FIELDNAME);
    switch (e.type) {
        case 'select-multiple':
            value = getMultiSelect(e);
            break;
        case 'checkbox': {
            const siblings = Array.from(root.querySelectorAll(`[${DEFAULT_KEY_FIELDNAME}="${ref}"]`));
            if (siblings.length === 1) {
                value = e.checked;
                break;
            }
            value = siblings.filter((s) => s.checked).map((s) => s.value);
            break;
        }
        case 'radio': {
            const siblings = Array.from(root.querySelectorAll(`[${DEFAULT_KEY_FIELDNAME}="${ref}"]`));
            value = siblings.find((s) => s.checked)?.value;
            break;
        }
        default: value = e.value;
    }
    if (e.getAttribute('type') === 'number')
        value = Number(value);
    if (e.hasAttribute('validator')) {
        const customValidator = e.getAttribute('validator');
        if (customValidator) {
            try {
                const f = eval(customValidator.toString());
                if (!f(value, context))
                    return Invalid;
            }
            catch (err) {
                console.error(`Field ${ref} invalid validator`, err);
            }
        }
    }
    return e.checkValidity() ? value : Invalid;
}
const Invalid = Symbol('Invalid');
function getMultiSelect(e) { return Array.from(e.options).filter((option) => option.selected).map((option) => option.value); }
export function collectValues(node, context, keyFieldName = DEFAULT_KEY_FIELDNAME) {
    const nodes = Array.from(node.querySelectorAll(`[${keyFieldName}]`));
    const result = { _errors: {} };
    const seen = new Set();
    nodes.forEach((n) => {
        const ref = n.getAttribute(keyFieldName);
        if (seen.has(ref))
            return;
        const value = normalizeValue(n, context, node);
        if (value === Invalid)
            result._errors[ref] = { node: n, value: n.value };
        setUsingDotReference(result, ref, value);
        seen.add(ref);
    });
    if (Object.keys(result._errors).length === 0)
        delete result._errors;
    return result;
}
export function getFieldAndValue(event, context, keyFieldName = DEFAULT_KEY_FIELDNAME) {
    const node = event instanceof HTMLElement ? event : event.target;
    const root = node.closest('.autoform, form, section, body') || document.body;
    const field = node.getAttribute(keyFieldName);
    return { field, value: normalizeValue(node, context, root) };
}
export function populateField(node, value, error) {
    const errorMsgNode = node.parentElement?.querySelector('.error-message') ||
        node.parentElement?.parentElement?.querySelector('.error-message');
    if (error) {
        node.classList.add('is-invalid');
        if (errorMsgNode) {
            errorMsgNode.textContent = 'Invalid value';
            errorMsgNode.style.display = 'block';
        }
    }
    else {
        node.classList.remove('is-invalid');
        if (errorMsgNode)
            errorMsgNode.style.display = 'none';
    }
    switch (node.type) {
        case 'checkbox': {
            if (Array.isArray(value))
                node.checked = value.includes(node.value);
            else
                node.checked = !!value;
            break;
        }
        case 'radio': {
            node.checked = node.value == value;
            break;
        }
        case 'select-multiple': {
            const values = value || [];
            Array.from(node.options).forEach((option) => {
                option.selected = values.includes(option.value);
            });
            break;
        }
        default: node.value = value || '';
    }
}
export function populateFields(baseNode, values) {
    const nodes = Array.from(baseNode.querySelectorAll(`[${DEFAULT_KEY_FIELDNAME}]`));
    const errors = values?._errors || {};
    nodes.forEach((node) => {
        const ref = node.getAttribute(DEFAULT_KEY_FIELDNAME);
        let value = readUsingDotReference(values, ref);
        const error = readUsingDotReference(errors, ref);
        if (value instanceof Date)
            value = value.toISOString().split('T')[0];
        if (value !== undefined && typeof value === 'object' && !Array.isArray(value) && value !== null)
            return;
        populateField(node, value, error);
    });
}
export function setUsingDotReference(object, fieldRef, value) {
    const parts = fieldRef.split(".");
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1)
            object[part] = value;
        else {
            if (!object[part])
                object[part] = {};
            object = object[part];
        }
    }
    return object;
}
export function readUsingDotReference(object, fieldRef) {
    if (!object || !fieldRef)
        return undefined;
    return fieldRef.split(".").reduce((a, c) => (a && a[c] !== undefined) ? a[c] : undefined, object);
}
export function disable(baseNode, disable, fields, subfield, keyFieldName = DEFAULT_KEY_FIELDNAME) {
    const nodes = baseNode.querySelectorAll(`[${keyFieldName}]`);
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (fields) {
            const r = n.getAttribute(keyFieldName);
            if (!fields.includes(r) || subfield && subfield != n.getAttribute('value'))
                continue;
        }
        disable ? n.setAttribute('disabled', '') : n.removeAttribute('disabled');
    }
}
export class AutoForm {
    metaData;
    textTranslator = (s) => s;
    form;
    groups = {};
    constructor(metaData = {}) {
        this.metaData = metaData;
        this.form = ce('form', 'autoform');
    }
    render(data, root) {
        this.renderFields(this.form, data);
        root?.appendChild(this.form);
        return this.form;
    }
    renderFields(container, data, parents = []) {
        for (let [fieldName, value] of Object.entries(data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents);
            if (fmd.componentType === 'object') {
                this.renderFields(container, value, parents.concat(fieldName));
                continue;
            }
            const newNode = this.renderField(fieldName, fmd, value, parents);
            const groupName = fmd.group || (this instanceof Wizard ? 'default' : null);
            let targetNode = container;
            if (groupName) {
                let groupContainer = container.querySelector(`[data-group="${groupName}"]`);
                if (!groupContainer) {
                    const gmd = this.groups[groupName] || {};
                    groupContainer = ce('div', 'field-group');
                    groupContainer.setAttribute('data-group', groupName);
                    if (this instanceof Wizard)
                        groupContainer.style.display = 'none';
                    if (gmd.label || (groupName === 'default' && !gmd.label)) {
                        const label = ce('div', 'group-label');
                        label.textContent = this.textTranslator(gmd.label || 'Other Details');
                        groupContainer.appendChild(label);
                    }
                    if (gmd.text) {
                        const text = ce('p', 'group-text');
                        text.textContent = this.textTranslator(gmd.text);
                        groupContainer.appendChild(text);
                    }
                    container.appendChild(groupContainer);
                }
                targetNode = groupContainer;
            }
            targetNode.appendChild(newNode);
        }
    }
    getFieldMetaData(fieldName, value, parents) {
        const fullPath = [...parents, fieldName].join('.');
        const fmt = this.metaData[fullPath] || {};
        const autoFmd = { label: this.textTranslator(fieldName), componentType: 'input' };
        if (Array.isArray(value)) {
            if (typeof (value[0]) === 'object')
                autoFmd.componentType = 'table';
            else if (['string', 'number'].includes(typeof (value[0]))) {
                autoFmd.componentType = 'select';
                autoFmd.options = value;
                autoFmd.attributes = { multiple: 'multiple' };
            }
        }
        else if (typeof value === 'object' && value !== null) {
            if (value instanceof Date)
                autoFmd.componentType = 'date';
            else {
                autoFmd.componentType = 'object';
                autoFmd.nested = value;
            }
        }
        else
            this.guessType(autoFmd, value);
        return { ...autoFmd, ...fmt };
    }
    renderField(fieldName, fmt, value, parents) {
        let node;
        const setRef = (n) => n.setAttribute('ref', [...parents, fieldName].join('.'));
        switch (fmt.componentType) {
            case 'select':
                node = ce('select');
                setRef(node);
                // @ts-ignore
                fmt.options?.forEach((o) => {
                    const opt = ce('option');
                    node.appendChild(opt);
                    opt.innerText = this.textTranslator(o.text || o);
                    opt.setAttribute('value', o.value || o);
                });
                break;
            case 'checkbox':
                if (fmt.options) {
                    node = ce('span', 'checkbox-group');
                    // @ts-ignore
                    fmt.options.forEach((o) => {
                        const opt = cie('checkbox', fieldName, o.value || o);
                        node.appendChild(opt);
                        setRef(opt);
                        node.appendChild(ce('span')).innerText = this.textTranslator(o.text || o);
                    });
                }
                else {
                    node = cie('checkbox');
                    setRef(node);
                }
                ;
                break;
            case 'radio':
                node = ce('span', 'radio-button-set');
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o) => {
                        const opt = cie('radio', fieldName, o.value || o);
                        setRef(opt);
                        const lbl = ce('label');
                        lbl.appendChild(opt);
                        lbl.appendChild(ce('span')).innerText = this.textTranslator(o.text || o);
                        node.appendChild(lbl);
                    });
                }
                else {
                    node = cie('radio', fieldName);
                    setRef(node);
                }
                ;
                break;
            case 'textarea':
                node = ce('textarea');
                setRef(node);
                break;
            case 'date':
                node = cie('date');
                setRef(node);
                break;
            default:
                node = cie(fmt.componentType === 'number' ? 'number' : 'text');
                setRef(node);
        }
        // @ts-ignore
        Object.entries(fmt.attributes || {}).forEach(([k, v]) => node.setAttribute(k, v));
        // @ts-ignore
        const [block, label] = CE('div', ce('label'), node, ce('span', 'error-message'));
        // @ts-ignore
        label.textContent = fmt.label;
        return block;
    }
    guessType(fmt, value) {
        if (typeof value === 'boolean')
            fmt.componentType = 'checkbox';
        else if (typeof value === 'number') {
            fmt.componentType = 'input';
            fmt.attributes = { type: 'number' };
        }
        else if (typeof value === 'string')
            fmt.componentType = (value.length > 40 || value.includes('\n')) ? 'textarea' : 'input';
    }
}
export class Wizard extends AutoForm {
    onPageChange;
    onDone;
    currentStepIndex = 0;
    render(data, root) {
        this.form.classList.add('wizard-mode');
        Object.keys(this.groups).forEach((name, i) => {
            const g = this.groups[name];
            const p = ce('div', 'field-group wizard-page');
            p.id = `wizard-page-${i}`;
            p.style.display = 'none';
            p.setAttribute('data-group', name);
            if (g.label) {
                const l = ce('div', 'group-label');
                l.textContent = this.textTranslator(g.label);
                p.appendChild(l);
            }
            if (g.text) {
                const t = ce('p', 'group-text');
                t.textContent = this.textTranslator(g.text);
                p.appendChild(t);
            }
            this.form.appendChild(p);
        });
        this.renderFields(this.form, data);
        this.goTo(0);
        root?.appendChild(this.form);
        return this.form;
    }
    next() {
        const pages = Array.from(this.form.querySelectorAll('.field-group'));
        const cur = pages[this.currentStepIndex];
        if (cur && Object.keys(collectValues(cur)._errors || {}).length > 0) {
            populateFields(cur, collectValues(cur));
            return;
        }
        if (this.currentStepIndex === pages.length - 1) {
            if (this.onDone)
                this.onDone(collectValues(this.form));
            return;
        }
        this.goTo(this.currentStepIndex + 1);
    }
    prev() { this.goTo(this.currentStepIndex - 1); }
    goTo(step) {
        const pages = Array.from(this.form.querySelectorAll('.field-group'));
        let idx = typeof step === 'number' ? step : pages.indexOf(this.form.querySelector(`[data-group="${step}"]`));
        if (idx < 0 || idx >= pages.length)
            return;
        if (pages[this.currentStepIndex])
            pages[this.currentStepIndex].style.display = 'none';
        pages[idx].style.display = 'block';
        const old = this.currentStepIndex;
        this.currentStepIndex = idx;
        if (this.onPageChange)
            this.onPageChange({ newIndex: idx, oldIndex: old, total: pages.length });
    }
}
function cie(type = 'text', name, value) {
    const el = document.createElement('input');
    el.setAttribute('type', type);
    if (name)
        el.setAttribute('name', name);
    if (value)
        el.setAttribute('value', value);
    return el;
}
function ce(e, className) { const el = document.createElement(e); if (className)
    el.className = className; return el; }
function CE(type, ...children) {
    const e = ce(type);
    children.forEach(c => { if (c)
        e.appendChild(c); });
    return [e, ...children];
}
