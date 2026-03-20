/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { collectValues, populateFields } from '../src/field-assist';

describe('collectValues', () => {
    it('should collect simple input values', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <input ref="firstName" value="John">
            <input ref="lastName" value="Doe">
        `;
        const values = collectValues(container);
        expect(values).toEqual({
            firstName: 'John',
            lastName: 'Doe'
        });
    });

    it('should collect nested input values using dot notation', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <input ref="user.name" value="Jane">
            <input ref="user.age" value="25">
        `;
        const values = collectValues(container);
        expect(values).toEqual({
            user: {
                name: 'Jane',
                age: '25'
            }
        });
    });

    it('should handle checkboxes', () => {
        const root = document.createElement('div');
        root.innerHTML = `
            <div id="container">
                <div>
                    <input type="checkbox" ref="agreed" checked>
                    <input type="checkbox" ref="optIn">
                </div>
            </div>
        `;
        const container = root.querySelector('#container') as HTMLElement;
        const values = collectValues(container);
        expect(values).toEqual({
            agreed: true,
            optIn: false
        });
    });

    it('should handle multi-select', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <select ref="colors" multiple>
                <option value="red" selected>Red</option>
                <option value="blue">Blue</option>
                <option value="green" selected>Green</option>
            </select>
        `;
        const values = collectValues(container);
        expect(values).toEqual({
            colors: ['red', 'green']
        });
    });

    it('should capture validation errors', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <input ref="email" type="email" value="invalid-email">
        `;
        const values = collectValues(container);
        // @ts-ignore
        expect(values.email).toBeTypeOf('symbol'); // Invalid symbol
        expect(values._errors.email.value).toBe('invalid-email');
    });
});

describe('populateFields', () => {
    it('should populate simple fields', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <input ref="firstName">
            <input ref="lastName">
        `;
        const values = {
            firstName: 'John',
            lastName: 'Doe'
        };
        populateFields(container, values);
        
        expect((container.querySelector('[ref="firstName"]') as HTMLInputElement).value).toBe('John');
        expect((container.querySelector('[ref="lastName"]') as HTMLInputElement).value).toBe('Doe');
    });

    it('should populate nested fields', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <input ref="user.name">
        `;
        const values = {
            user: { name: 'Jane' }
        };
        populateFields(container, values);
        
        expect((container.querySelector('[ref="user.name"]') as HTMLInputElement).value).toBe('Jane');
    });
});
