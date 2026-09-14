# Research: location APIs, passkey auth, and POI data licensing

Verified 14 Sep 2026 against live vendor pages (fetches by research sub-agent). Feeds the "human-readable location codes" and identity decisions.

## what3words

- Conversion (coordinates ⇄ w3w address) requires a paid plan: **Basic £7.99/mo** (1,000 conversions/mo); Standard £35, Plus £99, Premium £235.
- Free plan: AutoSuggest only (5 req/s), explicitly a try-it-out tier.
- Emergency services free; **NGO/charity plans available** — relevant since To Boldly Go is not-for-profit; worth applying later.
- Source: https://what3words.com/pricing

## Free location deep links (no key, no billing)

- Google Maps URLs: `https://www.google.com/maps/search/?api=1&query=lat,long` — "You don't need a Google API key to use Maps URLs." https://developers.google.com/maps/documentation/urls
- Apple Maps unified URLs: `https://maps.apple.com/?ll=lat,long` — OS capability, no key. https://developer.apple.com/documentation/mapkit/unified-map-urls

## Open Location Code (Plus Codes)

- Google's open-source w3w equivalent. Encode/decode offline in JS (`open-location-code`), no API, no cost. Candidate as the free "human-readable location code".

## MapKit JS (Apple web maps)

- Free daily limits (250k views / 25k service calls) are **per Apple Developer Program membership ($99/yr)** — fails the free-running-costs rule; deep links do not need it. https://developer.apple.com/maps/web/

## Google Maps Platform

- Old $200/mo credit ended 28 Feb 2025. Maps JavaScript API: 10k free loads/mo, then $7/1k. Maps Embed API: unlimited free. We don't need map rendering for a screen-reader-first app. https://developers.google.com/maps/billing-and-pricing/pricing

## Amazon Cognito (identity)

- Passkeys (WebAuthn) are a supported **first** auth factor (`WEB_AUTHN` in `AllowedFirstAuthFactors`) — passwordless, no email.
- Requires **Essentials** tier (not Lite). Essentials: **10,000 MAU/mo free** (doesn't expire); passkeys add no per-auth cost. Passkeys-only pool ≤10k MAU = **$0/mo**.
- **eu-west-2 (London): served** — `cognito-idp.eu-west-2.amazonaws.com`; no regional restriction on passkeys (tier-gated only).
- **Identity Pools are free** and issue temporary AWS credentials so the browser can talk **directly to DynamoDB** under scoped IAM (no Lambda/AppSync in the path). https://aws.amazon.com/cognito/pricing/

## OpenStreetMap (POI catalogue source)

- ODbL v1.0: bundling a derived static POI dataset is permitted — attribution ("© OpenStreetMap contributors") + share-alike applies to the dataset, not app code.
- Source bulk data from **Geofabrik extracts / planet dumps**, NOT Nominatim (bulk downloads discouraged). https://www.openstreetmap.org/copyright · https://operations.osmfoundation.org/policies/nominatim/

## Implications

1. v1 location codes: **Plus Codes (offline, open) + free Google/Apple deep links**; w3w only if charity/NGO pricing is secured later.
2. Q2 backend choice (Cognito passkeys + Identity Pool → direct DynamoDB, zero custom compute) is **confirmed viable at $0** in eu-west-2.
3. POI catalogue: build from Geofabrik UK/EU extracts with ODbL attribution and share-alike licensing on the dataset.
