/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { AutoForm } from '../src/field-assist';

describe('AutoForm Grouping and Wizard', () => {
    it('should group fields in a normal form', () => {
        const meta = {
            name: { label: 'Name', group: 'personal', componentType: 'input' },
            email: { label: 'Email', group: 'personal', componentType: 'input' },
            address: { label: 'Address', group: 'contact', componentType: 'input' }
        };
        const form = new AutoForm(meta as any);
        form.groups = {
            personal: { label: 'Personal Info', class: 'p-class' },
            contact: { label: 'Contact Info' }
        };
        
        const data = { name: '', email: '', address: '' };
        const formEl = form.render(data);

        const personalGroup = formEl.querySelector('.field-group[data-group="personal"]') as HTMLElement;
        expect(personalGroup).toBeTruthy();
        expect(personalGroup.classList.contains('p-class')).toBe(true);
        expect(personalGroup.querySelector('.group-label')?.textContent).toBe('Personal Info');
        expect(personalGroup.querySelectorAll('input').length).toBe(2);

        const contactGroup = formEl.querySelector('.field-group[data-group="contact"]') as HTMLElement;
        expect(contactGroup).toBeTruthy();
        expect(contactGroup.querySelectorAll('input').length).toBe(1);
    });

    it('should handle wizard mode navigation', () => {
        const meta = {
            step1Field: { label: 'S1', group: 'step1', componentType: 'input' },
            step2Field: { label: 'S2', group: 'step2', componentType: 'input' }
        };
        const form = new AutoForm(meta as any);
        form.groups = {
            step1: { label: 'Step 1' },
            step2: { label: 'Step 2' }
        };
        form.wizard = true;
        
        const data = { step1Field: '', step2Field: '' };
        const formEl = form.render(data);

        const s1 = formEl.querySelector('[data-group="step1"]') as HTMLElement;
        const s2 = formEl.querySelector('[data-group="step2"]') as HTMLElement;

        // Step 1 should be visible, Step 2 hidden
        expect(s1.style.display).toBe('');
        expect(s2.style.display).toBe('none');

        // Go to next step
        form.next();
        expect(s1.style.display).toBe('none');
        expect(s2.style.display).toBe('');

        // Go to previous step
        form.prev();
        expect(s1.style.display).toBe('');
        expect(s2.style.display).toBe('none');
    });
});
