# PayoutCheck
Free, browser-only CSV payout reconciliation. No server, no accounts, no uploads.

## Run
Open `index.html` in a browser (or `python3 -m http.server`). Scripts are plain `<script>` tags, so it works from `file://`.

## Use
New reconciliation → upload CSV → map columns → Reconcile → review, export, save. History lives in browser LocalStorage; clearing browser data erases it.

## Rules
- Money is stored as integer cents (2 decimals; zero-decimal currencies like JPY are not supported yet).
- Difference = Expected − Total received. Exact match only, no tolerance.
- Expected amount is counted once per payout; received rows are summed (negatives = adjustments).
- Blank expected = ignored; blank received = no transfer (0).
- Errors block results: missing ID, invalid amount, conflicting expected amounts, mixed currencies, no expected amount, empty file.

## Tests
`node tests/run.js` (no dependencies). Covers the calculator, strict money parsing, CSV parsing/row validation, column mapping validation, export injection and the LocalStorage layer (incl. corrupted data). UI wiring in `js/app.js` is not covered by automated tests.

## Changelog (v1.1)
- Export: all text fields neutralise `= + - @ tab CR` (also after leading spaces); amounts are written from integer cents so negatives stay numeric.
- Mapping: duplicate/missing columns are blocked live with a clear message; the preview labels each mapped column; Reconcile is disabled while invalid.
- Money: strict grammar (`1234.56`, `1,234.56`, `-5.00`, `(5.00)`, `$5`); rejects `1,23`, `1.234`, `1e5`, etc.; unsafe integers rejected. Two decimals only (documented in the UI).
- CSV: every row must match the header's cell count (error shows the line number); multiline fields, BOM, CRLF/LF supported.
- Currency: valid 3-letter code required per row when a currency column is mapped; one currency per file; selector is disabled when a column is mapped; amounts always display with 2 decimals.
- Storage: records are validated and totals recomputed on load; unreadable records are kept (and reported), corrupted JSON is backed up, delete removes only the chosen record.
- UX: new upload clears old results; double file submissions are ignored while reading; results/mapping screens can't open without data.

## Advertising integration (disabled by default)

PayoutCheck includes responsive ad placements on the dashboard, results, and history screens. No ads are live: `js/ads-config.js` currently sets `AD_PROVIDER` to `"none"` and `ADS_ENABLED` to `false`. In that state, ad containers stay hidden and **no provider script or network request is made**. Upload, mapping, and manual-entry workflows never contain ad placements.

### Provider setup (Google AdSense example)

1. Register and add a site you own at [Google AdSense](https://adsense.google.com/start/). Complete Google's site verification and approval process.
2. In the approved AdSense account, obtain the publisher ID (`ca-pub-...`) and create responsive display ad units for the placements you want. Copy each unit's numeric slot ID.
3. In [js/ads-config.js](./js/ads-config.js), set `AD_PROVIDER` to `"adsense"`, replace `AD_PUBLISHER_ID`, and replace the individual values in `AD_SLOTS`. Leave a slot's placeholder unchanged to keep that placement off.
4. Set `ADS_ENABLED` to `true` only after configuring at least one real slot and confirming the network permits ads on this site and this type of product. The AdSense adapter in [js/ads.js](./js/ads.js) loads Google's official responsive ad script once, then renders only configured slots. The script is loaded on demand; there is no automatic ad refresh.
5. To disable all ads again, set `ADS_ENABLED` to `false`. This also prevents loading the provider script.

`js/ads-config.js` is the only file where publisher settings and slot IDs need to be changed. Keep credentials that are actually secret (API keys, access tokens, passwords) out of this browser-side project. Publisher and ad-unit IDs are public identifiers, not secrets.

### Placement and testing

- `dashboardTop` sits between the dashboard KPIs and overview cards; `dashboardBottom` is optional.
- `resultsTop` sits between the results summary and the payout table. Ads are never inserted in the table.
- `historyMiddle` sits between the saved-session summary and its records.
- Ad frames reserve responsive space and are visually labelled “Advertisement.” If a request is blocked or fails, reconciliation remains usable and the slot reports that the ad is unavailable.
- With ads disabled, verify in browser developer tools that the slots are absent/hidden and there is no request for `adsbygoogle.js`. To inspect placement without requesting ads, temporarily remove `hidden` from a rendered `.ad-slot` in DevTools; do not add fake provider IDs or scripts. For a real serving check, use an approved, deployed domain and configured ad units, disable ad blockers for that test, and **never click your own ads**.

### Approval, policy, and privacy

Ads are not live until the provider has approved the account/site and real ad units are configured. Google's responsive ad-unit markup is based on its [official AdSense guidance](https://support.google.com/adsense/answer/9183460). Before enabling AdSense, review its [program policies](https://support.google.com/adsense/answer/48182) and verify that this reconciliation tool is eligible: Google's policy guidance restricts ads in software applications. If AdSense does not permit this product, keep it disabled and choose a network whose terms explicitly allow it.

The adapter does not put CSV contents, payout IDs, financial amounts, or reconciliation results into ad parameters, slot IDs, URLs, or provider configuration. However, a third-party ad script runs in the page that displays financial information; this client-side app cannot technically guarantee that a provider script will not inspect page content. Keep ads disabled until the provider's data handling has been reviewed and your privacy notice/consent flow is appropriate. Google requires a Google-certified CMP integrated with the IAB TCF for personalized ads served in the EEA, UK, and Switzerland; see its [publisher consent requirements](https://support.google.com/adsense/answer/13554116). This project does not include a CMP. Add and validate the appropriate consent solution before enabling ads where required.

### Consent gate setup

`REQUIRE_CONSENT` is `true` by default. After integrating the provider-appropriate consent platform, have its consent callback call `PC.ads.setConsent(true)` only when its policy and the user's choice allow ads; call `PC.ads.setConsent(false)` on rejection or withdrawal. Until granted, slots remain hidden and the ad script is not loaded. For AdSense traffic in the EEA, UK, or Switzerland, use Google's current certified CMP/TCF flow as applicable; do not bypass this gate by turning `REQUIRE_CONSENT` off without confirming the legal and provider requirements for your audience.

For another provider, leave the placements and `AD_SLOTS` mapping in place, add its adapter in `js/ads.js`, and set `AD_PROVIDER` to the adapter name. The application UI does not need provider-specific changes.
