# Open Continuity Product Foundation

## Product summary

Open Continuity is a specialized Nostr web client for preparing, preserving, publishing, and evaluating identity continuity evidence.

It is built around the checkpoint model defined in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md) and the snapshot model defined in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md).

The product does **not** authoritatively determine that one pubkey has become another. Instead, it helps users understand the most probable continuity path of an identity by organizing evidence, surfacing uncertainty, and guiding good operational practices before and after catastrophic events such as key loss or compromise.

## Problem statement

In Nostr, identity is tied to a public key. If a key is lost, compromised, or abandoned, there is no central authority that can deterministically declare a legitimate replacement key.

This creates a difficult user problem:

- identity owners need a way to prepare for continuity before something goes wrong
- recovering users need a way to present continuity claims with meaningful evidence
- followers and evaluators need a way to inspect those claims without being misled by false certainty
- communities need a way to contribute social proof without pretending that social proof is absolute truth

Open Continuity addresses this by turning protocol events into a guided evidence workflow.

## Why continuity is probabilistic

The protocol assumptions in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md) are foundational to the product:

- a checkpoint is an immutable claim, not authoritative recovery
- evidence may support or dispute a claim
- multiple claims may coexist
- observers must weigh evidence rather than accept a deterministic answer

This means the product must present continuity as:

- a claim under evaluation
- a set of supporting and conflicting signals
- a judgment process informed by evidence quality
- an outcome with uncertainty, not truth enforcement

The app should therefore avoid product language that implies automatic key migration or definitive identity reassignment.

## Product vision

Open Continuity should make strong continuity practices understandable and accessible to normal Nostr users.

The product should help users:

- prepare continuity evidence before catastrophe
- preserve historical state that may later matter
- publish checkpoints and linked checkpoints correctly
- understand why each preparation step improves later evaluation
- inspect continuity claims with clarity and context
- contribute social proof in an informed way

## Product principles

### 1. Evidence, not authority

The app presents evidence and guidance. It does not declare canonical truth.

### 2. Guided, not overwhelming

The app should translate protocol complexity into staged, comprehensible flows.

### 3. Safe and strong defaults

The evidentially stronger path should feel like the default path.

Examples:

- encourage creation or review of a kind `3` contact list before checkpoint publication
- strongly recommend snapshots for relevant kind `0` and kind `3` events
- explain secret commitment and reveal in plain language before asking users to use them

### 4. Progressive disclosure

Begin with clear summaries and guidance. Expose raw events, tags, and protocol detail when users want deeper inspection.

### 5. Honest uncertainty

The UI must not create a false sense of precision. Confidence should be explained through factors and evidence quality, not opaque certainty claims.

### 6. Conflict is first-class

Competing continuity claims, disputes, and weak evidence must be visible and understandable.

## Target users

### Identity owner

A user preparing continuity evidence before any catastrophic event occurs.

Needs:

- guided checkpoint preparation
- social-context readiness guidance
- snapshot recommendations
- clear explanation of proof options

### Recovering user

A user creating a linked checkpoint after key loss, compromise, or another catastrophic event.

Needs:

- a guided recovery workflow
- a way to publish linked checkpoints and supporting evidence
- help understanding what additional actions improve credibility

### Evaluator or follower

A user trying to decide whether a new pubkey is the most probable continuation of a known identity.

Needs:

- lineage visibility
- support and dispute visibility
- evidence summaries with drill-down access
- clear distinction between direct proof and corroboration

### Attestor or community member

A user contributing social proof about a checkpoint.

Needs:

- clarity about what endorsement or dispute means
- context for why prior social proximity matters
- a lightweight way to participate

### Advanced investigator

A user who wants to inspect raw protocol data and verify details independently.

Needs:

- raw event access
- snapshot visibility
- traceable lineage and references
- verification-oriented inspection tools

## Core concepts

### Checkpoint

An immutable event representing an identity continuity claim, as defined in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md).

### Root checkpoint

The first known checkpoint in a lineage. It does not reference a prior checkpoint.

### Linked checkpoint

A checkpoint that claims continuity from a prior checkpoint, typically by referencing it through an [`e` tag](spec/checkpoint-nip-draft.md:111).

### Lineage

The chain of checkpoints connecting a continuity claim backward through time.

### Continuity claim

The proposition that a later pubkey should be considered the probable continuation of an earlier identity.

### Evidence

Any signal that strengthens or weakens confidence in a continuity claim.

### Proof channel

A category of evidence declared or inspected in relation to a checkpoint, including secret proof, social proof, OTS corroboration, NIP-05 corroboration, and snapshots.

### Social context

The historical relationship context around an identity, especially relevant kind `3` follow-list data described in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md:256).

### Snapshot

An immutable preserved copy of a replaceable event version, as defined in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md).

### Supporting evidence

Evidence that makes a continuity claim more credible.

### Conflicting evidence

Evidence that disputes, weakens, or complicates a continuity claim.

### Confidence assessment

The app’s presentation of how strong or weak a continuity claim appears based on visible evidence. This is an aid to judgment, not an authoritative verdict.

## Protocol-to-product mapping

### Checkpoint events become user-facing continuity records

The checkpoint event kind in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md) becomes the main record users inspect, publish, and discuss in the app.

### Linked checkpoints become continuity branches

References to previous checkpoints form the lineage model used in the UI to display continuity paths and competing branches.

### Reactions become participation actions

Social proof described in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md:231) becomes user-facing endorsement and dispute actions.

### Kind `3` context becomes readiness and weighting context

Historical follow-list context described in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md:256) becomes an important part of both:

- pre-publication guidance for checkpoint creators
- later interpretation of social attestations

### Snapshot events become evidence preservation tools

Snapshot events from [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md) become the mechanism for preserving historical replaceable state so later evaluators can inspect what existed at the time.

## Core product capabilities

### 1. Prepare

Help users prepare continuity evidence before a problem occurs.

This includes:

- checking whether meaningful kind `3` social context exists
- encouraging preservation of relevant profile and contact-list state
- guiding secret-based proof setup when appropriate

### 2. Preserve

Help users snapshot relevant replaceable events so historical evidence remains inspectable later.

### 3. Publish

Help users create root checkpoints and linked checkpoints with clear guidance and minimal confusion.

### 4. Evaluate

Help users inspect lineage, evidence, corroboration, disputes, and uncertainty in a coherent way.

### 5. Participate

Help users endorse or dispute checkpoints while understanding what their participation means.

## UX stance

The app should feel simple because it is well guided, not because it hides the real complexity of continuity evaluation.

The intended UX pattern is:

- concise guidance before action
- readiness indicators for prerequisites and recommendations
- short step-based flows for publishing
- evidence summaries first, raw protocol details second
- clear handling of weak evidence and conflicting claims

## MVP scope

The MVP should focus on the minimum set of product capabilities needed to make Open Continuity useful and coherent.

### In scope

- connect with a Nostr identity
- discover and display checkpoint events
- inspect checkpoint details and lineage
- create root checkpoints
- create linked checkpoints
- recommend and support creation of relevant snapshots
- show supporting and disputing social proof
- surface declared proof channels and preserved context
- allow participation through endorsement or dispute actions

### Out of scope for MVP

- automatic identity reassignment
- automatic migration of follows or lists
- pretending to provide canonical truth
- becoming a full-featured general-purpose Nostr social client
- overly sophisticated scoring systems presented as objective truth

## Success criteria

The product is successful if it helps users:

- understand what a checkpoint is and why it matters
- create stronger continuity evidence with less confusion
- preserve relevant historical context before or during critical transitions
- inspect continuity claims without needing to parse raw protocol data first
- notice when evidence is weak, conflicting, or incomplete

## Known product tensions

These tensions should remain visible as the product evolves:

- simplicity vs faithfulness to protocol complexity
- guidance vs user freedom
- confidence presentation vs false certainty
- streamlined flows vs support for advanced verification
- lean MVP scope vs demand for broader Nostr-client functionality

## Stack context

The initial web app implementation is planned around:

- Svelte 5 for the frontend application
- Applesauce for Nostr interaction and relay-facing workflows

Those choices should support a product architecture centered on evidence workflows and guided publishing rather than generic feed-centric client patterns.
