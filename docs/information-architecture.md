# Open Continuity Information Architecture

## Purpose

This document defines the high-level structure of the Open Continuity web app, including navigation, page inventory, and screen responsibilities.

It is informed by the product framing in [`docs/product-foundation.md`](docs/product-foundation.md), the workflows in [`docs/user-journeys-and-stories.md`](docs/user-journeys-and-stories.md), the checkpoint model in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md), and the snapshot model in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md).

The goal is to support a lean and intuitive user experience that:

- helps users prepare stronger evidence
- makes evaluation understandable
- avoids overwhelming users with protocol detail too early
- keeps advanced inspection accessible

## Information architecture principles

### 1. The app is evidence-centric, not feed-centric

Navigation and page structure should revolve around checkpoints, lineage, evidence, snapshots, and participation rather than a generic social feed model.

### 2. Creation and evaluation are the two main pillars

The app has two primary modes of use:

- create and preserve continuity evidence
- inspect and evaluate continuity evidence

### 3. Summary first, detail second

Each major screen should begin with a human-readable summary and progressively reveal technical detail.

### 4. Readiness and context should appear before risky actions

Publishing flows should show readiness, recommendations, and rationale before final submission.

### 5. Conflict must remain visible

Competing claims, disputes, and missing evidence should appear in primary UI structures rather than being buried.

## Top-level app map

Recommended MVP structure:

- Landing / introduction
- Connect / login
- Dashboard
- Checkpoint detail
- Lineage view
- Create checkpoint flow
- Create snapshot flow
- Evidence inspector
- Settings

Supporting states and overlays:

- endorse / dispute action surface
- raw event detail drawers or panels
- readiness and recommendation panels

## Primary navigation

Recommended primary navigation items for authenticated users:

- Dashboard
- Create checkpoint
- Snapshots
- Settings

Secondary or contextual navigation:

- checkpoint detail to lineage view
- checkpoint detail to raw event inspection
- checkpoint detail to participation actions
- create checkpoint flow to snapshot subflow

Navigation should stay concise. The app should avoid too many top-level destinations in MVP.

## Page inventory

## 1. Landing / introduction

Suggested route:
- [`/`](docs/information-architecture.md)

### Purpose

Introduce Open Continuity and explain what the app helps users do.

### Primary users

- new visitors
- first-time users

### Key content

- short explanation of continuity checkpoints
- explanation that the system helps evaluate claims rather than determine truth authoritatively
- overview of the main actions: prepare, preserve, publish, evaluate, participate
- call to connect a Nostr identity

### Primary actions

- connect identity
- learn more

### Notes

This page should remain lightweight and trust-building. It should not overload users with protocol details.

## 2. Connect / login

Suggested route:
- [`/connect`](docs/information-architecture.md)

### Purpose

Allow the user to connect with their Nostr identity and begin using the app.

### Primary users

- all authenticated flows

### Key content

- available connection methods
- brief explanation of why connection is needed
- privacy and signing context where relevant

### Primary actions

- connect identity
- continue to dashboard

### Error states

- connection unavailable
- signing method unavailable
- relay or session initialization failure

## 3. Dashboard

Suggested route:
- [`/dashboard`](docs/information-architecture.md)

### Purpose

Serve as the main overview for the connected user.

### Primary users

- returning users
- evaluators tracking claims
- identity owners preparing actions

### Key content blocks

- my identity readiness summary
- recent or relevant checkpoints
- claims needing review
- claims with conflicts or disputes
- suggested next actions

### Primary actions

- start checkpoint creation
- resume checkpoint preparation
- open a checkpoint
- open recommended snapshots

### Secondary actions

- inspect a lineage
- revisit watched claims

### Empty states

- no checkpoints created yet
- no relevant claims available yet
- no snapshots yet

### UX notes

The dashboard should balance two use cases:

- “what should I do next for my own continuity readiness?”
- “what continuity claims should I inspect?”

## 4. Checkpoint detail

Suggested route:
- [`/checkpoints/[id]`](docs/information-architecture.md)

### Purpose

Provide the main evaluation view for a checkpoint.

### Primary users

- evaluators
- recovering users reviewing their own claim
- attestors
- advanced users

### Key content blocks

- checkpoint summary header
- root or linked label
- identity and pubkey context
- continuity claim summary
- lineage summary
- evidence by channel
- supporting attestations
- disputing attestations
- related snapshots
- raw event access

### Primary actions

- inspect lineage
- endorse
- dispute
- inspect evidence details

### Secondary actions

- view raw event JSON
- navigate to related checkpoints
- inspect preserved snapshots

### Required design behavior

- supporting and conflicting evidence must be clearly separated
- missing evidence should be visible
- declared proof channels should not be confused with verified evidence
- if multiple successor claims exist, the page should surface that clearly

## 5. Lineage view

Suggested route:
- [`/lineage/[id]`](docs/information-architecture.md)

### Purpose

Show the continuity chain and any branching or competing claims.

### Primary users

- evaluators
- advanced users
- recovering users

### Key content blocks

- chronological checkpoint chain
- root origin
- linked transitions
- branch points
- conflict indicators
- summarized evidence state per node

### Primary actions

- open a checkpoint node
- compare branches mentally or through summary state

### UX notes

This page should focus on structure and relationship clarity. It should not attempt to show every raw detail at once.

## 6. Create checkpoint flow

Suggested route:
- [`/create/checkpoint`](docs/information-architecture.md)

### Purpose

Guide users through creating a root or linked checkpoint.

### Primary users

- identity owners
- recovering users

### Flow structure

Recommended stages:

1. Choose checkpoint type
2. Readiness review
3. Snapshot recommendations
4. Proof setup
5. Publish
6. Next steps

### Key content blocks

- root vs linked choice
- kind `3` readiness status
- kind `0` and kind `3` snapshot recommendations
- secret proof guidance
- previous checkpoint reference for linked flows
- publish confirmation summary

### Primary actions

- create root checkpoint
- create linked checkpoint
- publish recommended snapshots
- publish checkpoint

### Required design behavior

- the flow should show what is required vs strongly recommended
- readiness states should update as the user completes steps
- the flow should explain why each stage matters
- users should not need to leave the flow to complete common preparation steps

## 7. Create snapshot flow

Suggested route:
- [`/create/snapshot`](docs/information-architecture.md)

### Purpose

Allow the user to preserve replaceable events as snapshot events.

### Primary users

- identity owners preparing checkpoints
- recovering users preserving remaining context
- advanced users

### Key content blocks

- snapshot candidate list
- event kind labels
- explanation of why each candidate matters
- publish confirmation

### Primary actions

- snapshot kind `0`
- snapshot kind `3`
- inspect candidate event details
- publish snapshot

### UX notes

This can work as either:

- a standalone page
- a subflow invoked from checkpoint creation

For MVP, the architecture should support both, even if the main entry point is through checkpoint creation.

## 8. Evidence inspector

Suggested route:
- [`/evidence/[id]`](docs/information-architecture.md)

### Purpose

Provide a deeper inspection view for evidence associated with a checkpoint or lineage.

### Primary users

- evaluators
- advanced users

### Key content blocks

- proof channel breakdown
- secret commitment or reveal context
- social proof breakdown
- snapshot context
- OTS presence or status
- NIP-05 corroboration context if present
- raw references and related event links

### Primary actions

- inspect by proof channel
- inspect raw details
- navigate back to checkpoint or lineage

### UX notes

This page should be more technical than the checkpoint detail page, but still organized by concepts rather than raw protocol structures alone.

## 9. Settings

Suggested route:
- [`/settings`](docs/information-architecture.md)

### Purpose

Manage app preferences and user-level behavior.

### Potential MVP content

- relay preferences
- display preferences for advanced detail
- confidence presentation preferences if configurable later
- session or identity management

## Core navigation flows

### Flow A: First-time preparation

[`Landing / introduction`](docs/information-architecture.md) → [`Connect / login`](docs/information-architecture.md) → [`Dashboard`](docs/information-architecture.md) → [`Create checkpoint flow`](docs/information-architecture.md) → optional [`Create snapshot flow`](docs/information-architecture.md) → checkpoint published

### Flow B: Recovery after loss or compromise

[`Connect / login`](docs/information-architecture.md) → [`Create checkpoint flow`](docs/information-architecture.md) in linked mode → optional snapshot actions → published linked checkpoint → [`Checkpoint detail`](docs/information-architecture.md)

### Flow C: Evaluate a claim

[`Dashboard`](docs/information-architecture.md) or direct link → [`Checkpoint detail`](docs/information-architecture.md) → [`Lineage view`](docs/information-architecture.md) and/or [`Evidence inspector`](docs/information-architecture.md) → endorse, dispute, watch, or wait

## Shared UI components and patterns

These are not pages, but they should be treated as core architecture elements.

### Readiness panel

Used in preparation and creation flows.

Should display:

- item label
- state such as ready, missing, strongly recommended, optional
- short rationale
- direct action

### Evidence summary cards

Used in checkpoint detail and evidence inspector views.

Should display:

- proof channel name
- short summary
- current evidence state
- link to more detail

### Conflict banner

Used when:

- competing claimants exist
- disputes are present
- key evidence is missing or contradictory

### Raw event drawer or panel

Used to provide advanced inspection without forcing it into the main reading flow.

### Participation action surface

Used to support endorse and dispute actions with a minimal but informative UX.

## Page-to-object mapping

### Checkpoint

Primary pages:

- [`Checkpoint detail`](docs/information-architecture.md)
- [`Lineage view`](docs/information-architecture.md)

### Snapshot

Primary pages:

- [`Create snapshot flow`](docs/information-architecture.md)
- related sections in [`Checkpoint detail`](docs/information-architecture.md)
- related sections in [`Evidence inspector`](docs/information-architecture.md)

### Participation / attestation

Primary pages:

- [`Checkpoint detail`](docs/information-architecture.md)

### Identity readiness

Primary pages:

- [`Dashboard`](docs/information-architecture.md)
- [`Create checkpoint flow`](docs/information-architecture.md)

## MVP page priorities

Highest-priority pages for initial development:

1. [`Connect / login`](docs/information-architecture.md)
2. [`Dashboard`](docs/information-architecture.md)
3. [`Create checkpoint flow`](docs/information-architecture.md)
4. [`Checkpoint detail`](docs/information-architecture.md)
5. [`Lineage view`](docs/information-architecture.md)
6. [`Create snapshot flow`](docs/information-architecture.md)

Secondary pages or features:

- [`Evidence inspector`](docs/information-architecture.md)
- [`Settings`](docs/information-architecture.md)

The evidence inspector may initially be implemented as an extended section or panel inside [`Checkpoint detail`](docs/information-architecture.md) before becoming a dedicated page.

## Content and UX boundaries for MVP

To keep the app lean, MVP should avoid:

- turning the dashboard into a generic social feed
- exposing too many protocol details on first contact
- requiring users to understand all proof mechanics before publishing
- burying disputes or branch conflicts in secondary screens

## Open questions

- should watched claims appear directly on the dashboard in MVP?
- should the evidence inspector be a dedicated page or an expandable section inside checkpoint detail initially?
- should snapshot creation be a modal/subflow or a full standalone page first?
- how much route depth is desirable before the app feels too complex?
