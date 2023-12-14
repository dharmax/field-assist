/**
 * This class generate forms out of raw data and optional meta-data.
 * It supports automatic translation (of labels and display values).
 * It generates raw DOM elements without styling, so it is your responsibility to style it (which is very easy).
 *
 */
export class AutoForm {
    metaData;
    /**
     * change this for supporting translation of labels
     * @param s
     */
    textTranslator = (s) => s;
    /**
     * The generated form.
     */
    form;
    /**
     * You can provide the metadata right in the constructor or anytime before rendering
     * @param metaData the metadata
     * @see FormMetaData
     */
    constructor(metaData = {}) {
        this.metaData = metaData;
        const form = ce('form');
        form.className = 'autoform';
        this.form = form;
    }
    /**
     * This method does the DOM element creation
     * @param data the data by which to "guess" the form
     * @param root optionally, you can tell it to render right into that element
     * @return the generated form
     */
    render(data, root) {
        this.renderFields(this.form, data);
        root?.appendChild(this.form);
        return this.form;
    }
    renderFields(node, data, parents = []) {
        console.log(parents);
        for (let [fieldName, value] of Object.entries(data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents);
            const newNode = this.renderField(fieldName, fmd, value, parents);
            node.appendChild(newNode);
        }
    }
    getFieldMetaData(fieldName, value, _parents) {
        const self = this;
        const autoFmd = createFMD();
        const parents = _parents.concat();
        const fmt = findFMD(this.metaData, parents);
        return fmt ? {...autoFmd, ...fmt} : autoFmd;
        function findFMD(meta, parentsList) {
            if (!parentsList.length)
                return meta?.[fieldName];
            // if we're here, it means it's a nested object/form
            const p = parents.shift();
            return findFMD(meta[p], parents);
        }
        function createFMD() {
            const fmt = {
                label: self.textTranslator(fieldName),
                componentType: 'input',
                tooltip: '',
                helpText: ''
            };
            if (Array.isArray(value)) {
                if (typeof (value[0]) === 'object') {
                    fmt.componentType = 'table';
                    return fmt;
                } else if (['string', 'number'].includes(typeof (value[0]))) {
                    fmt.componentType = 'select';
                    fmt.options = value;
                    fmt.attributes = {multiple: 'multiple'};
                    return fmt;
                } else {
                    // arrays of other types aren't handled
                }
            }
            if (typeof value === 'object') {
                if (value instanceof Date) {
                    fmt.componentType = 'date';
                    return fmt;
                } else {
                    fmt.componentType = 'object';
                    fmt.nested = value;
                    return fmt;
                }
            }
            // primitive type
            self.guessType(fmt, value);
            return fmt;
        }
    }
    renderField(fieldName, fmt, value, parents) {
        let node;
        const setRef = (n) => n.setAttribute('ref', [...parents, fieldName].join('.'));
        switch (fmt.componentType) {
            case 'input': {
                node = cie();
                setRef(node);
                break;
            }
            case 'date': {
                node = cie('date');
                setRef(node);
                break;
            }
            case 'select': {
                node = ce('select');
                setRef(node); // @ts-ignore
                fmt.options.forEach((o) => {
                    const option = ce('option');
                    node.appendChild(option);
                    option.innerText = this.textTranslator(o.text || o);
                    option.setAttribute('value', o.value || o);
                });
                break;
            }
            case 'checkbox': {
                if (fmt.options) {
                    node = ce('span');
                    // @ts-ignore
                    fmt.options.forEach((o) => {
                        const option = cie('checkbox', fieldName, o.value || o);
                        node.appendChild(option);
                        setRef(option);
                        node.appendChild(ce('span')).innerText = this.textTranslator(o.text || o);
                    });
                } else {
                    const node = cie('checkbox');
                    setRef(node);
                }
                break;
            }
            case 'radio': {
                node = ce('span');
                // @ts-ignore
                node.className = 'radio-button-set';
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o) => {
                        const option = cie('radio', fieldName, o.value || o);
                        setRef(option);
                        node.appendChild(option);
                        const text = ce('span');
                        node.appendChild(text);
                        text.innerText = this.textTranslator(o.text || o);
                    });
                } else {
                    node = cie('checkbox');
                }
                break;
            }
            case 'textarea': {
                node = ce('textarea');
                setRef(node);
                break;
            }
            case 'object': {
                node = ce('div');
                // @ts-ignore
                node.className = 'nested';
                const header = ce('h' + parents.length + 1);
                // @ts-ignore
                header.innerText = this.textTranslator(fmt.label);
                this.renderFields(node, value, parents.concat(fieldName));
                break;
            }
            default:
                node = ce('input');
        }
        // @ts-ignore
        Object.entries(fmt.attributes || {}).forEach(([k, v]) => node.setAttribute(k, v));
        // @ts-ignore
        const [block, label] = CE('div', ce('label'), node);
        // @ts-ignore
        label.textContent = fmt.label;
        return block;
    }
    guessType(fmt, value) {
        switch (typeof value) {
            case 'boolean':
                fmt.componentType = 'checkbox';
                break;
            case 'number':
                fmt.componentType = 'input';
                fmt.attributes = {type: 'number'};
                break;
            case 'string':
                fmt.componentType = (value.length > 40 || value.includes('\n')) ? 'textarea' : 'input';
                break;
            case 'undefined':
            default:
                fmt.componentType = 'input';
                break;
        }
    }
}
function cie(type = 'text', name, value) {
    const el = document.createElement('input');
    el.setAttribute('type', type);
    value && el.setAttribute('value', value);
    return el;
}
function ce(e, className) {
    const el = document.createElement(e);
    className && (el.className = className);
    return el;
}
function CE(type, ...children) {
    const e = ce(type);
    children.forEach(c => e.appendChild(c));
    return [e, ...children];
}
