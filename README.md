# Field-Assist
## General
This little, light library makes working with form and input field very easy, normalized and fun.

It's main function is collectValues( baseElement) that basically does the following:
1. Recursively collect all the values from any input fields under the baseElement that have a "ref" attribute (with a logical name as a value).
1. Places them in a simple map, where the ref value is the entry's key, where its  is the **normalized** from the input field.
1. It validates the values and create an error object (the "_error") in the returned map
      
## Normalization
The normalization means that checkable items (radio buttons groups, multi-selects, checkboxes) appear in the map as 
you would expect them to appear: as booleans, a single value or an array of values, so it would be trivial to work with.

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

*This is a Riot JS file snippet, but it is irrelevant for understanding the usage of the library  
```
<form oninput="{update}">
    <label>Display Name:
        <input ref="name" type="text" value="{state.profile.name}">
    </label>
    <div class="bio">
        <label>About myself</label><br>
         <textarea ref="generalBio" cols="30" rows="10">{state.profile.generalBio}</textarea>
    </div>
    <div class="main-language">
    <label>Main Language
        <select autocomplete="on" ref="preferredLanguage" value="{state.profile.preferredLanguage}">
                <option each="{l in state.languages}" selected="{state.profile.preferredLanguage===l}" value="{l}">
                    {l}
                </option>
        </select>
    </label>
</form>
<script>
    import {userStore} from "../../viewmodel/user-store";
    input {getFieldAndValue, collectValues} from 'field-assist' 

    export default {
        
        async onMounted() {
            const profile = await userStore.getMyProfile()
            const languages = ['en', 'he']
            this.update({profile, languages}      
        }
        update(event) {

                // there are two options here, you need to use the one that suit you most

                // this option updates all at once:

                userStore.updateMe( collectValues(this.$))

                // this option updates a single field:

                let {field, value} = getFieldAndValue(event);
                // noinspection JSIgnoredPromiseFromCall
                userStore.updateMe({[field]: value})
        }

    }

</script>
```
