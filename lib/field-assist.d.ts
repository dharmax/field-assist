export declare function collectValues(node: HTMLElement, context?: any, keyFieldName?: string): {
    [ref: string]: any;
};
export declare function getFieldAndValue(event: Event | HTMLElement, context?: any, keyFieldName?: string): {
    field: string;
    value: any;
};
export declare function populateField(node: HTMLInputElement, value: any, error?: any): void;
export declare function populateFields(baseNode: HTMLElement, values: {
    [ref: string]: any;
}): void;
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
export declare function disable(baseNode: HTMLElement, disable: boolean, fields?: string[] | null, subfield?: string, keyFieldName?: string): void;
export declare class AutoForm {
    metaData: FormMetaData;
    textTranslator: (s: string) => string;
    readonly form: HTMLFormElement;
    groups: GroupMetaData;
    constructor(metaData?: FormMetaData);
    render(data: any, root?: HTMLElement): HTMLFormElement;
    protected renderFields(container: HTMLElement, data: any, parents?: string[]): void;
    protected getFieldMetaData(fieldName: string, value: any, parents: string[]): FieldMetaData;
    protected renderField(fieldName: string, fmt: FieldMetaData, value: any, parents: string[]): HTMLElement;
    private guessType;
}
export declare class Wizard extends AutoForm {
    onPageChange?: (step: {
        newIndex: number;
        oldIndex: number;
        total: number;
    }) => void;
    private currentStepIndex;
    render(data: any, root?: HTMLElement): HTMLFormElement;
    next(): void;
    prev(): void;
    goTo(step: number | string): void;
}
export type FormMetaData = {
    [fieldName: string]: FieldMetaData;
};
export type GroupMetaData = {
    [groupName: string]: {
        label?: string;
        class?: string;
        text?: string;
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
