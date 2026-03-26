# Open Continuity Technical Notes

## Purpose

This document captures implementation-oriented guidance for the Open Continuity web app.

It is intended to help development begin with shared technical assumptions while the product is still being refined. It is not a rigid architecture specification.

This document should be read alongside:

- [`docs/product-foundation.md`](docs/product-foundation.md)
- [`docs/user-journeys-and-stories.md`](docs/user-journeys-and-stories.md)
- [`docs/information-architecture.md`](docs/information-architecture.md)
- [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md)
- [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md)

## Planned stack

### Frontend framework

- Svelte 5

### Nostr interaction layer

- Applesauce

### Product implementation emphasis

The app is not a generic social client. It is an evidence-oriented client focused on:

- checkpoint discovery
- lineage tracing
- snapshot publication and inspection
- social proof participation
- guided evidence preparation and publishing

This emphasis should influence state shape, component design, page composition, and data-fetching priorities.

## Technical goals for MVP

The initial implementation should make it possible to:

- connect a user identity
- discover checkpoint events
- resolve checkpoint lineage
- detect root and linked checkpoints
- publish root checkpoints
- publish linked checkpoints
- publish snapshot events for relevant replaceable events
- gather and display reaction-based social proof
- surface declared proof channels and preserved context
- present evidence in a structured, inspectable way

## Protocol objects the app must model

The UI and data layer should treat the following as first-class application objects.

### Checkpoint event

Derived from the checkpoint event kind described in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md).

Suggested application responsibilities:

- identify whether the checkpoint is root or linked
- extract prior checkpoint reference from the relevant [`e` tag](spec/checkpoint-nip-draft.md:111)
- extract declared proof channels from [`proof` tags](spec/checkpoint-nip-draft.md:125)
- extract commit or reveal tags when present
- present content as optional explanatory text

### Snapshot event

Derived from the snapshot event kind described in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md).

Suggested application responsibilities:

- parse snapshot event metadata
- identify archived event id via the required [`e` tag](spec/snapshot-nip-draft.md:74)
- identify archived kind via the `k` tag described in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md:75)
- parse the embedded JSON event payload from [`content`](spec/snapshot-nip-draft.md:73)
- verify that the embedded event is internally consistent before treating it as valid evidence

### Evidence channel

The app should normalize evidence presentation across channels such as:

- secret proof
- social proof
- OTS corroboration
- NIP-05 corroboration
- snapshot preservation

This does not require flattening all channels to identical logic, but it does suggest a common display model.

### Lineage node

A lineage node is a checkpoint plus enough derived context to place it inside a chain or branch.

Suggested fields might include:

- checkpoint id
- checkpoint pubkey
- parent checkpoint id if present
- root or linked state
- evidence summary state
- branch or conflict indicators

## Functional areas and implementation notes

## 1. Identity connection and signing

The app needs a way to:

- connect a Nostr identity
- determine the active pubkey
- sign and publish events

Implementation notes:

- identity connection should be established early and exposed through a shared state boundary
- publishing flows should know whether signing is available before a user reaches the final step
- the UI should gracefully handle read-only inspection for users who are not connected

## 2. Checkpoint discovery

The app must discover checkpoint events and related evidence.

Based on the discovery guidance in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md:290), the app should support:

- fetching checkpoint events by kind
- locating the latest relevant checkpoints for a pubkey or lineage context
- recursively resolving prior checkpoints through linked references
- finding reactions to checkpoint event ids
- finding related snapshot events and OTS attestations where relevant

Implementation implications:

- discovery should be separable from rendering
- lineage resolution likely needs an async aggregation layer rather than page-local ad hoc fetches only
- the app should tolerate partial data and still render useful states

## 3. Lineage resolution

Lineage is central to the app and should be treated as a dedicated concern.

Responsibilities:

- determine whether a checkpoint is root or linked
- follow parent references backward
- detect missing parent data
- detect multiple successors or branching claims
- expose a structure usable by both checkpoint detail and lineage views

Recommended implementation approach:

- create a small lineage resolver module that converts raw checkpoint events into a graph or chain structure usable by the UI
- keep lineage derivation independent from specific page components

## 4. Snapshot creation and verification

Snapshot handling is strategically important because it preserves replaceable-state evidence.

Creation responsibilities:

- identify relevant replaceable candidates, especially kind `0` and kind `3`
- serialize the embedded event payload
- publish a valid snapshot event with the appropriate tags

Inspection responsibilities:

- parse the embedded JSON event
- verify the embedded event fields and relationship to the outer snapshot event
- expose verification state in the UI

Implementation note:

The app should not assume that a snapshot is valid simply because it exists. It should perform local consistency checks before presenting it as trusted preserved context, following the verification guidance in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md:83).

## 5. Social proof gathering

The protocol treats reactions as a central social-proof mechanism around checkpoints, especially as described in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md:231).

The app should support:

- discovering reactions that target checkpoint events
- distinguishing endorsement-like and dispute-like reactions
- showing counts and individual attestations
- indicating when attestations may be historically relevant based on prior social context

Implementation note:

The MVP can begin with a simple support/dispute distinction, while leaving more advanced weighting logic open for later.

## 6. Readiness evaluation for publishing flows

One important product requirement is that the app guide users before publishing.

This suggests a derived readiness model for creation flows.

Example readiness checks:

- connected identity available
- kind `3` follow list exists
- latest kind `0` event available for snapshot recommendation
- latest kind `3` event available for snapshot recommendation
- previous checkpoint selected for linked flow
- signing capability available

Implementation note:

Readiness is mostly a UX concern, but the technical layer should expose it as structured state rather than requiring each component to infer it independently.

## 7. Evidence presentation model

The UI needs a stable way to present heterogeneous evidence without becoming chaotic.

Suggested normalized shape for display-level evidence items:

- channel type
- status
- summary label
- underlying event references
- verification or inspection status
- supporting or conflicting classification where relevant

This kind of normalization can help both:

- checkpoint detail rendering
- evidence inspector rendering

## Suggested frontend module areas

The exact project structure can evolve, but the app will likely benefit from separating concerns into modules such as:

- identity connection
- event discovery
- checkpoint parsing
- lineage resolution
- snapshot parsing and verification
- publishing helpers
- evidence summarization
- UI state and route-level loaders

The important principle is to avoid putting protocol interpretation directly into page components.

## State and data flow notes

Because multiple screens need shared derived views of the same data, the app should plan for reusable derived state.

Examples:

- active identity state
- checkpoint by id lookup
- lineage structures
- evidence summaries per checkpoint
- related snapshots per checkpoint
- reactions per checkpoint

Implementation note:

Svelte 5 should make it practical to keep state handling relatively lightweight, but shared derivation boundaries are still important so logic does not become duplicated across screens.

## Publishing flow notes

Publishing is not just an event submission problem. It is a guided workflow problem.

Technical support for publishing flows should include:

- draft state for root and linked checkpoint creation
- snapshot candidate discovery
- structured readiness computation
- event preview or summary before publish
- event publication result handling
- error feedback that maps to user-understandable steps

If possible, the app should structure publishing logic so the UI can reuse the same core flow for:

- root checkpoint creation
- linked checkpoint creation
- snapshot publication during checkpoint preparation

## Verification responsibilities

The app should perform local verification where practical rather than presenting event existence alone as meaningful proof.

Examples:

- verify snapshot embedded event consistency as described in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md:83)
- verify secret reveal against a prior commitment when both are available
- verify checkpoint linkage structure where referenced parents are available

The app should also distinguish clearly between:

- evidence declared by an author
- evidence observed by the client
- evidence locally verified by the client

## Error and partial-data handling

Because Nostr data can be incomplete or unevenly available, the app should be built around graceful degradation.

Important cases:

- referenced prior checkpoint not found yet
- reactions unavailable from current relay view
- snapshot exists but embedded content fails verification
- related kind `0` or kind `3` events unavailable
- OTS or NIP-05 corroboration not yet implemented or not available

Recommended behavior:

- render partial states clearly
- label missing data as missing rather than invalid when appropriate
- distinguish unavailable, unverified, and contradictory states

## Security and privacy considerations for implementation

### Secret handling

The app should treat secret creation and reveal flows carefully.

Implementation concerns:

- avoid unnecessary persistence of plaintext secret values
- clearly warn before reveal publication
- make it clear when the user is about to publish sensitive material

### No false authority

Implementation should support UI patterns that reinforce the product principle that the app aids evaluation rather than determines truth.

### Dispute visibility

The data model and UI should make it hard to accidentally hide conflicting signals.

## Likely early technical decisions

These decisions will probably need to be resolved soon:

- routing approach for Svelte 5 app structure
- exact state-management pattern for shared derived data
- how Applesauce abstractions map onto checkpoint discovery and publishing needs
- whether evidence summarization is purely client-local in MVP
- whether route-level loading or centralized data services should own lineage resolution

## Recommended implementation sequence

1. identity connection and basic app shell
2. checkpoint discovery and parsing
3. checkpoint detail view with simple evidence sections
4. lineage resolution and lineage view
5. root checkpoint publishing flow
6. snapshot publishing support
7. linked checkpoint publishing flow
8. endorsement and dispute actions
9. deeper evidence inspection and refinement

This sequence aligns with the product requirement to make evaluation and guided creation both available early.

## Open technical questions

- which Svelte 5 routing setup will be used for the web app?
- what is the best state boundary for identity, discovery, lineage, and publishing concerns?
- how should Applesauce integrations be wrapped so UI components remain protocol-light?
- should snapshot verification happen eagerly on fetch or lazily on inspection?
- what is the MVP strategy for OTS and NIP-05 inspection support?
