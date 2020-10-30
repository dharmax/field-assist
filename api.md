## Functions

<dl>
<dt><a href="#collectValues">collectValues(node, context, keyFieldName)</a> ⇒</dt>
<dd><p>Looks for elements with the &quot;ref&quot; (or whatever other  attribute then returns a map with the values
inside those elements, with the string in the &quot;ref&quot; as the name.
It also mark invalid values with Invalid symbol.</p>
</dd>
<dt><a href="#refs">refs(node, keyFieldName)</a> ⇒</dt>
<dd></dd>
<dt><a href="#refNodes">refNodes(node, keyFieldName)</a> ⇒</dt>
<dd></dd>
<dt><a href="#getFieldAndValue">getFieldAndValue(event, context, keyFieldName)</a></dt>
<dd><p>Utility method that let you get the field name and value of the input field that is associated with an event</p>
</dd>
<dt><a href="#populateField">populateField(node, value)</a></dt>
<dd><p>Populate a single field in a normalized way</p>
</dd>
<dt><a href="#populateFields">populateFields(baseNode, values)</a></dt>
<dd><p>Populate a whole form from a map of field names and values</p>
</dd>
</dl>

<a name="collectValues"></a>

## collectValues(node, context, keyFieldName) ⇒
Looks for elements with the "ref" (or whatever other  attribute then returns a map with the values
inside those elements, with the string in the "ref" as the name.
It also mark invalid values with Invalid symbol.

**Kind**: global function  
**Returns**: the fields and _errors field with the list of erroneous values  

| Param | Description |
| --- | --- |
| node | start node to look within |
| context | an optional context object that will be injected into a custom validator |
| keyFieldName | optional alternative reference field name |

<a name="refs"></a>

## refs(node, keyFieldName) ⇒
**Kind**: global function  
**Returns**: array of elements that have the "ref" attribute  

| Param | Description |
| --- | --- |
| node | start search node |
| keyFieldName | optional alternative reference field name |

<a name="refNodes"></a>

## refNodes(node, keyFieldName) ⇒
**Kind**: global function  
**Returns**: elements map by the ref name  

| Param | Description |
| --- | --- |
| node |  |
| keyFieldName | optional alternative reference field name |

<a name="getFieldAndValue"></a>

## getFieldAndValue(event, context, keyFieldName)
Utility method that let you get the field name and value of the input field that is associated with an event

**Kind**: global function  

| Param | Description |
| --- | --- |
| event | the event |
| context | optional context for the collectValue inner call |
| keyFieldName | optional alternative to the "ref" attribute name |

<a name="populateField"></a>

## populateField(node, value)
Populate a single field in a normalized way

**Kind**: global function  

| Param | Description |
| --- | --- |
| node | the field's node |
| value | the value |

<a name="populateFields"></a>

## populateFields(baseNode, values)
Populate a whole form from a map of field names and values

**Kind**: global function  

| Param | Description |
| --- | --- |
| baseNode | the base of the form (doesn't have to be a Form element) |
| values | the values |

