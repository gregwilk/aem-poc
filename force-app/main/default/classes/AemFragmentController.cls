public without sharing class AemFragmentController {

    // POC: hard-code your AEM publish host and XF base path.
    // For anything beyond a POC, move these to Custom Metadata and use a Named Credential.

    private static final String AEM_HOST = 'https://raw.githubusercontent.com';
    private static final String XF_BASE  = '/gregwilk/aem-poc/main/content/experience-fragments/mysite/language-masters/en/site/promo-banner/';
    // Whitelist of variation node names (not titles) that exist under the XF.
    private static final Set<String> ALLOWED = new Set<String>{ 'master', 'gold-member', 'new-customer' };

    @AuraEnabled(cacheable=true)
    public static String getFragment() {
        String variation = pickVariation();
        String html = fetch(variation);
        if (html == null && variation != 'master') {
            html = fetch('master'); // fall back if the variation isn't published
        }
        if (html == null) {
            throw new AuraHandledException('Content is unavailable right now.');
        }
        // .plain.html returns root-relative URLs (/content/dam/...) which would
        // resolve against the Experience Cloud domain. Point them at AEM instead.
        return html.replace('src="/content/', 'src="' + AEM_HOST + '/content/')
                   .replace('href="/content/', 'href="' + AEM_HOST + '/content/')
                   .replace('srcset="/content/', 'srcset="' + AEM_HOST + '/content/');
    }

    // The personalisation decision lives here, using Salesforce data.
    private static String pickVariation() {
        if (UserInfo.getUserType() == 'Guest') {
            return 'new-customer';
        }
        // Replace with your own rule, e.g. a field on the user's Contact or Account.
        // User u = [SELECT Contact.Account.Customer_Tier__c FROM User WHERE Id = :UserInfo.getUserId()];
        // if (u.Contact?.Account?.Customer_Tier__c == 'Gold') return 'gold-member';
        return 'master';
    }

    private static String fetch(String variation) {
        if (!ALLOWED.contains(variation)) {
            variation = 'master';
        }
        HttpRequest req = new HttpRequest();
        req.setEndpoint(AEM_HOST + XF_BASE + variation + '.plain.html');
        req.setMethod('GET');
        req.setTimeout(10000);
        HttpResponse res = new Http().send(req);
        return res.getStatusCode() == 200 ? res.getBody() : null;
    }
}
