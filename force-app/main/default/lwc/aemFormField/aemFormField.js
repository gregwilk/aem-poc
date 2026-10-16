import { LightningElement, api, wire } from 'lwc';
import getFormContent from '@salesforce/apex/AemFormContentController.getFormContent';

// Not in the AEM response yet. Move to a shared AEM fragment or a Custom Label.
const OPTIONAL_TEXT = 'Optional';

export default class AemFormField extends LightningElement {
    @api queryName = 'contact-details';
    @api fieldKey = 'firstName';
    @api required = false;
    @api inputType = 'text';
    @api minLength;
    @api maxLength;

    content;
    loadError;
    value = '';
    errorMessage;
    touched = false;
    optionalText = OPTIONAL_TEXT;

    @wire(getFormContent, { queryName: '$queryName' })
    wiredContent({ data, error }) {
        if (data) {
            try {
                const items = JSON.parse(data)?.data?.formFieldContentList?.items || [];
                this.content = items.find((item) => item.fieldkey === this.fieldKey);
                this.loadError = this.content ? undefined : `No AEM content found for field "${this.fieldKey}".`;
            } catch (e) {
                this.loadError = 'The AEM response was not valid JSON.';
            }
        } else if (error) {
            this.loadError = error.body?.message || JSON.stringify(error);
        }
    }

    get label() { return this.content?.label; }
    get description() { return this.content?.description?.plaintext; }
    get helpText() { return this.content?.helpText?.plaintext; }
    get showOptional() { return !this.required; }
    get ariaRequired() { return this.required ? 'true' : 'false'; }
    get ariaInvalid() { return this.errorMessage ? 'true' : 'false'; }
    get fieldClass() { return this.errorMessage ? 'field field_error' : 'field'; }

    handleInput(event) {
        this.value = event.target.value;
        if (this.touched) this.errorMessage = this.check();
    }

    handleBlur() {
        this.touched = true;
        this.errorMessage = this.check();
    }

    // A parent form can call this on submit: returns true when the field is valid.
    @api
    validate() {
        this.touched = true;
        this.errorMessage = this.check();
        return !this.errorMessage;
    }

    check() {
        const v = (this.value || '').trim();
        if (!v) return this.required ? this.message('required') : null;
        if (this.minLength && v.length < this.minLength) return this.message('minLength');
        if (this.maxLength && v.length > this.maxLength) return this.message('maxLength');
        if (this.inputType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            return this.message('invalidFormat');
        }
        return null;
    }

    // Fills {field}, {minLength}, {maxLength} in the AEM template.
    // {field} is the label in lower case; the first letter of the result is capitalised,
    // so "Enter your {field}." -> "Enter your first name." and
    // "{field} must contain..." -> "First name must contain...".
    message(key) {
        const entry = (this.content?.validationMessages || []).find((m) => m.messagekey === key);
        const template = entry?.messagetemplate?.plaintext;
        if (!template) return `Check your ${this.label.toLowerCase()}.`;

        const values = { field: this.label.toLowerCase(), minLength: this.minLength, maxLength: this.maxLength };
        const text = template.replace(/\{(\w+)}/g, (match, name) =>
            values[name] !== undefined && values[name] !== null ? values[name] : match
        );
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
}
