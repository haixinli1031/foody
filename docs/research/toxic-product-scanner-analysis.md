# Can we build a barcode scanner that warns about toxic ingredients in cosmetics and household products?

Research date: 2026-10-06. Prompted by Dr. Yvonne Burkart's appearance on
The Diary of a CEO (18 Nov 2024). Vendor pages and transcripts were mostly
blocked from this environment, so figures are as reported by the linked
search sources.

## 1. The message driving demand

**Who she is.** Yvonne Burkart, PhD, DABT, is a board-certified
toxicologist with about 22 years in the field, formerly a senior
toxicologist in the flavor and fragrance industry. Her YouTube channel has
roughly 153k subscribers and 5.5M views. She is one of the most visible
consumer-toxicology voices on podcasts (Diary of a CEO, Dhru Purohit, The
Herban Farmacy).

**What she says.** Core claims from the DOAC episode and her channel:

- "Fragrance" / "parfum" on a label is a legal umbrella term that hides
  dozens to hundreds of undisclosed chemicals, including endocrine-disrupting
  phthalates. Scented deodorants, candles, air fresheners, laundry products
  and perfumes are her top targets.
- Endocrine disruptors are linked to infertility (her own story), hormone
  cancers and developmental harm to children.
- Microplastics and plastic food contact (heating food in plastic) add to
  body burden.
- Makeup and personal care routines are a daily, cumulative exposure route.
- Practical advice: go fragrance-free, read ingredient lists, swap the
  highest-exposure products first, prefer glass and stainless steel.

**Why it matters for an app.** Her audience is exactly the user who wants a
"scan and tell me if this is bad" tool, and her central villain
(undisclosed fragrance) is the one thing a barcode scanner cannot see
today. That is both the limitation and the opportunity (see section 4).

## 2. What already exists

This category is older and more consolidated than the food category.

| App | Scope | Scoring | Data sources | Users / price | Weakness |
|---|---|---|---|---|---|
| **Yuka** | Food + cosmetics (not household cleaners) | 0-100; worst ingredient sets the ceiling. Hazard categories: endocrine disruptor, carcinogen, allergen, irritant, pollutant | SIN List, TEDX, ED List, ECHA, DEDUCT, PubChem, EWG Skin Deep | 65-85M users; free + ~$10-20/yr | Explicitly precautionary; penalizes ingredients within legal limits; no household products; industry (FEBEA white paper) disputes rigor |
| **EWG Healthy Living** (Skin Deep + Guide to Healthy Cleaning + Food Scores) | Cosmetics, cleaners, food | 1-10 hazard score with per-ingredient rationale and cited studies | EWG's own ~60 regulatory and toxicity sources | Free; 200k+ products | Chemists criticize hazard-not-risk, arbitrary scores, inconsistent ratings for near-identical ingredients; EWG Verified is a paid licensing program (potential conflict) |
| **Think Dirty** | Cosmetics and personal care only | 0-10 "Dirty Meter", worst-ingredient-wins | Canadian, US, EU government and NGO databases incl. Skin Deep | 8M+ users; $59.99/yr or $99 lifetime | Over-penalizes e.g. salicylic acid; brand partnerships |
| **INCI Beauty** (FR) | Cosmetics | 0-20 score | INCI analysis, EU regulation | 1.3M products, 17k substances | Europe-centric |
| **CodeCheck** (CH/DE) | Food + cosmetics | Traffic light; user-selectable filters for palm oil, microplastics, silicones, aluminum, nano, allergenic fragrance, hormone disruptors | Öko-Test, BUND, Greenpeace, EU lists | Large in DACH | Not in US/China |
| **Clearya** | Cosmetics, baby, cleaning | Flags chemicals of concern; browser extension for online shopping + label photo OCR | Authoritative lists (CA Prop 65, EU, etc.) | Free | Small, no barcode-first flow |
| **Detox Me** (Silent Spring Institute) | Whole-home tips | Barcode lookup -> tips, not scores | 20 years of Silent Spring research | Free, nonprofit | Thin product coverage |
| **INCIDecoder / SkinSort / HadaBuddy** | Skincare | Ingredient explanations, routine building, conflict detection | Curated | Freemium | Efficacy-focused, not toxicity-first |
| **Open Beauty Facts** | Cosmetics | Raw data only | Crowd-sourced, ODbL | ~3M products claimed, free API | Sparse records, no scoring |

### China

- **美丽修行 (Beauty Practice)**: 40M users, 3.5M products, 27k ingredients;
  safety + efficacy + skin-type matching; raised a ¥10M+ Series A.
- **真我**: 2M+ ingredient queries, batch-number authenticity checks,
  regulation lookup.
- **透明标签**: 3M products, data + expert reviews.
- Household cleaning products in China are largely uncovered by any app.

## 3. Data available to build on

| Source | What it gives | Access |
|---|---|---|
| **Open Beauty Facts** | Barcode -> INCI list, brand, category, images | Free JSON API, no key, ODbL (attribution + share-alike) |
| **EU CosIng** | 30k+ ingredient entries, INCI names, functions, links to Annex II (1,739 banned), Annex III (373 restricted), SCCS opinions | Public web DB; bulk download via third parties (cosingchecker.com) |
| **California Safe Cosmetics Program** | Products reported to contain carcinogens/reproductive toxicants, with CAS numbers | CSV on data.ca.gov |
| **Prop 65 list** | ~900 chemicals known to CA to cause cancer or reproductive harm | Public download |
| **ECHA SVHC / endocrine disruptor assessment list; EU ED List; SIN List (ChemSec); TEDX** | Endocrine-disruption and hazard classifications | Public, mostly downloadable |
| **Health Canada Cosmetic Ingredient Hotlist** | Prohibited/restricted ingredients | Public |
| **IFRA transparency list** | ~3,600 fragrance materials used by industry (not per product) | Public |
| **EWG Skin Deep** | Per-ingredient hazard scores | Web only; no public API; licensing unclear |
| **China NMPA 已使用化妆品原料目录 (IECIC) + 禁用原料目录** | ~8,900 permitted ingredients, banned list | Public PDF/Excel |

Barcode coverage is the weak link outside Europe. Scanning the INCI list
with OCR and matching against CosIng names is mandatory as a fallback.

## 4. The fragrance problem is the real opportunity

Every scanner today hits the same wall: ~74% of personal-care labels list
"fragrance" with nothing behind it. Apps either ignore it or dock a fixed
penalty. Two regulatory changes make this solvable soon:

- **EU Regulation 2023/1545**: from 31 July 2026, new products must
  individually list 82 fragrance allergens (up from 26) above 0.001%
  leave-on / 0.01% rinse-off. From 31 July 2028 all stock must comply.
- **US MoCRA**: FDA fragrance-allergen disclosure NPRM expected Nov 2026,
  final rule within ~180 days, compliance 2027 or later. FDA also set a
  Nov 2026 timeline for a formaldehyde ban in hair products.
- **California SB 312** already forces reporting of hazardous fragrance and
  flavor ingredients to the state database.

An app launched now can (a) parse the new allergen disclosures the moment
they appear on labels, (b) cross-reference California's reported fragrance
ingredients by brand, and (c) show a "fragrance transparency" grade per
brand, which no incumbent does.

## 5. Where incumbents are weak

1. **Hazard, not risk.** Yuka, EWG and Think Dirty score the presence of a
   hazardous ingredient regardless of concentration, product type (rinse-off
   vs leave-on) or regulatory limit. Toxicologists and cosmetic chemists
   consistently call this out. A dose- and exposure-aware model is open
   ground and matches Burkart's actual training.
2. **Household products are uncovered.** Yuka explicitly declines to rate
   cleaners. Only EWG does it in the US, nobody does it in China. Candles,
   air fresheners, detergents, dryer sheets are Burkart's loudest topics.
3. **Worst-ingredient-wins scoring** produces absurd results (salicylic acid
   tanking a product).
4. **No personalization.** Pregnancy, trying to conceive, infant, eczema,
   fragrance allergy, hormone-sensitive cancer history all change what
   matters. None of the big three adapt.
5. **Ingredient anxiety backlash.** Dermatologists and press (Marie Claire,
   Beauty Independent) now cover scanner apps as a source of misinformation.
   Transparent evidence grading is a differentiator.
6. **Conflicts of interest.** EWG Verified and Think Dirty brand deals
   undermine trust. A clean business model (subscription only) is a story.
7. **Online shopping.** Only Clearya intercepts the Amazon/Sephora purchase
   moment. Most exposure decisions now happen online, not at a shelf.

## 6. Feasibility assessment

**Technically: yes, and cheaper than the food case.** Cosmetics ingredient
lists use a standardized vocabulary (INCI), so matching is deterministic.
A working MVP needs:

1. Barcode scan (ML Kit / Vision / ZXing) -> Open Beauty Facts lookup ->
   fallback to OCR of the INCI panel -> normalize to CosIng INCI names.
2. A rules engine mapping each INCI name to flags from the public lists in
   section 3: banned (Annex II), restricted (Annex III with limits),
   endocrine disruptor (EU ED List, SIN, TEDX), carcinogen/reprotox
   (Prop 65, IARC, CLP), allergen (EU 82 list), PFAS, microplastic,
   formaldehyde releaser, undisclosed fragrance.
3. A scoring layer that is **exposure-aware**: weight by product type
   (leave-on vs rinse-off vs aerosol vs candle), by Annex III concentration
   limits, and by user profile (pregnant, infant, allergy, hormone-sensitive).
4. Per-flag evidence card: source list, strength of evidence, and the
   sentence "legal limit is X; this product type typically uses Y".
5. Crowd-sourcing loop for missing barcodes, contributed back to Open
   Beauty Facts under ODbL.

**Commercially: hard but open.** Yuka owns the generic "scan anything"
position with 80M users. A new app needs a wedge. The three credible ones:

- **Household and home products** (cleaners, candles, air fresheners,
  laundry, cookware) with a toxicologist-grade methodology. Nobody owns
  this. It is exactly the Burkart audience.
- **Fragrance transparency** riding the 2026-2027 EU and US disclosure
  rules.
- **China household + cosmetics**, where 美丽修行 owns skincare but
  cleaners, candles and baby products are uncovered, and distribution via
  WeChat mini program is cheap.

A creator partnership (Burkart or a similar DABT toxicologist as
methodology lead) would be the fastest route to trust and distribution,
and her stated principles (fragrance-free, dose awareness) map cleanly
onto a product.

## 7. Risks

- **Scientific credibility.** The category is under fire for fearmongering.
  A methodology that scores hazard without exposure will be dismissed by
  the same experts the app needs. Hire or partner with a toxicologist and
  publish the method.
- **Legal.** Rating a named product "toxic" invites brand complaints
  (FEBEA white paper against Yuka). Phrase flags as "contains X, which is
  listed by Y" with sources, never as a health claim about the product.
- **Database licensing.** Open Beauty Facts and OFF are ODbL: contributions
  back are required if you redistribute derived data. EWG Skin Deep has no
  open license; do not scrape it.
- **Coverage.** Outside the EU, barcode hit rate on cosmetics is far below
  food. OCR is not optional.
- **Fragrance remains a black box** until 2027 for most products. The app
  must say "undisclosed" honestly rather than guess.

## 8. Recommendation

Build it, but not as "Yuka for cosmetics". Position as the first
**exposure-aware home and personal-care scanner** with a toxicologist-led
methodology, launch on household and fragrance products where no incumbent
scores, reuse the food scanner's scanning and crowd-sourcing stack, and
time the launch to the July 2026 EU allergen rule.

## Sources

- https://podcasts.apple.com/us/podcast/no-1-toxicologist-stop-using-scented-candles-these/id1291423644?i=1000677288526
- https://www.shortform.com/podcast/episode/the-diary-of-a-ceo-with-steven-bartlett-2024-11-18-episode-summary-no-1-toxicologist-stop-using-scented-candles-these-products-were-making-me-infertile-using-this-product-is-harming-your-future-kids
- https://singjupost.com/no-1-toxicologist-these-products-were-making-me-infertile-doac-podcast-transcript/
- https://www.fillupbuttercup.com/blogs/fill-up-blog/understanding-toxins-key-takeaways-from-dr-yvonne-burkart-on-the-diary-of-a-ceo-podcast
- https://socialcounts.org/youtube-live-subscriber-count/UCkaDPB2QgEkXkRFQaQEscOg
- https://www.hadabuddy.com/blog/best-skincare-scanner-apps-compared
- https://www.hadabuddy.com/blog/ewg-skin-deep-alternative-app
- https://www.nutrifyai.app/blog/best-skincare-ingredient-scanner-apps
- https://help.yuka.io/l/en/article/2t20ixn5y5-evualuation-cosmetic-products
- https://help.yuka.io/l/en/article/qn7duow8xh-on-which-sources-does-yuka-base-their-analyzes
- https://help.yuka.io/l/en/article/lpvo0xxsv9-household-cleaning-products
- https://www.beautyindependent.com/yuka-beauty-industry-insiders-question-product-ratings/
- https://client.cosmeticobs.com/en/articles/news-34/febea-responds-to-apps-with-a-white-paper-4561
- https://www.marieclaire.co.uk/beauty/skincare/beauty-scanning-apps
- https://chemistscorner.com/why-the-ewg-skin-deep-database-is-still-a-dubious-source
- https://www.ewg.org/ewgverified/how-we-work-with-companies.php
- https://apps.apple.com/us/app/ewgs-healthy-living/id703155791
- https://apps.apple.com/us/app/think-dirty-shop-clean/id687176839
- https://www.techradar.com/computing/websites-apps/thinkdirty
- https://codecheck-app.com/about-us/
- https://zerobreastcancer.org/en/blog/app-and-browser-extension-recommendation-clearya
- https://silentspring.org/project/detox-me-mobile-app
- https://f-droid.org/de/packages/openfoodfacts.github.scrachx.openbeauty/
- https://cosingchecker.com/blogs/cosing-database-explained/
- https://cosingchecker.com/annex/
- https://lab.data.ca.gov/dataset/chemicals-in-cosmetics
- https://pirg.org/articles/california-is-uncovering-secret-ingredients-in-cosmetics/
- https://cosmetech.co.in/article/eu-regulation-2023-1545-fragrance-allergen-labelling-july-2026
- https://coslaw.eu/fragrance-allergens-july-eu-deadline-faq/
- https://ecomundo.eu/en/blog/mocra-update-2026
- https://cosmetic.chemlinked.com/news/cosmetic-news/us-fda-sets-november-2026-timeline-for-formaldehyde-ban-and-fragrance-allergen-rule
- https://www.36kr.com/p/1723852783617 (美丽修行)
- https://apps.apple.com/us/app/id1458702337 (真我)
- https://apps.apple.com/us/app/id1464836695 (透明标签)
- https://www.glossy.co/beauty/yuka-beauty-wellness-product-scanning-app/
- https://market.us/report/clean-beauty-market/
