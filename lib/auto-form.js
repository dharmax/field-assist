export class AutoForm {
    constructor(data, metaData = {}) {
        this.data = data;
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

    render(root) {
        this.renderFields(this.form);
        root?.appendChild(this.form);
        return this.form;
    }

    renderFields(node, parents = []) {
        for (let [fieldName, value] of Object.entries(this.data)) {
            const fmd = this.getFieldMetaData(fieldName, value, parents);
            const newNode = this.renderField(fieldName, fmd, value);
            node.appendChild(newNode);
        }
    }

    getFieldMetaData(fieldName, value, parents) {
        const self = this;
        return findFMD(this.metaData, parents) || createFMD();

        function findFMD(meta, parentsList) {
            if (!parentsList.length)
                return meta[fieldName];
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
                    fmt.nested = value;
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

    renderField(fieldName, fmt, value) {
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
                block.appendChild(node);
                break;
            case 'date':
                node = ce('input');
                node.setAttribute('ref', fieldName);
                node.setAttribute('type', 'date');
                block.appendChild(node);
                break;
            case 'table':
                node = ce('span');
                node.innerText = 'unimplemented';
                // TODO
                block.appendChild(node);
                break;
            case 'select':
                node = ce('select');
                node.setAttribute('ref', fieldName);
                block.appendChild(node);
                // @ts-ignore
                fmt.options.forEach((o) => {
                    const option = ce('option');
                    node.appendChild(option);
                    option.innerText = this.textTranslator(o.text || o);
                    option.setAttribute('value', o.value || o);
                });
                break;
            case 'checkbox':
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o) => {
                        const option = ce('input');
                        node.setAttribute('type', 'checkbox');
                        node.appendChild(option);
                        option.innerText = this.textTranslator(o.text || o);
                        option.setAttribute('value', o.value || o);
                        node.setAttribute('ref', fieldName);
                        node.setAttribute('name', fieldName);
                        block.appendChild(node);
                    });
                } else {
                    node = ce('input');
                    node.setAttribute('type', 'checkbox');
                    node.setAttribute('ref', fieldName);
                    block.appendChild(node);
                }
                break;
            case 'radio':
                if (fmt.options) {
                    // @ts-ignore
                    fmt.options.forEach((o) => {
                        const option = ce('input');
                        node.setAttribute('type', 'radio');
                        node.appendChild(option);
                        option.innerText = this.textTranslator(o.text || o);
                        option.setAttribute('value', o.value || o);
                        block.appendChild(node);
                    });
                } else {
                    node = ce('input');
                    node.setAttribute('type', 'checkbox');
                    block.appendChild(node);
                }
                break;
            case 'textarea':
                node = ce('textarea');
                block.appendChild(node);
                break;
            case 'object':
            default:
                node = ce('input');
                block.appendChild(node);
        }
        // @ts-ignore
        node && Object.entries(fmt.attributes || {}).forEach(([k, v]) => node.setAttribute(k, v));
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
