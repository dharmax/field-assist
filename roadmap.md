# Roadmap Implementation Plan: `field-assist`

This plan outlines the steps to implement the agreed-upon roadmap for the `field-assist` library.

## Objective
Enhance the library's stability, AI-friendliness, and features through a series of focused improvements.

## Key Files & Context
- `package.json`: For dependency and script updates.
- `README.md`: For AI-friendly documentation enhancements.
- `src/field-assist.ts`: For light TS polish, error handling, and AutoForm features.
- `tests/`: A new directory for the Vitest test suite.

## Implementation Plan

### Phase 1: Test Infrastructure (Vitest)
- **Goal**: Establish a robust testing environment.
- **Steps**:
    1.  Install Vitest: `npm install -D vitest jsdom`. (COMPLETED)
    2.  Update `package.json` with a test script: `"test": "vitest"`. (COMPLETED)
    3.  Create `tests/field-assist.test.ts` with initial tests for `collectValues` and `populateFields`. (IN PROGRESS)
    4.  Verify current functionality passes all tests. (IN PROGRESS)

### Phase 2: AI-Friendly Documentation
- **Goal**: Make it easier for AI coding assistants to understand and use the library.
- **Steps**:
    1.  Update `README.md` with:
        - A dedicated "Quick Reference" section for common patterns.
        - More explicit examples of complex scenarios (e.g., nested objects, custom validators).
        - A "Prompt Tips for AI" section summarizing the core API and conventions.

### Phase 3: Light TS Polish & Error Handling
- **Goal**: Improve developer experience and add basic error rendering support.
- **Steps**:
    1.  **Light TS Polish**: Review `src/field-assist.ts` and replace some `@ts-ignore` and `any` types with more specific interfaces/types where beneficial (e.g., for `normalizeValue` and `FieldMetaData`).
    2.  **Error Handling**:
        - Enhance `populateField` to optionally apply an `.is-invalid` class or similar if an error is present for that field.
        - Update `AutoForm` to support rendering error message containers next to fields.

### Phase 4: AutoForm Grouping & Wizard Support
- **Goal**: Extend `AutoForm` for complex form structures.
- **Steps**:
    1.  **Logical Grouping**: Update `FieldMetaData` and `AutoForm.renderFields` to support nested `fieldsets` or logical sections.
    2.  **Wizard Forms**: Introduce a `WizardForm` class (or update `AutoForm`) to handle multi-step form navigation, including basic `next()`, `prev()`, and `goTo(step)` methods.

## Verification & Testing
- Run `npm test` after each phase to ensure no regressions.
- Manually verify `AutoForm` changes using the `example/index.html` or a new example file.
- Review `README.md` for clarity and AI readability.
