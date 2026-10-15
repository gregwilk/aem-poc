import { LightningElement, wire } from 'lwc';
import getFragment from '@salesforce/apex/AemFragmentController.getFragment';

export default class AemFragment extends LightningElement {
    html;
    error;

    @wire(getFragment)
    wiredFragment({ data, error }) {
        if (data) {
            this.html = data;
            this.error = undefined;
            this.inject();
        } else if (error) {
            this.error = 'Content is unavailable right now.';
        }
    }

    renderedCallback() {
        this.inject();
    }

    inject() {
        const container = this.template.querySelector('.xf-container');
        if (container && this.html && container.innerHTML !== this.html) {
            // Lightning Web Security sanitises this; AEM <script> tags won't run.
            container.innerHTML = this.html;
        }
    }
}
