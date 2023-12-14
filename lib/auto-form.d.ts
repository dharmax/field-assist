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
    private getFieldMetaData;
    private renderField;
    private guessType;
}

export type FormMetaData = {
    [fieldName: string]: FieldMetaData;
};
export type FieldMetaData = FormMetaData | {
    label: string;
    validator?: (value: any) => boolean;
    tooltip?: string;
    helpText?: string;
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
