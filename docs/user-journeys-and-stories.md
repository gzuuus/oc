# Open Continuity User Journeys and User Stories

## Purpose

This document defines the main user journeys for the Open Continuity web app and derives user stories and acceptance criteria from them.

It is aligned with the checkpoint model in [`spec/checkpoint-nip-draft.md`](spec/checkpoint-nip-draft.md) and the snapshot model in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md).

The goal is to guide product, design, and engineering toward a simple but comprehensive user experience that helps users:

- prepare stronger continuity evidence
- preserve relevant historical context
- publish checkpoints correctly
- evaluate continuity claims without false certainty
- participate in social proof meaningfully

## Journey design principles

All journeys in the app should follow these principles:

### Guidance before action

Users should understand what they are doing, why it matters, and what good preparation looks like before they publish anything.

### Strong recommendations without unnecessary hard blocks

The app should distinguish between:

- required to publish
- strongly recommended for stronger evidence
- optional advanced hardening

### Progressive disclosure

The app should start with clear summaries, guided steps, and visible readiness indicators. Raw event details and protocol mechanics should remain available, but secondary.

### Conflict visibility

Users must be able to see when evidence is incomplete, weak, disputed, or branching.

## Primary user roles in these journeys

### Identity owner

Prepares and publishes a root checkpoint before any catastrophe.

### Recovering user

Publishes a linked checkpoint after loss, compromise, or identity transition.

### Evaluator or follower

Inspects evidence and decides whether a continuity claim is credible enough to trust.

### Attestor or community member

Endorses or disputes a checkpoint as part of social proof.

### Advanced user

Inspects raw events, snapshots, lineage details, and verification-related context.

## Journey 1: Prepare for continuity before a catastrophe

### User goal

Prepare the identity so future evaluators can assess continuity claims with stronger historical and social evidence.

### Why it matters

Without preparation, recovery may depend on much weaker signals. The app should therefore treat preparation as a first-class user journey.

### Key prerequisites

- user can connect with a Nostr identity
- user has a usable kind `3` follow list or can publish one
- user has current replaceable state that may later matter, especially kind `0` and kind `3`

### App guidance needed

- explain why the kind `3` list matters for later social proof
- explain why snapshots preserve historical replaceable state
- explain optional secret commitment and OTS in plain language
- provide readiness indicators before checkpoint publication

### Main steps

1. Connect identity.
2. Inspect readiness for checkpoint preparation.
3. Review whether the identity has relevant kind `3` social context.
4. Review whether current kind `0` and kind `3` state should be snapshot.
5. Optionally prepare a secret commitment.
6. Continue into root checkpoint creation.

### Common confusion or failure points

- user does not understand why a contact list matters
- user thinks snapshots are backup copies of keys rather than evidence preservation
- user skips preparation because the app does not explain future benefits clearly

### User stories

#### Story 1.1

As an identity owner, I want the app to assess whether I have relevant social context before creating a checkpoint so that I can publish stronger continuity evidence.

Acceptance criteria:

- the app checks whether a kind `3` event is available
- the app labels this state clearly as available, missing, or stale
- the app explains in plain language why this affects future social proof quality

#### Story 1.2

As an identity owner, I want the app to strongly recommend preserving my current replaceable state so that future evaluators can inspect historical evidence.

Acceptance criteria:

- the app identifies the latest relevant kind `0` and kind `3` events
- the app explains what a snapshot preserves
- the app offers a direct path to create recommended snapshots

#### Story 1.3

As a less technical user, I want to understand why each preparation step matters so that I can act correctly without reading the specification.

Acceptance criteria:

- each preparation item includes a short explanation
- explanations use user-centered language rather than protocol jargon only
- the flow remains concise and easy to scan

## Journey 2: Create a root checkpoint

### User goal

Publish the first checkpoint in a continuity lineage with the strongest practical evidence setup available.

### Why it matters

The root checkpoint establishes a durable continuity anchor for future recovery and evaluation.

### App guidance needed

- confirm readiness status before publishing
- recommend snapshot creation before or alongside publication
- explain proof declarations simply
- warn users about weak or privacy-sensitive secret choices

### Main steps

1. Enter the create checkpoint flow.
2. Choose root checkpoint.
3. Review readiness summary.
4. Create missing or recommended snapshots.
5. Select proof declarations.
6. Optionally add a secret commitment.
7. Publish the checkpoint.
8. Review suggested next steps such as OTS.

### Common confusion or failure points

- user cannot distinguish between required and recommended steps
- user publishes checkpoint without preserving useful historical state
- user uses a weak or revealing secret

### User stories

#### Story 2.1

As an identity owner, I want a guided root checkpoint flow so that I can publish a strong initial continuity record without missing important preparation steps.

Acceptance criteria:

- the flow clearly identifies the action as root checkpoint creation
- the flow presents readiness items before final publish
- the flow supports publishing without forcing irrelevant complexity

#### Story 2.2

As an identity owner, I want the app to recommend snapshots as part of checkpoint creation so that evidence preservation feels like part of the normal workflow.

Acceptance criteria:

- snapshot recommendations appear within the checkpoint flow
- the user can publish snapshots without leaving the overall journey
- completed snapshot steps update the readiness state in the flow

#### Story 2.3

As a privacy-conscious user, I want warnings when creating secret-based proof material so that I avoid publishing unsafe or weak secrets.

Acceptance criteria:

- the app explains that low-entropy or personal secrets may be unsafe
- the app warns before the user commits to a risky-looking secret flow
- the app clarifies that secret proof is supportive evidence, not absolute proof

## Journey 3: Create a linked checkpoint after loss or compromise

### User goal

Publish a continuity claim from a new identity that references a prior checkpoint and presents the strongest available evidence.

### Why it matters

This is the central recovery journey for the protocol.

### App guidance needed

- explain that a linked checkpoint is a continuity claim, not automatic replacement
- help the user select the prior checkpoint correctly
- help the user reveal prior secret material if applicable
- encourage social proof gathering from historically relevant contacts
- recommend related snapshots if relevant state is still available

### Main steps

1. Connect with the new key.
2. Choose linked checkpoint creation.
3. Select or paste the previous checkpoint reference.
4. Review available evidence channels.
5. Reveal prior secret if applicable.
6. Review or create supporting snapshots if possible.
7. Publish linked checkpoint.
8. Review post-publish actions to gather corroboration.

### Common confusion or failure points

- user assumes this flow automatically rebinds identity
- user links to the wrong prior checkpoint
- user does not understand what evidence is still missing

### User stories

#### Story 3.1

As a recovering user, I want a guided linked checkpoint flow so that I can publish a credible continuity claim after losing or compromising a key.

Acceptance criteria:

- the flow clearly distinguishes linked checkpoint creation from root checkpoint creation
- the user can reference a previous checkpoint directly
- the app explains the continuity claim model before publish

#### Story 3.2

As a recovering user, I want the app to show me what evidence I already have and what evidence is still missing so that I know how to strengthen my claim.

Acceptance criteria:

- the app displays evidence channels as available, missing, or optional
- the app identifies whether secret proof, snapshots, and social proof are present or absent
- the app suggests next-best actions after publishing

#### Story 3.3

As a recovering user, I want the app to guide me toward historically relevant social proof so that my claim is supported by the strongest practical attestations.

Acceptance criteria:

- the app explains why prior social context matters
- the app encourages attestations from relevant historical contacts
- the app does not present all attestations as equally strong

## Journey 4: Create and publish snapshots

### User goal

Preserve replaceable historical state that may later be needed for continuity evaluation.

### Why it matters

Replaceable events may change over time. Snapshots preserve exact historical evidence for later inspection as described in [`spec/snapshot-nip-draft.md`](spec/snapshot-nip-draft.md).

### App guidance needed

- explain which events are snapshot candidates and why
- recommend kind `0` and kind `3` snapshots in the relevant flows
- make snapshotting feel lightweight and understandable

### Main steps

1. Identify snapshot candidates.
2. Explain why each candidate matters.
3. Allow the user to publish one or more snapshots.
4. Confirm that snapshots are now available as preserved context.

### Common confusion or failure points

- user does not know what a snapshot contains
- user mistakes snapshots for recovery credentials or backups
- snapshotting feels like an advanced or hidden feature

### User stories

#### Story 4.1

As an identity owner, I want snapshot creation to feel like part of the checkpoint workflow so that evidence preservation is easy to complete.

Acceptance criteria:

- snapshot actions are accessible from preparation and checkpoint flows
- the app explains why a given event is a strong snapshot candidate
- published snapshots are visible in related checkpoint context

#### Story 4.2

As an evaluator, I want to inspect preserved historical state so that I can understand what evidence existed at the relevant time.

Acceptance criteria:

- related snapshots are visible from checkpoint detail views
- the user can see what event kind was preserved
- the user can inspect preserved content or raw details as needed

## Journey 5: Evaluate a continuity claim

### User goal

Inspect a checkpoint and decide whether it appears to be a credible continuation of a known identity.

### Why it matters

This is the core consumption and trust-decision journey of the app.

### App guidance needed

- summarize the claim in plain language
- separate supporting and conflicting evidence
- show lineage clearly
- avoid implying false certainty
- allow advanced drill-down into raw data

### Main steps

1. Open a checkpoint detail page.
2. Identify whether the checkpoint is root or linked.
3. Inspect lineage and prior references.
4. Review evidence by proof channel.
5. Review supporting and disputing social proof.
6. Inspect snapshots, OTS context, and raw details if needed.
7. Decide whether to trust, follow, watch, or wait.

### Common confusion or failure points

- user cannot tell what matters most
- user confuses declared proof with verified proof
- user believes a confidence presentation is authoritative truth

### User stories

#### Story 5.1

As an evaluator, I want a checkpoint page that explains the claim, lineage, and evidence clearly so that I can make an informed trust decision.

Acceptance criteria:

- the page identifies root or linked status
- the page shows the previous checkpoint reference when applicable
- the page organizes evidence into understandable sections

#### Story 5.2

As an evaluator, I want supporting and conflicting evidence shown separately so that I can judge the claim honestly.

Acceptance criteria:

- endorsements and disputes are visually distinct
- evidence summaries note when important evidence is missing
- competing or contradictory signals are not hidden

#### Story 5.3

As an advanced user, I want access to raw event and proof details so that I can verify the app’s interpretation independently.

Acceptance criteria:

- the page includes drill-down access to raw event data
- references to related events are inspectable
- snapshots and proof-related data can be examined without leaving the feature entirely

## Journey 6: Compare competing claims

### User goal

Inspect multiple candidate successors and understand which appears more credible.

### Why it matters

The protocol explicitly allows conflicting claims and lacks a central authority. The app must therefore treat competing successors as a first-class case.

### App guidance needed

- present branches clearly
- make evidence comparison understandable
- avoid hiding disagreement behind a single winner

### Main steps

1. Detect multiple linked checkpoints referring to a lineage.
2. Present branch overview.
3. Compare evidence summaries across claimants.
4. Allow drill-down into each claimant.
5. Help the user decide or continue monitoring.

### User stories

#### Story 6.1

As a cautious evaluator, I want to see when multiple successor claims exist so that I do not assume a single claimant is legitimate.

Acceptance criteria:

- the app highlights when more than one continuity branch exists
- branches are clearly distinguishable
- the user can navigate into each branch independently

#### Story 6.2

As an evaluator, I want to compare competing claims at a glance so that I can quickly identify which one appears stronger and why.

Acceptance criteria:

- the app summarizes evidence strengths and weaknesses per branch
- supporting and conflicting signals are visible for each claimant
- comparison language avoids claiming absolute truth

## Journey 7: Endorse or dispute a checkpoint

### User goal

Participate in the social proof process by endorsing or disputing a checkpoint.

### Why it matters

Social proof is a central evidence channel in the continuity model, especially when grounded in prior social context.

### App guidance needed

- explain what participation means
- distinguish endorsement from authoritative verification
- help users understand why their prior relationship may matter

### Main steps

1. Open a checkpoint.
2. Review summary and evidence.
3. Choose endorse or dispute.
4. Publish the reaction-based participation action.
5. Confirm that the participation is now part of visible social evidence.

### Common confusion or failure points

- user thinks endorsement proves identity conclusively
- user reacts without enough context
- user does not understand why their prior social connection matters

### User stories

#### Story 7.1

As a community member, I want a simple way to endorse or dispute a checkpoint so that I can contribute to the continuity evaluation process.

Acceptance criteria:

- endorsement and dispute actions are clear and easy to use
- the app explains the meaning of each action
- the resulting participation becomes visible in checkpoint evidence

#### Story 7.2

As a historically relevant contact, I want the app to explain why my attestation may carry more weight so that I understand the significance of my participation.

Acceptance criteria:

- the app explains the role of prior social context in simple language
- the explanation appears near the participation flow or evidence section
- the app does not imply formal authority or guaranteed weighting

## Journey 8: Monitor a continuity claim over time

### User goal

Keep track of claims that may evolve as new evidence, disputes, or corroboration appear.

### Why it matters

Continuity evaluation is not always immediate. Evidence can accumulate over time.

### App guidance needed

- allow users to keep claims visible
- surface meaningful updates
- distinguish between newly added support and newly added conflict

### Main steps

1. Mark a checkpoint or lineage as important.
2. Revisit the dashboard or related view.
3. Inspect newly available support, disputes, or preserved context.
4. revise the trust decision if needed.

### User stories

#### Story 8.1

As an evaluator, I want to keep track of important continuity claims so that I can revisit them when new evidence appears.

Acceptance criteria:

- the app allows the user to mark or retain relevant claims in a visible way
- updated evidence is distinguishable from already-seen evidence
- the user can return directly to the relevant checkpoint or lineage

#### Story 8.2

As an evaluator, I want to notice when a claim becomes more disputed or more supported so that I can adjust my confidence over time.

Acceptance criteria:

- the app visually separates new support from new conflict
- the app makes changes easy to scan from summary views
- the user can inspect the underlying new events

## Cross-cutting UX requirements derived from the journeys

These requirements apply across multiple flows.

### Readiness indicators

The app should show readiness states such as:

- ready
- missing
- strongly recommended
- optional

This is especially important for:

- kind `3` social context
- kind `0` snapshot preservation
- kind `3` snapshot preservation
- secret proof setup
- post-publish corroboration steps

### Explanation-first UI

Before publishing or participating, the app should explain:

- what the action does
- why it matters
- what it does not guarantee

### Evidence separation

The app should distinguish clearly between:

- declared proof channels
- verified or inspectable embedded proof
- external corroboration
- supporting evidence
- conflicting evidence

### Raw-data accessibility

Advanced users should be able to inspect raw event data, references, and preserved context without the app requiring all users to start there.

## MVP priority stories

The following stories should be treated as especially important for an initial release:

- [`Story 1.1`](docs/user-journeys-and-stories.md): social-context readiness before checkpoint creation
- [`Story 1.2`](docs/user-journeys-and-stories.md): strong snapshot recommendation
- [`Story 2.1`](docs/user-journeys-and-stories.md): guided root checkpoint creation
- [`Story 3.1`](docs/user-journeys-and-stories.md): guided linked checkpoint creation
- [`Story 3.2`](docs/user-journeys-and-stories.md): visibility into missing evidence
- [`Story 5.1`](docs/user-journeys-and-stories.md): usable checkpoint detail evaluation view
- [`Story 5.2`](docs/user-journeys-and-stories.md): support vs conflict separation
- [`Story 6.1`](docs/user-journeys-and-stories.md): competing successor visibility
- [`Story 7.1`](docs/user-journeys-and-stories.md): simple endorsement and dispute actions

## Open questions

- should the app use confidence tiers, a scored model, or only evidence summaries in MVP?
- what qualifies a kind `3` list as sufficiently relevant for readiness messaging?
- should snapshot publication be embedded directly inside checkpoint creation or handled as a linked subflow?
- should participation remain limited to standard reactions in MVP?
- what degree of monitoring or watch functionality is needed in the first release?
