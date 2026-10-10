# Household and personal-care scanner: rough product design and low-legal-risk information model

Status: draft v0.2, 2026-10-10 (v0.1 2026-10-06; BIT example corrected). Companion to
`docs/research/toxic-product-scanner-analysis.md`.

## 0. One-paragraph summary

A mobile app (plus WeChat mini program for China) that scans the barcode or
ingredient panel of a household or personal-care product and shows the
user, in plain language, **which listed substances it contains, who lists
them and why, how much of the formula is undisclosed, and whether it fits
the avoidance preferences the user chose**. It never says a product is
"toxic", "dangerous" or "safe". It reports facts from named authorities,
shows exposure context, and lets the user's own profile produce the
verdict. This is both the scientifically defensible position and the
legally defensible one.

## 1. Scope

**In scope (v1)**

- Personal care: shampoo, body wash, deodorant, lotion, sunscreen, toothpaste, makeup, perfume, baby care.
- Household: laundry detergent, fabric softener, dryer sheets, dish soap, surface cleaners, air fresheners, scented candles, insect repellent.
- Markets: US and EU first (ingredient disclosure is mandatory for cosmetics), China second (cosmetics mandatory; household partial).

**Out of scope (v1)**

- Food (separate app, shared stack).
- Cookware, furniture, textiles: no ingredient label to parse.
- Any efficacy or skin-type recommendation (that is 美丽修行's lane).
- Medical diagnosis or treatment advice.

## 2. Core design principle: facts, attribution, exposure, user choice

Every piece of information shown must pass four tests:

| Test | Question | Why |
|---|---|---|
| **Factual** | Is this a verifiable statement about a document, list or label, not our opinion about the product? | Truth is a complete defense to defamation and disparagement in the US, EU and China. |
| **Attributed** | Does the UI name the authority (EU Annex III, California Prop 65, IARC Group 2B, NMPA 禁用目录) next to the statement? | Repeating what a regulator says is far safer than characterizing a product ourselves. |
| **Exposure-aware** | Does it say how the product is used (leave-on, rinse-off, aerosol, combustion) and what limits apply? | Removes the "hazard not risk" critique and shows good faith. |
| **User-chosen** | Is the verdict derived from preferences the user selected? | "Does not match your preferences" is a statement about the user, not about the product. |

## 3. User experience

### 3.1 Flows

```
Onboarding ──> Profile (what I want to avoid) ──> Home
                                                   │
          ┌──────────────┬──────────────┬──────────┴──────┐
          ▼              ▼              ▼                 ▼
      Scan barcode   Photo label    Search name     Home audit
          │              │              │              (room-by-room)
          └──────┬───────┴──────────────┘
                 ▼
        Product result card
                 │
     ┌───────────┼─────────────┬──────────────┐
     ▼           ▼             ▼              ▼
 Ingredient   Disclosure    Your match     Alternatives
  detail       detail       detail         (same category,
 (per flag)  (fragrance,                   fewer flags for
              "other"...)                   your profile)
```

### 3.2 Onboarding and profile

The profile is the legal hinge: it turns "we judge the product" into
"you set rules, we apply them".

```
┌────────────────────────────────────────┐
│ What do you want to avoid?             │
│ You can change this any time.          │
│                                        │
│ Life stage                             │
│  ( ) None  (•) Pregnant / trying       │
│  ( ) Infant in home  ( ) Child <12     │
│                                        │
│ Avoid substances listed as             │
│  [x] Prohibited or restricted (EU/US/CN)│
│  [x] Known or probable carcinogens      │
│      (IARC 1, 2A; Prop 65)             │
│  [x] Endocrine disruptors              │
│      (EU ED list, ECHA)                │
│  [ ] Suspected endocrine disruptors    │
│      (advocacy lists: SIN, TEDX)       │
│  [x] Fragrance allergens (EU 82 list)  │
│  [x] Undisclosed "fragrance/parfum"    │
│  [ ] PFAS   [ ] Microplastics           │
│  [ ] Formaldehyde releasers            │
│                                        │
│ My allergies / sensitivities           │
│  [ limonene ] [ linalool ] [ + add ]   │
│                                        │
│ Strictness                             │
│  Regulatory only ──●────── Precautionary│
│                                        │
│            [ Continue ]                │
└────────────────────────────────────────┘
```

Defaults are conservative on **regulatory** lists and off for **advocacy**
lists. The strictness slider changes which evidence tiers count toward
"your match" (see section 5).

### 3.3 Product result card

This is the screen that carries all the legal weight. Design rules:

1. No overall numeric "safety score" or red/green product verdict.
2. Three factual blocks, then one user-relative block.
3. Every flag has a source chip and a "why listed" sentence quoted or
   paraphrased from the source.
4. Confidence of the product match is visible.

```
┌────────────────────────────────────────┐
│ ◀  Brand X Lavender Laundry Detergent   │
│    Liquid, 1.5 L · Matched by barcode ✓ │
│    Ingredients from: label photo, 3 Oct │
│    Report a problem with this listing  ⓘ│
├────────────────────────────────────────┤
│ DISCLOSURE                              │
│ 14 of 15 ingredients named.             │
│ "Fragrance" is not broken down.         │
│ Brand transparency: partial  ⓘ          │
├────────────────────────────────────────┤
│ LISTED SUBSTANCES  (3)                  │
│                                         │
│ ● Benzisothiazolinone                   │
│   Classified · ECHA CLP Skin Sens. 1    │
│   "may cause an allergic skin reaction" │
│   Not on EU Annex V (permitted cosmetic │
│   preservatives)                        │
│   Exposure: rinse-off, residue on       │
│   fabric                                │
│                                         │
│ ● Fragrance / Parfum                    │
│   Undisclosed mixture · US and EU law   │
│   do not require components to be      │
│   listed. 2 allergens declared:         │
│   Limonene, Linalool (EU 82 list)       │
│                                         │
│ ● Sodium laureth sulfate                │
│   Not restricted · Appears on 1         │
│   advocacy list (shown because your     │
│   strictness is "precautionary")        │
├────────────────────────────────────────┤
│ EXPOSURE CONTEXT                        │
│ Product type: rinse-off, fabric contact │
│ Typical use: daily, indirect skin       │
│ contact via clothing                    │
├────────────────────────────────────────┤
│ YOUR MATCH                              │
│ Does not match 2 of your preferences:   │
│  • Undisclosed fragrance                │
│  • Contains limonene (your allergy)     │
│ [ See alternatives in this category ]   │
├────────────────────────────────────────┤
│ Sources (6) · Methodology · Not medical │
│ advice · Brand? Claim this listing      │
└────────────────────────────────────────┘
```

Note what is absent: the words toxic, dangerous, harmful, unsafe, poison,
cancer-causing (as our assertion), "avoid this product", and any
petition, campaign or call to action against the brand.

### 3.4 Ingredient detail

```
┌────────────────────────────────────────┐
│ ◀  Benzisothiazolinone (BIT)            │
│    CAS 2634-33-5 · INCI: Benzisothiazolinone │
├────────────────────────────────────────┤
│ What it does                            │
│ Preservative (biocide) that stops       │
│ bacteria and mould growing in liquids.  │
├────────────────────────────────────────┤
│ Who lists it, and what they say         │
│                                         │
│ ECHA harmonised classification (CLP)    │
│  Skin Sens. 1 ─ "May cause an allergic  │
│  skin reaction." Eye Dam. 1,            │
│  Acute Tox. 4.                  [source]│
│                                         │
│ EU Cosmetics Reg. Annex V               │
│  Not listed: not a permitted            │
│  preservative in EU cosmetics. Used in  │
│  detergents under the Biocidal Products │
│  Regulation.                   [source] │
│                                         │
│ IARC: not evaluated                     │
│ Prop 65: not listed                     │
├────────────────────────────────────────┤
│ Evidence strength      ■■■□  Regulatory │
│ Exposure in this product                │
│  Rinse-off; concentration not declared. │
├────────────────────────────────────────┤
│ Plain-language note (reviewed by DABT   │
│ toxicologist, v3, 2026-09-12)           │
│  BIT is a recognised skin sensitiser.   │
│  People who have developed an allergy   │
│  to it may react to fabric residues.    │
│  For others, regulators consider the    │
│  permitted levels acceptable.           │
├────────────────────────────────────────┤
│ Last data check: 2026-10-01  Versions ▸ │
└────────────────────────────────────────┘
```

### 3.5 Alternatives

Only shown within the same category and only ranked by **the user's
profile**: "products in this category with fewer mismatches to your
preferences". Never "safer" or "healthier". No affiliate links on this
screen in v1 (see section 6.5).

### 3.6 Home audit

Room-by-room checklist (bathroom, laundry, kitchen, nursery, living room)
that walks the user through scanning what they own, then shows a summary
of listed substances and undisclosed fragrance across the home. This is
the Burkart-audience retention feature. Same copy rules apply.

## 4. System architecture

```
┌──────────────┐   ┌───────────────┐   ┌─────────────────────┐
│ Mobile app   │   │ WeChat mini   │   │ Web (brand portal,  │
│ iOS/Android  │   │ program (CN)  │   │ claims, corrections)│
└──────┬───────┘   └──────┬────────┘   └──────────┬──────────┘
       └──────────────────┼───────────────────────┘
                          ▼
                 ┌─────────────────┐
                 │  API gateway    │
                 └────────┬────────┘
     ┌────────────────────┼─────────────────────┐
     ▼                    ▼                     ▼
┌───────────┐   ┌──────────────────┐   ┌────────────────┐
│ Product   │   │ Rules & evidence │   │ Profile & match│
│ resolver  │   │ engine           │   │ service        │
│ barcode → │   │ INCI → flags     │   │ user prefs ×   │
│ product;  │   │ with sources,    │   │ flags → match  │
│ OCR → INCI│   │ tiers, exposure  │   │                │
└─────┬─────┘   └────────┬─────────┘   └────────────────┘
      │                  │
      ▼                  ▼
┌──────────────┐  ┌──────────────────────────────────┐
│ Product DB   │  │ Reference DB (versioned, signed) │
│ (ours + Open │  │ CosIng · EU Annexes · ECHA CLP   │
│ Beauty Facts │  │ Prop 65 · IARC · CA Safe Cosmetics│
│ mirror)      │  │ EU ED list · NMPA 规范 · IFRA ·   │
│              │  │ SIN/TEDX (tier C)                 │
└──────────────┘  └──────────────────────────────────┘
```

**Product resolver.** Barcode first (GS1 GTIN) against our DB, then Open
Beauty Facts, then prompt the user to photograph the ingredient panel.
OCR output is normalized to INCI names via CosIng synonyms. The user
confirms the extracted list before any flags are shown (this also creates
a record that the user, not us, asserted the ingredients).

**Rules and evidence engine.** Pure function: `(ingredient list,
product category) -> [Flag]`. Each Flag is `{substance, source_id,
source_entry, source_quote, evidence_tier, restriction (limit, product
types), exposure_route, reference_version}`. No free text is generated at
runtime. All plain-language notes are pre-written, reviewed and versioned.

**Reference DB.** Each source is ingested by a scripted importer with the
source URL, retrieval date, checksum and license recorded. Every flag shown
to a user can be traced to a specific version of a specific list.

**Profile and match.** Runs on device where possible. The "your match"
block is computed from the user's stored preferences and the flag list.
Preferences are never sent to third parties.

**Brand portal.** Brands can claim a listing, upload a current ingredient
list and a certificate of analysis, and file a correction. Corrections
have a published SLA (see 6.4).

### 4.1 Evidence tiers

| Tier | Sources | Default visibility | How we phrase it |
|---|---|---|---|
| **A: Regulatory** | EU Annex II/III/V/VI, US FDA prohibited list, CA Prop 65, NMPA 禁用/限用, Health Canada Hotlist | Always on | "Prohibited in EU" / "Restricted in EU to X% in rinse-off" |
| **B: Authoritative scientific** | IARC monographs, ECHA harmonised CLP, SCCS opinions, EU endocrine disruptor list, NTP RoC | On by default | "Classified by IARC as Group 2B (possibly carcinogenic)" |
| **C: Advocacy / screening** | ChemSec SIN List, TEDX, EWG Skin Deep (if licensed), Made Safe banned list | Off by default; on at "precautionary" strictness; always labeled "advocacy list" | "Appears on the SIN List, an NGO screening list" |
| **D: Label-derived facts** | Undisclosed fragrance, allergen declarations, "may contain" statements | Always on | "Fragrance components not disclosed" |

Never show a Tier C flag without the label "advocacy list" and the
reason the user is seeing it.

### 4.2 Exposure model

Per product category we store: route (dermal leave-on, dermal rinse-off,
inhalation aerosol, combustion, oral incidental), frequency class, and
applicable regulatory limits. The flag copy picks the matching restriction
("max 0.05% in rinse-off") and the result card shows the exposure block.
We do **not** compute a risk number because we do not know concentrations;
we say so explicitly.

## 5. Match logic (the only "verdict" in the app)

```
match(profile, flags):
  mismatches = []
  for flag in flags:
    if flag.tier == A and profile.avoid_regulatory: mismatches += flag
    if flag.tier == B and flag.category in profile.avoid_categories: mismatches += flag
    if flag.tier == C and profile.strictness == precautionary: mismatches += flag
    if flag.tier == D and flag.kind == undisclosed_fragrance and profile.avoid_undisclosed: mismatches += flag
    if flag.substance in profile.allergens: mismatches += flag
    if profile.life_stage in (pregnant, infant) and flag.has_repro_or_dev_endpoint: mismatches += flag
  return "Matches your preferences" if empty else f"Does not match {n} of your preferences", mismatches
```

Output vocabulary is fixed: *Matches your preferences* / *Does not match
N of your preferences* / *Not enough information (ingredients
unavailable)*. Nothing else.

## 6. Legal-risk controls, by risk

### 6.1 Defamation, product disparagement, unfair competition

Precedents that shape the design:

- **Yuka v. FICT / ABC Industrie (France).** First-instance courts found
  "dénigrement" and unfair commercial practice. Appeals courts (Aix 2023,
  Paris June 2023) reversed, affirming the right to inform consumers, and
  awarded Yuka costs. The lower courts' concrete objection was the direct
  link from product pages to an anti-nitrite petition, which turned
  information into a campaign against named producers.
- **GOLO v. HighYa (US).** Review content that analyzes products without
  purchase recommendations or affiliate ties was held to be
  non-commercial speech, outside the Lanham Act's false-advertising reach.
- **FEBEA white paper (France).** Industry's standing complaint is that
  apps lack scientific rigor and spread "unjustified fears".
- **China 反不正当竞争法 第11条 (商业诋毁).** Fabricating or spreading false or
  misleading information that harms a competitor's reputation is
  actionable; truth and non-competitor status are the defenses, and the
  bar for "misleading" is lower than in the US.

Design responses:

1. **Report, don't characterize.** UI copy is restricted to a controlled
   vocabulary (section 7). Every statement about a substance is a quote
   or close paraphrase of a named source, with a link.
2. **No product-level verdict from us.** The only verdict is the user's
   preference match. We never rank brands as "worst" or publish lists of
   "most toxic products".
3. **Separate advocacy from information.** No petitions, campaigns,
   brand call-outs, or "complain to the brand" buttons inside product
   pages (Yuka's 2024 "complain to brand" feature is exactly what the
   French lower courts punished). If we ever run advocacy, it lives in a
   separate section with no product deep links.
4. **Non-commercial posture.** No affiliate links, no sponsored
   placements, no brand licensing seal, no "verified" program in v1.
   Revenue is user subscription only. This keeps us on the HighYa side of
   the commercial-speech line and removes the EWG-Verified conflict story.
5. **We are not a competitor.** We sell no products. State this in Terms
   and About.

### 6.2 Accuracy and data-quality failures (the realistic way to get sued)

Most real exposure comes from being *wrong*: stale formulation, wrong
barcode match, OCR error, outdated list.

1. **Match confidence shown** on every card ("Matched by barcode" vs
   "Ingredients from user photo"). Low-confidence results show a banner
   asking the user to confirm the label.
2. **User confirms OCR output** before flags render.
3. **Formulation date** shown; results older than 18 months get a
   "formulation may have changed" notice.
4. **Versioned, signed reference lists** with retrieval dates; an
   ingestion diff is reviewed by a human before release.
5. **Correction SLA**: brand or user reports a factual error -> listing
   is marked "under review" within 24h, resolved within 5 business days,
   with a public change log. Fast, visible correction is the strongest
   practical defense and what courts look at for good faith.
6. **Toxicologist review** (board-certified, e.g. DABT) of every
   plain-language note, with reviewer, version and date displayed.
7. **No generative text at runtime.** LLMs may be used offline to draft
   notes for review, never to produce user-facing claims on the fly.

### 6.3 Health and medical claims (regulators and app stores)

- Apple Guideline 1.4.1 and Google's equivalent require citations for
  health information and a reminder to consult a professional. Every
  flag has a citation; the footer and onboarding carry "This app reports
  published regulatory and scientific information. It is not medical
  advice. Consult a doctor for health decisions."
- No claims that using the app will prevent disease, improve fertility,
  or "detox". Marketing copy is reviewed against the same controlled
  vocabulary.
- Allergy features are framed as "substances you asked us to flag", not
  as allergy diagnosis.

### 6.4 Brand right of reply

- Public, free **claim your listing** flow with identity verification.
- Brands can attach the current INCI list, concentration ranges for
  restricted substances (optional), and a statement that is displayed
  verbatim under "Brand response".
- A dispute flow with a named internal owner and the SLA above.
- Annual transparency report: number of corrections, median time to fix.

### 6.5 Monetization constraints

Allowed in v1: subscription (unlimited scans, home audit, export).
Not allowed in v1: affiliate links, brand advertising, paid placement,
certification seals, selling products. Revisit only with counsel, and if
added, keep them physically separated from result cards and alternatives.

### 6.6 Licensing and data provenance

- Open Beauty Facts and Open Food Facts are ODbL: attribute, and
  share-alike any redistributed derived database. Contribute our barcode
  additions back.
- EU CosIng, ECHA, IARC, Prop 65, CA Safe Cosmetics, NMPA lists are
  public records; cite them.
- Do not scrape EWG Skin Deep or Yuka. License or omit.
- Store the license, URL, retrieval date and checksum for each source.

### 6.7 Privacy

- Health-adjacent profile data (pregnancy, allergies) stays on device or
  is end-to-end encrypted; never sold or shared.
- GDPR special-category handling in EU; PIPL in China (local hosting,
  consent, no cross-border transfer of profile data).
- Scan history is optional and deletable.

### 6.8 Jurisdiction-specific notes

| | US | EU / France | China |
|---|---|---|---|
| Main risk | Trade libel, Lanham Act if commercial | Dénigrement, unfair commercial practice | 商业诋毁 (AUCL art. 11), 广告法 if any ad |
| Best defense | Truth, opinion, non-commercial speech, anti-SLAPP | Right to inform, factual accuracy, no campaign linkage | Cite NMPA/GB standards only; avoid NGO lists; avoid superlatives (广告法 bans 最/第一 anyway) |
| Extra requirements | FTC endorsement rules if any creator partnership (disclose) | GDPR | ICP filing, algorithm registration if recommendations are personalized, PIPL, content review |

For China, ship with Tier C (advocacy lists) disabled entirely and
Tier A limited to NMPA 禁用/限用 and GB standards, plus EU/US regulatory
facts stated as foreign facts ("restricted in the EU").

## 7. Controlled vocabulary for user-facing copy

| Never | Instead |
|---|---|
| toxic, poison, dangerous, harmful, unsafe, bad | "listed as", "classified by X as", "restricted in", "not permitted in" |
| causes cancer / infertility | "classified by IARC as Group 2B (possibly carcinogenic to humans)"; "listed by California under Prop 65 for reproductive toxicity" |
| safe, clean, non-toxic, healthy | "no listed substances found", "matches your preferences", "fully disclosed" |
| avoid this product, don't buy | "does not match N of your preferences", "see alternatives in this category" |
| worst, most toxic, dirtiest | (never rank products or brands) |
| hidden, secret, loophole (about a brand) | "not disclosed; disclosure is not required by US/EU law" |
| proven, confirmed, known (unless quoting a Tier A/B source that uses that word) | "classified", "listed", "evaluated" |

Every string in the app is in a reviewed copy file; adding a new string
requires review against this table.

## 8. MVP plan

| Phase | Weeks | Deliverable |
|---|---|---|
| 0 | 1-2 | Ingest Tier A and D sources (EU Annexes, Prop 65, CA Safe Cosmetics, NMPA lists, EU 82 allergens); INCI normalizer; 200 hand-verified products across 8 household categories |
| 1 | 3-6 | iOS/Android app: profile, barcode scan, OCR with user confirmation, result card, ingredient detail, sources. Subscription only. Toxicologist reviews all notes |
| 2 | 7-9 | Tier B sources (IARC, ECHA CLP, EU ED list); exposure model; alternatives; brand claim portal and correction SLA |
| 3 | 10-12 | Home audit; EU 82-allergen parser ahead of 31 July 2026 label change; WeChat mini program with CN rule set |
| 4 | later | Tier C toggle with counsel review; creator partnership with FTC disclosures; browser extension for online shopping |

## 9. Open questions

1. Will users accept "does not match your preferences" instead of a
   red/green score? Test in onboarding research; the slider may be the
   compromise.
2. Concentration data: can we get brands to disclose ranges via the
   portal, which would let us show "within/over EU limit"?
3. Candles and air fresheners have no ingredient list in the US. Options:
   SDS lookup, brand portal, or honest "not enough information".
4. Whether to license EWG Skin Deep as a Tier C source or skip it.
5. Counsel review of this document in US, FR and CN before build.

## Sources

- https://www.foodtimes.eu/consumers-and-health/nitrites-in-cured-meats-aix-en-provence-court-of-appeals-agrees-with-yuka/
- https://www.foodtimes.eu/?p=81535
- https://www.reussir.fr/lesmarches/nitrites-yuka-est-condamnee-pour-denigrement-et-fait-appel
- https://www.europe1.fr/technologies/lapplication-yuka-denigre-les-charcutiers-traiteurs-juge-un-tribunal-4048130
- https://tushnet.com/2018/05/08/exercise-company-affiliation-and-ad-revenue-dont-make-diet-review-into-commercial-speech/
- https://www.ballardspahr.com/insights/alerts-and-articles/2018/06/pa-federal-court-holds-consumer-review-website-was-not-engaged-in-commercial-speech
- https://cosmeticsbusiness.com/cosmetic-safety-apps-need-greater-scientific-evidence-to-avoid-misleading-shoppers-warns-f-bea-148572
- https://developer.apple.com/forums/thread/696430
- https://conductatlas.com/platform/apple/apple-app-store-review-guidelines/provision/CA-P-018796/medical-apps-with-inaccurate-data-may-be-rejected/
- https://techcrunch.com/2024/11/18/yuka-the-app-that-rates-food-and-makeup-lets-users-complain-to-brands-with-its-new-feature
- https://www.ewg.org/ewgverified/how-we-work-with-companies.php
- https://cosingchecker.com/annex/
- https://coslaw.eu/fragrance-allergens-july-eu-deadline-faq/
