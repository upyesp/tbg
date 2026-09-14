# POI Taxonomy — v1 draft for review

Scope: UK (Geofabrik UK extract). Each Subtype maps to OpenStreetMab tags used to build the bundled catalogue. Review and edit freely — nothing here is code yet.

## Transport

| Subtype | OSM tag(s) |
| --- | --- |
| Railway station | `railway=station` |
| Metro/light-rail station | `railway=station` + `station=subway`, `railway=halt` |
| Tram stop | `railway=tram_stop` |
| Bus stop | `highway=bus_stop` |
| Coach station | `amenity=bus_station` |
| Airport | `aeroway=aerodrome` |
| Ferry terminal | `amenity=ferry_terminal` |
| Taxi rank | `amenity=taxi` |

## Health

| Subtype | OSM tag(s) |
| --- | --- |
| Hospital | `amenity=hospital` |
| GP / doctor surgery | `amenity=doctors` |
| Pharmacy | `amenity=pharmacy` |
| Dentist | `amenity=dentist` |

## Amenity

| Subtype | OSM tag(s) |
| --- | --- |
| Public toilet | `amenity=toilets` |
| ATM | `amenity=atm` |
| Drinking water | `amenity=drinking_water` |
| Post box | `amenity=post_box` |

## Civic

| Subtype | OSM tag(s) |
| --- | --- |
| Library | `amenity=library` |
| Town hall | `amenity=townhall` |
| Place of worship | `amenity=place_of_worship` |
| Police station | `amenity=police` |
| Post office | `amenity=post_office` |

## Commerce

| Subtype | OSM tag(s) |
| --- | --- |
| Supermarket | `shop=supermarket` |
| Bank / ATM branch | `amenity=bank` |
| Shop (general, by shop type) | `shop=*` (whitelist of common types) |

## Parking

| Subtype | OSM tag(s) |
| --- | --- |
| Car park | `amenity=parking` (incl. `parking=multi-storey|surface|underground`) |
| Drop-off point | no single OSM tag — curated manually + `highway=layby` candidates |

## Notes

- Names come from OSM `name` tags; entries without a name are excluded (a nameless point is useless when spoken).
- Each catalogue entry carries: name, POI Type, POI Subtype, lat/long, and the source OSM element id (for refreshes).
- Dataset build: Geofabrik UK extract → filter by tags above → ODbL attribution ("© OpenStreetMap contributors") + share-alike on the dataset (verified, see docs/research/location-apis-and-passkey-auth.md).
