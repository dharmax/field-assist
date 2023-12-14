export declare class Autoform {
    private data;
    metaData: FormMetaData;
    textTranslator: (s: string) => string;

    constructor(data: any, metaData?: FormMetaData);

    render(root?: HTMLElement): HTMLFormElement;

    private autoCreateMetaData;
    private renderFields;

    getFieldMetaData(fieldName: string, value: any, parents: any): FieldMetaData;

    private renderField;
}

export declare type FormMetaData = {
    [fieldName: string]: FieldMetaData;
};
export declare type FieldMetaData = FormMetaData | {
    label: string;
    validator: (value: any) => boolean;
    tooltip: string;
    helpText: string;
    componentType: string;
    defaultValue: any;
    dependency?: string;
};
