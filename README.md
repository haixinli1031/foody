# Foody

Research and prototypes for barcode scanners that explain what is in everyday products.

## Label Check (web app prototype)

`web/` is a static progressive web app. Scan the barcode or photograph the ingredient panel of a household or personal-care product and see which listed substances it contains, who lists them and why, how much of the formula is undisclosed, and whether it matches the preferences you chose. It never scores a product or calls it safe or unsafe. See `docs/design/household-scanner-design.md` for the design and the legal reasoning behind it.

**Live:** https://haixinli1031.github.io/foody/ (deployed from `web/` by `.github/workflows/pages.yml`)

### Try it on your phone

1. Open the live URL in Safari (iPhone) or Chrome (Android).
2. Tap Share, then **Add to Home Screen**. It opens full-screen like an app.
3. Set your preferences, then scan a barcode or photograph an ingredient list.

Product data comes from Open Beauty Facts, Open Products Facts and Open Food Facts. If a barcode is not found, photograph the ingredient panel; the text is recognised on your phone and you confirm it before anything is flagged.

### Run locally

```sh
cd web && python3 -m http.server 8080
# open http://localhost:8080
```

Camera access needs HTTPS or localhost.

### Data

- `web/data/substances.json`: reference list of substances, each flag citing a regulatory or scientific source with an evidence tier (A regulatory, B scientific body, C advocacy list, D label fact).
- `web/data/allergens.json`: EU fragrance allergens (the current 26 and the additions that apply to new products from 31 July 2026).

Both files are **draft and not yet reviewed by a toxicologist**. Every entry has a source URL. Corrections are welcome as issues or pull requests.

## Research

- `docs/research/existing-food-scanner-apps.md`: survey of food scanner apps, including the China market.
- `docs/research/toxic-product-scanner-analysis.md`: analysis of cosmetics and household product scanners and where a new entrant could fit.
- `docs/design/household-scanner-design.md`: product design with a low-legal-risk information model.

## Licence notes

Product data from Open Beauty Facts, Open Products Facts and Open Food Facts is available under the Open Database License (ODbL). Regulatory sources are public records and are cited per entry.
