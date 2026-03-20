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
export declare function collectValues(node: Element, context?: any, keyFieldName?: string): {
    [k: string]: any;
};
/**
 *
 * @param node start search node
 * @param keyFieldName optional alternative reference field name
 * @return array of elements that have the "ref" attribute
 */
export declare function refs(node: Element, keyFieldName?: string): HTMLInputElement[];
/**
 * @return elements map by the ref name
 * @param node
 * @param keyFieldName optional alternative reference field name
 */
export declare function refNodes(node: Element, keyFieldName?: string): {
    [ref: string]: HTMLInputElement;
};
/**
 * Utility method that let you get the field name and value of the input field that is associated with an event
 * @param event the event
 * @param context optional context for the collectValue inner call
 * @param keyFieldName optional alternative to the "ref" attribute name
 */
export declare function getFieldAndValue(event: Event | HTMLElement, context?: any, keyFieldName?: string): {
    field: string;
    value: any;
};
/**
 * Populate a single field in a normalized way
 * @param node the field's node
 * @param value the value
 * @param error optional error object
 */
export declare function populateField(node: HTMLInputElement, value: any, error?: any): void;
/**
 * Populate a whole form from a map of field names and values
 * @param baseNode the base of the form (doesn't have to be a Form element)
 * @param values the values
 */
export declare function populateFields(baseNode: HTMLElement, values: {
    [ref: string]: any;
}): void;
export declare const Invalid: unique symbol;
export declare function setUsingDotReference(object: {
    [f: string]: any;
}, fieldRef: string, value: any): {
    [f: string]: any;
};
export declare function readUsingDotReference(object: {
    [f: string]: any;
}, fieldRef: string): {
    [f: string]: any;
} | undefined;
/**
 * disable or enable all or part of the fields
 * @param baseNode
 * @param disable
 * @param fields null means all, otherwise an array of field name is expected
 * @param subfield lets you specify specific cases in a multiple options inputs
 * @param keyFieldName
 */
export declare function disable(baseNode: HTMLElement, disable?: boolean, fields?: string[], subfield?: string, keyFieldName?: string): void;
/**
 * This class generate forms out of raw data and optional meta-data.
 * It supports automatic translation (of labels and display values).
 * It generates raw DOM elements without styling, so it is your responsibility to style it (which is very easy).
 *
 */
export declare class AutoForm {
    metaData: FormMetaData;
    /**
     * change this for supporting translation of labels
     * @param s
     */
    textTranslator: (s: string) => string;
    /**
     * The generated form.
     */
    readonly form: HTMLFormElement;
    /**
     * Group definitions
     */
    groups: GroupMetaData;
    /**
     * Wizard mode flag
     */
    wizard: boolean;
    private currentStepIndex;
    /**
     * You can provide the metadata right in the constructor or anytime before rendering
     * @param metaData the metadata
     * @see FormMetaData
     */
    constructor(metaData?: FormMetaData);
    /**
     * This method does the DOM element creation
     * @param data the data by which to "guess" the form
     * @param root optionally, you can tell it to render right into that element
     * @return the generated form
     */
    render(data: any, root?: HTMLElement): HTMLFormElement;
    private renderFields;
    /**
     * Navigation for Wizard mode
     */
    next(): void;
    prev(): void;
    goTo(step: number | string): void;
    private getFieldMetaData;
    private renderField;
    private guessType;
}
export type FormMetaData = {
    [fieldName: string]: FieldMetaData;
};
export type GroupMetaData = {
    [groupName: string]: {
        label?: string;
        class?: string;
    };
};
export type FieldMetaData = FormMetaData | {
    label: string;
    validator?: (value: any) => boolean;
    tooltip?: string;
    helpText?: string;
    group?: string;
    componentType: 'table' | 'textarea' | 'checkbox' | 'date' | 'number' | 'radio' | 'input' | 'select' | 'object';
    attributes?: {
        [name: string]: string;
    };
    defaultValue?: any;
    nested?: any[] | object;
    options?: {
        text: string;
        value: string;
    }[] | string;
    dependency?: string;
};
