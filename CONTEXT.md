# To Boldly Go

A progressive web app that helps blind and vision-impaired travellers plan journeys in advance and follow them with minimal interaction. Lives at tbg.life; "tbg" is short for To Boldly Go.

## Language

### Journey planning

**Place**:
A named point (latitude/longitude) the user saves and maintains, like an address-book entry, with an optional note.
_Avoid_: location, address, POI (for user-saved points)

**POI**:
A point from the built-in, read-only catalogue, classified by POI Type and POI Subtype.
_Avoid_: point of interest (spelled out), pin, landmark

**Stop**:
A Place or POI assigned a position in a Journey Plan, carrying an optional journey-specific note.
_Avoid_: waypoint, location, POI (when meaning the plan element)

**Leg**:
The stretch between two consecutive Stops, carrying a Mode of Travel and an optional note.
_Avoid_: route, step, stage

**Journey Plan**:
An ordered sequence of Stops connected by Legs, planned in advance by the user.
_Avoid_: route, trip, journey (alone)

**Mode of Travel**:
How a Leg is travelled, chosen from a fixed list (walking, manual wheelchair, power wheelchair, bus/coach, train, tram/metro, taxi/rideshare, car as passenger, ferry).
_Avoid_: method of travel, transport type

**POI Type**:
Top-level category of a POI in the catalogue.
_Avoid_: category, class

**POI Subtype**:
Refinement of a POI Type (e.g. railway station under Transport).
_Avoid_: category, class

**Plus Code**:
The open, offline-computable location code shown for Places and POIs and used when sharing a location.
_Avoid_: what3words, w3w, geocode

### Modes

**Planner**:
The app mode for maintaining Places, browsing the POI catalogue, and building Journey Plans.
_Avoid_: planning mode, editor, journey planning (as a mode name)

**Follow**:
The app mode that guides the user along a Journey Plan in real time, designed for stress and distraction.
_Avoid_: navigate, follower, guidance mode

### Following

**Straight-line Distance**:
The distance as the crow flies between the user and a target. The only distance measure used; walking/route distances are out of scope.
_Avoid_: walking distance, route distance

**Clock-face Direction**:
A bearing expressed as an hour on a clock face relative to the user's direction of travel (12 o'clock is straight ahead).
_Avoid_: bearing, degrees, compass bearing (when moving)

**Guidance**:
The spoken and sounded output of Follow mode describing the next Stop, distances, and progress; how much is spoken is controlled by a Preference.
_Avoid_: instructions, directions, narration

**Approaching**:
The proximity event fired when Straight-line Distance to the next Stop falls within the approaching threshold.
_Avoid_: getting close, near

**Arrived**:
The proximity event fired when Straight-line Distance to the next Stop falls within the arrival threshold.
_Avoid_: at destination, reached

**Moving Away**:
The proximity event fired when Straight-line Distance to the next Stop grows significantly over a short period, signalling the user is heading the wrong way.
_Avoid_: travelling away, off route, deviation

**Where Am I**:
The Follow control that speaks the user's full current location — coordinates and Plus Code — for asking bystanders or emergency services.
_Avoid_: locate me, my position

### Identity

**Recovery Code**:
A random one-time secret shown once at account creation; it unlocks the account so a new passkey can be added. Not an identifier and not personal data.
_Avoid_: password, backup code, security question
