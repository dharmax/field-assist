# Field-Assist
**TL;DR** : just write `collectValues(myFormNode)` and get a proper JSON with all the values in all the input fields. There
are more related goodies there, see below + demo or the example. 

[Live Demo](https://codesandbox.io/s/field-assist-demo-qy86w?file=/src/index.js)

## Install
`npm install field-assist`

## API documentation
[Full API documentation](./api.md)

*Note that there's a TypeScript declaration file, too.*
 

## General
This cute library makes working with input fields, inside or outside of forms, very easy, fun, readable and extremely simple.
It's super light and has no dependencies, and it is TypeScript ready out of the box.   

It's main function is, perhaps, `collectValues( baseElement)` that basically does the following:
1. Recursively collect all the values from any input fields under the baseElement that have a `ref` attribute (with a logical name as a value).
1. Places them in a simple map, where the ref value is the entry's key, where its  is the **normalized** from the input field.
1. Validates the values and create an error object (the "_error") in the returned map

### Field Population
There's another very cute function, called `populateFields`, which does the opposite: it takes a map of ref-names to values,
and populate the fields with the values. It is also normalized (e.g. select/checkboxes/radio-buttons are also handled). It is
the opposite of the collectValues method, of sorts.
      
## Normalization
The normalization means that checkable items (radio buttons groups, multi-selects, checkboxes, textareas) appear in the map as 
you would expect them to appear: as booleans, a single value or an array of values, so it would be trivial to work with.

***(you're welcome to suggest other conversions/normalizatons)***

## Validation
The validation supports the standard modern HTML validation, of course, plus the ability to easily add a custom javascript
validator, using an attribute "validator".

If a value failed validation, the map entry for it would be the symbol Invalid and its erroneous value would still be easily
accessible via the map under the "_errors" entry.

### custom validator

The custom validator should be defined in the "validator" attribute and should be a JS function that **returns a function** 
with the following signature: f( value, context): boolean. Very simple. The context is the option context object that
you may pass to the collectValues method.  

## Update-as-you-type

The function getFieldAndValue(event) is useful for PWA-style update-as-you-type style. See example. Internally
it uses the same logic, but it finds the input element that was just changed, so you can process further only it, instead 
of all the values. Pretty useful.  

# example      
See full example in a single web-page under the example directory. No need for a server to run it.
Or you can check out the [Live Demo](https://codesandbox.io/s/field-assist-demo-qy86w?file=/src/index.js)
of it.
 

# disclaimer 
This library provided as-is, with absolutely no guarantee. Enjoy, support, etc....  

```
