export class AutoForm {
    constructor(metaData = {}) {
        this.metaData = metaData;
        /**
         * change this for supporting translation of labels
         * @param s
         */
        this.textTranslator = (s) => s;
        const form = document.createElement('form');
        form.className = 'autoform';
        this.form = form;
    }

    render(data, root) {
        this.renderFields(this.form, data);
        root?.appendChild(this.form);
        return this.form;
    }

    renderFields(node, data, parents = []) {
        for (let [fieldName, value] of Object.entries(data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents);
            const newNode = this.renderField(fieldName, fmd, value, parents);
            node.appendChild(newNode);
        }
    }

    getFieldMetaData(fieldName, value, parents) {
        const self = this;
        return findFMD(this.metaData, parents) || createFMD();

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
        const block = ce('div');
        const label = ce('label');
        block.appendChild(label);
        // @ts-ignore
        label.textContent = fmt.label;
        switch (fmt.componentType) {
            case 'input':
                node = ce('input');
                node.setAttribute('ref', fieldName);
                break;
            case 'date':
                node = ce('input');
                node.setAttribute('ref', fieldName);
                node.setAttribute('type', 'date');
                break;
            case 'table': {
                node = ce('span');
                const header = ce('h' + parents.length + 1);
                // @ts-ignore
                header.innerText = this.textTranslator(fmt.label);
                node.innerText = 'unimplemented';
                // TODO
                break;
            }
            case 'select':
                node = ce('select');
                node.setAttribute('ref', fieldName);
                // @ts-ignore
                fmt.options.forEach((o) => {
                    const option = ce('option');
                    node.appendChild(option);
                    option.innerText = this.textTranslator(o.text || o);
                    option.setAttribute('value', o.value || o);
                });
                break;
            case 'checkbox':
                node = ce('span');
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o) => {
                        const option = ce('input');
                        option.setAttribute('type', 'checkbox');
                        node.appendChild(option);
                        option.innerText = this.textTranslator(o.text || o);
                        option.setAttribute('value', o.value || o);
                        node.setAttribute('ref', fieldName);
                    });
                } else {
                    node = ce('input');
                    node.setAttribute('type', 'checkbox');
                    node.setAttribute('ref', fieldName);
                }
                break;
            case 'radio':
                node = ce('span');
                // @ts-ignore
                node.className = 'radio-button-set';
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o) => {
                        const option = ce('input');
                        option.setAttribute('type', 'radio');
                        option.setAttribute('name', fieldName);
                        node.appendChild(option);
                        const text = ce('span');
                        node.appendChild(text);
                        text.innerText = this.textTranslator(o.text || o);
                        option.setAttribute('value', o.value || o);
                    });
                } else {
                    node = ce('input');
                    node.setAttribute('type', 'checkbox');
                }
                break;
            case 'textarea':
                node = ce('textarea');
                break;
            case 'object':
                node = ce('div');
                // @ts-ignore
                node.className = 'nested';
                const header = ce('h' + parents.length + 1);
                // @ts-ignore
                header.innerText = this.textTranslator(fmt.label);
                this.renderFields(node, value, parents.concat(fieldName));
                break;
            default:
                node = ce('input');
        }
        // @ts-ignore
        Object.entries(fmt.attributes || {}).forEach(([k, v]) => node.setAttribute(k, v));
        block.appendChild(node);
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
function ce(e) {
    return document.createElement(e);
}
