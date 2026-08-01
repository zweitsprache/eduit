# Dazit SEO backlog

The initial technical SEO foundation is implemented: canonical document URLs,
permanent redirects from `/worksheets` to `/documents`, dynamic sitemap,
robots rules, PDF de-indexing and canonical headers, Open Graph/Twitter
metadata, `de-CH`, and JSON-LD for documents, breadcrumbs, and the library.

## Next priorities

1. Create indexable taxonomy landing pages for Niveau, Typ, Thema, and
   Handlungsfeld, with unique introductions, metadata, canonicals, and internal
   links.
2. Verify the final production hostname through `NEXT_PUBLIC_DAZIT_URL` or
   `DAZIT_SITE_URL`, enforce HTTPS, and redirect alternate hostnames.
3. Configure Google Search Console, submit `/sitemap.xml`, and inspect a
   representative set of document URLs.
4. Improve Core Web Vitals: explicit thumbnail dimensions/aspect ratios,
   optimized image loading, and appropriate caching for Blob and database reads.
5. Validate `LearningResource`, `BreadcrumbList`, and `ItemList` markup with
   structured-data validators.
6. Introduce separate SEO-title, meta-description, and card-excerpt fields.
7. Define canonical/noindex rules before exposing URL-based filter combinations.
8. Link visible breadcrumbs to real taxonomy landing pages instead of the
   library root.
9. Store previous publication slugs and permanently redirect them after slug
   changes.
10. Verify that social crawlers can access the 1200×675 thumbnail proxy images.
11. Add editorial/about pages explaining Dazit, the adult-DaZ focus, and content
    responsibility.
12. Show meaningful publication and revision dates on document pages.
13. Implement functional shareable search URLs and keep internal search-result
    pages out of the index where appropriate.
14. Add favicon, Apple icon, web manifest, and a default Open Graph image.

## Recommended next implementation

Start with crawlable landing pages for Niveau, Typ, and Handlungsfeld. These
will provide the largest near-term gain in organic discovery and improve the
internal link structure.
