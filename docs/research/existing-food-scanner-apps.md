# Existing food barcode-scanner apps that warn about harmful ingredients

Research date: 2026-10-06. Sources are web search results; several vendor
pages could not be fetched directly from this environment, so figures are
as reported by the linked articles.

## Short answer

Yes. This is a crowded, mature category. Dozens of apps scan a package
barcode, look up the ingredient list, and flag additives, allergens, or
"harmful" ingredients. The biggest is Yuka (roughly 80-85M users, 15
countries). Almost every app in the category sits on top of the same open
database, Open Food Facts (4M+ products, ODbL license, free API with no key).

## Main players

| App | Core approach | Personalization | Price | Notes |
|---|---|---|---|---|
| **Yuka** (iOS/Android) | 0-100 score: 60% nutrition (Nutri-Score), 30% additives, 10% organic. Additives rated risk-free / limited / moderate / high; a high-risk additive caps the score at 49 | None. One score for everyone | Free; premium ~$10-20/yr (pay what you want) | Most popular. Also covers cosmetics. Criticized by dietitians for ignoring dose, one-size-fits-all scoring, DB errors, and promoting "good/bad food" thinking |
| **Open Food Facts** (iOS/Android, open source) | Shows raw data: Nutri-Score, NOVA processing group, Eco-Score, additives, allergens | Basic allergen alerts | Free, no ads | Data-heavy, less guided. Records can be incomplete. This is the database most other apps use |
| **Bobby Approved** | Pass/fail against Bobby Parrish's ingredient standards (seed oils, refined sugar, etc.) | None | Free | Opinion-based framework, not science-weighted |
| **EWG Healthy Living** | 1-10 score grounded in ~60 regulatory and toxicity sources; food, cosmetics, cleaning products | None | Free | US-focused |
| **Trash Panda** | Flags potentially harmful ingredients and links each flag to peer-reviewed studies | Some | Free with premium for unlimited scans | Marketing leans "toxin-free" |
| **Fig** | Matches ingredients against 2,800+ diets/restrictions (low FODMAP, vegan, alpha-gal, celiac, etc.) | Strong: diet and allergy profile | Free; Fig+ $59.99/yr | Best-in-class for restriction matching rather than "harmful" scoring |
| **Spoonful** | Safe/unsafe verdict for IBS/low-FODMAP (Monash-trained dietitians), celiac, allergens, plant-based | Strong: diet profile | Freemium | Niche medical-diet focus |
| **Sifter - Scan By Diet** | Green check / red X against a combined profile of prescribed diets (diabetes, hypertension, allergens) | Strong: health conditions | Freemium | Built for clinical dietary prescriptions |
| **Olive** | Flags additives, seed oils, gluten, pesticides, parabens, phthalates; food + cosmetics | Some | Freemium | |
| **TruthIn** | Rating from nutrition, ingredient impact, processing, additives | Some | Freemium | India-focused |

## Newer AI-first apps with health-condition personalization

A wave of 2025-2026 apps use an LLM over the OCR'd label or Open Food
Facts record and tailor the verdict to the user's conditions:

- **MyNutriLens**: profile with conditions and medications, AI verdict per product.
- **Sesame**: analysis against 20+ health conditions (diabetes, hypertension, CKD, ...).
- **FreshScan**: kidney disease (potassium, phosphorus) and diabetes (GI/GL).
- **Toxiq**, **Allergify**, **OnFork**, **SafeChoice**, **Nutika**, **CheckPal**,
  **Scanify**, **Food Scanner - Eat Healthy**: personalized 0-100 safety scores,
  allergen and additive warnings, healthier alternatives.
- **AlerFree**: free, no ads, Safe/Risky/Dangerous verdict for 14 allergen groups.

Most of these are small, young, and lightly reviewed. Quality of the
underlying "harmful ingredient" judgment is rarely documented.

## Common weaknesses (opportunities)

1. **Dose-blind additive warnings.** Yuka and most clones penalize an additive
   regardless of quantity or regulatory safe limits (WCRF, dietitian reviews).
2. **No personalization in the big apps.** Yuka, Bobby Approved, EWG give one
   verdict for everyone. Condition-aware apps exist but are small.
3. **Database gaps and errors.** Open Food Facts is crowd-sourced; records are
   incomplete or wrong, and US coverage is weaker than EU.
4. **Fear-based framing.** Eating-disorder specialists flag "good/bad" labels.
   Few apps explain uncertainty or the strength of evidence.
5. **Opaque science.** Trash Panda links studies; most others do not show
   their sources per flag.

## Building blocks if we build our own

- **Open Food Facts API**: `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
  returns ingredients text, `additives_tags`, `allergens_tags`, `nova_group`,
  `nutriscore_grade`, `ingredients_analysis_tags`. No API key; must send a
  custom User-Agent; ODbL requires attribution and share-alike for the data.
  Official SDKs exist for several languages (openfoodfacts GitHub org).
- **Additive risk data**: EFSA opinions, IARC classifications, and Open Food
  Facts' additive taxonomy. Yuka's methodology (Nutri-Score + additive
  penalties) is public and simple to reproduce.
- **Allergen matching**: the 14 EU / 9 US major allergens from `allergens_tags`
  plus free-text ingredient parsing for traces.
- **Scanning**: on-device barcode scanning via ML Kit (Android), Vision (iOS),
  or `BarcodeDetector` / ZXing on web.

## Sources

- https://www.trashpandaapp.com/blog/best-food-scanner-apps-compared-2026
- https://nutika.ca/blogs/best-food-scanner-apps-2026
- https://osana.co/blog/best-food-scanner-app
- https://osana.co/blog/yuka-vs-open-food-facts
- https://osana.co/blog/yuka-vs-bobby-approved
- https://www.hopegrown.org/blog/yuka-app-vs-bobby-approved-app-which-food-label-scanner-wins
- https://pasqualepillitteri.it/en/news/16112/yuka-app-how-it-works-alternatives
- https://nutriscan.app/blog/posts/is-yuka-free-2026-premium-pricing-32eae3fdda
- https://help.yuka.io/l/en/article/yth80j3vle-sources-analysis-of-food-additives
- https://www.wcrf.org/about-us/news-and-blogs/healthy-new-you-the-yuka-app-review/
- https://mamaknowsnutrition.com/yuka-app-reviews
- https://theunbiasedscipod.substack.com/p/that-app-scoring-your-groceries-we
- https://support.openfoodfacts.org/help/en-gb/12-api-data-reuse/94-are-there-conditions-to-use-the-api
- https://apps.apple.com/app/id1564434726 (Fig)
- https://apps.apple.com/us/app/-/id1481914232 (Spoonful)
- https://apps.apple.com/us/app/sifter-scan-by-diet/id1625351331
- https://apps.apple.com/us/app/olive-food-cosmetic-scanner/id6739765789
- https://play.google.com/store/apps/details?id=com.natfirst.truthin (TruthIn)
- https://mergeek.com/latest/eyVzpWBOz38mvME7 (MyNutriLens)
- https://marlvel.ai/api/llm/apps/health-fitness/sesame-healthy-food-scanner
- https://appshunter.io/ios/app/freshscan-produce-scanner/id6757885440
- https://appgoblin.info/apps/959328989 (AlerFree)
- https://allergify.onrender.com/

## China market

Research date: 2026-10-06. Yuka, Open Food Facts, Fig and the other Western
apps have no meaningful presence in China: Open Food Facts coverage of
Chinese barcodes (690-699 prefix) is thin, and Yuka does not localize for
China. The domestic market is instead a long tail of small, recent
(2022-2025) indie apps plus WeChat mini programs. No single dominant
"Yuka of China" exists yet.

### Cultural driver

Demand spiked after the 2022 "海克斯科技" (hextech) viral trend on Douyin,
in which creators exposed additive-heavy "science and technology" foods.
Parents of young children are the core user group. Most apps anchor their
safety ratings on the national additive standard **GB 2760-2024** rather
than EFSA or IARC.

### Domestic apps (all iOS App Store China + Android stores)

| App | Developer | Input | What it gives | Price |
|---|---|---|---|---|
| **成分喵** (Chengfen Miao) | 南京比价狗网络科技 | Barcode, photo, or pasted Taobao/JD product link | Additive list with risk notes for food and cosmetics; real product DB | Free + IAP |
| **剂查查** | FoodIdentificationTool | Barcode, photo of label | Additive lookup, calories, sugar; "millisecond" barcode response | ¥28/month or ¥68/year |
| **知了-码上查** | aiifood.cn | Barcode, photo, shopping screenshot | Ingredient and additive query with "authoritative" science notes, snack and drink focus | Freemium |
| **配料查** | HFJMT | Barcode | Additive details and risk level, controversial-ingredient screening; no ads | Free |
| **配料查查** / **食安安** | same vendor, renamed | Barcode, photo | Ingredients, additives, calories, sugar; history by food type | Freemium |
| **加点料** | indie | Photo of label | OCR and analysis of additives, their function and potential harm; explicitly anti-hextech | Freemium |
| **查添加剂 / 易查** | indie | Photo of label | OCR 95%+, 3-second analysis against GB 2760-2024, 22 additive categories, safety level and health-risk advice | Freemium |
| **明白配料** | indie | Photo of label | OCR plus built-in additive encyclopedia with safety and allergen info | Freemium |
| **食安专家** | indie | Search | AI plus knowledge base for additives, pesticide and heavy-metal residues | Free |
| **有食问问** | indie | Search, photo | Food composition queries | Free |

### Government and semi-official tools

- **条码追溯** (China Article Numbering Center, under former AQSIQ): scan a barcode to
  get official product registration and traceability data. No health judgment.
- **食品抽检信息查询 / 食安查**: aggregated government sampling-inspection results
  (抽检). Tells you if a batch failed inspection, not whether ingredients are
  unhealthy.

### Big platforms

- **薄荷健康 (Boohee / Mint Health)**: 1M+ item mostly-Chinese food database with
  calories and nutrients, photo calorie estimation, weight-loss focus. It has
  barcode lookup for nutrition facts but is not an additive-warning app.
- **我查查 (Wochacha)**: the classic Chinese barcode price-comparison app; has
  basic product info but no health-risk analysis.
- **Keep, 美团, 大众点评, 京东**: no additive-scanning feature.

### WeChat mini programs

Several small mini programs do barcode + OCR + AI label analysis (for
example the open-source Vue + mini-program project on Bilibili cv45105717).
Most are student or indie projects; none has scale.

### Gaps in the China market

1. **No dominant brand.** Fragmented, low-budget indie apps with near-identical
   names (配料查, 配料查查, 查添加剂). Trust and brand are open.
2. **Weak barcode databases.** Most rely on OCR of the label photo because
   there is no open Chinese equivalent of Open Food Facts; coverage of
   domestic barcodes is poor. Building or crowd-sourcing a Chinese product
   DB is the moat.
3. **Compliance-only framing.** Apps mostly check whether an additive is
   legal under GB 2760, not whether the product is healthy for *you*.
   Personalization to conditions (糖尿病, 高血压, 痛风, 婴幼儿, 孕期) is absent.
4. **No credible health score.** Nothing like Nutri-Score or NOVA is
   standardized in China; an explainable, dose-aware score is open ground.
5. **Distribution favors WeChat mini programs** over standalone apps for
   first use at the supermarket shelf.

### China sources

- https://sj.qq.com/appdetail/com.chengfenmiao.app (成分喵)
- https://sj.qq.com/appdetail/com.foodidentifyandroid.FoodIdentificationTool (剂查查)
- https://apps.apple.com/us/app/id6736932686 (剂查查 iOS)
- https://app.mi.com/details?id=cn.aiifood.zhiliao (知了码上查)
- https://apps.apple.com/cn/app/id6749419054 (知了 iOS)
- https://sj.qq.com/appdetail/com.hfjmt.ingredientlistquery (配料查)
- https://apps.apple.com/cn/app/id6739276996 (配料查查 / 食安安)
- https://apps.apple.com/app/id6443815603 (加点料)
- https://apps.apple.com/us/app/id6749378689 (易查 / 查添加剂)
- https://apps.apple.com/iq/app/%E6%98%8E%E7%99%BD%E9%85%8D%E6%96%99/id6757126519 (明白配料)
- https://apps.apple.com/hn/app/id651339798 (条码追溯)
- https://apps.apple.com/in/app/id1249907128 (食品抽检信息查询)
- https://baike.baidu.com/en/item/Boohee/81933 (薄荷健康)
- https://www.bilibili.com/read/cv45105717 (WeChat mini-program project)
- https://k.sina.com.cn/article_7879848902_1d5acf3c606801973g.html (2026 parenting app roundup naming 剂查查 / 成分喵)
