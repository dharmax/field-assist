export declare class AutoForm {
    metaData: FormMetaData;
    /**
     * change this for supporting translation of labels
     * @param s
     */
    textTranslator: (s: string) => string;
    readonly form: HTMLFormElement;

    constructor(metaData?: FormMetaData);

    render(data: any, root?: HTMLElement): HTMLFormElement;

    private renderFields;

    getFieldMetaData(fieldName: string, value: any, parents: string[]): FieldMetaData;

    private renderField;
    private guessType;
}
export declare type FormMetaData = {
    [fieldName: string]: FieldMetaData;
};
export declare type FieldMetaData = FormMetaData | {
    label: string;
    validator?: (value: any) => boolean;
    tooltip?: string;
    helpText?: string;
    componentType: string;
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
