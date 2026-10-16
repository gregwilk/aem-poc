public without sharing class AemFormContentController {

    // Real AEM:   host = https://dev03-publish.aem.sep.msd.govt.nz, base = /graphql/execute.json/sep/
    // GitHub mock: host = https://raw.githubusercontent.com,
    //              base = /YOUR-GITHUB-USERNAME/aem-poc/main/graphql/execute.json/sep/
    private static final String AEM_HOST   = 'https://raw.githubusercontent.com';
    private static final String QUERY_BASE = '/gregwilk/aem-poc/main/graphql/execute.json/sep/';

    // Only persisted queries listed here can be called from the site.
    private static final Set<String> ALLOWED_QUERIES = new Set<String>{ 'contact-details' };

    // One call returns content for every field in the form. cacheable=true means
    // all field components on a page asking for the same query share one result.
    @AuraEnabled(cacheable=true)
    public static String getFormContent(String queryName) {
        if (!ALLOWED_QUERIES.contains(queryName)) {
            throw new AuraHandledException('Unknown content query: ' + queryName);
        }
        HttpRequest req = new HttpRequest();
        req.setEndpoint(AEM_HOST + QUERY_BASE + queryName);
        req.setMethod('GET');
        req.setHeader('Accept', 'application/json');
        req.setTimeout(10000);

        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() != 200) {
            throw new AuraHandledException('AEM returned HTTP ' + res.getStatusCode() + ' for ' + queryName);
        }
        return res.getBody();
    }
}
