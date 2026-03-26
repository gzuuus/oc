<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import PubkeyProfile from '$lib/components/PubkeyProfile.svelte';
	import ReadinessPanel from '$lib/components/ReadinessPanel.svelte';
	import SecretStrengthMeter from '$lib/components/SecretStrengthMeter.svelte';
	import SectionBlock from '$lib/components/SectionBlock.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { kinds, type NostrEvent } from 'nostr-tools';
	import { Input } from '$lib/components/ui/input/index.js';
	import { OC_CHECKPOINT_KIND } from '$lib/constants/oc';
	import { buildReadinessItems } from '$lib/data/app';
	import { activeAccount } from '$lib/services/accountManager.svelte';
	import {
		buildCheckpointDraft,
		createSecretCommitment,
		getIdentityReadiness,
		getUserMailboxes,
		getUserReadRelays,
		publishCheckpoint,
		publishCheckpointOts,
		publishSnapshot,
		watchOtsProofs
	} from '$lib/services/oc.svelte';
	import { eventStore } from '$lib/services/eventStore';
	import { OTS_ATTESTATION_KIND } from '$lib/constants/oc';
	import { formatRelativeTimestamp, getCheckpointSummary } from '$lib/utils/checkpoints';

	type SnapshotCandidate = {
		event: NostrEvent;
		kind: number;
		title: string;
		summary: string;
	};

	const pubkey = $derived($activeAccount?.pubkey);
	const userMailboxes = $derived(getUserMailboxes(pubkey));
	const outboxRelays = $derived(userMailboxes?.outboxes ?? []);
	const userReadRelays = $derived(getUserReadRelays(pubkey));
	const metadataEvent = $derived(
		pubkey ? eventStore.replaceable({ kind: kinds.Metadata, pubkey, relays: userReadRelays }) : null
	);
	const contactsEvent = $derived(
		pubkey ? eventStore.replaceable({ kind: kinds.Contacts, pubkey, relays: userReadRelays }) : null
	);
	const readiness = $derived.by(() => {
		const readiness = getIdentityReadiness($activeAccount);
		const hasRelaySelection = outboxRelays.length > 0;

		return {
			...readiness,
			hasMetadata: !!$metadataEvent,
			hasContacts: !!$contactsEvent,
			metadataEvent: $metadataEvent ?? undefined,
			contactsEvent: $contactsEvent ?? undefined,
			isMetadataLoading: !!pubkey && hasRelaySelection && !$metadataEvent,
			isContactsLoading: !!pubkey && hasRelaySelection && !$contactsEvent
		};
	});
	let metadataOtsEvents = $state<NostrEvent[]>([]);
	let contactsOtsEvents = $state<NostrEvent[]>([]);
	const readinessItems = $derived(
		buildReadinessItems({
			...readiness,
			hasMetadataSnapshot: !!$metadataEvent,
			hasContactsSnapshot: !!$contactsEvent,
			hasMetadataOts: metadataOtsEvents.length > 0,
			hasContactsOts: contactsOtsEvents.length > 0
		})
	);

	let checkpointType = $state<'root' | 'linked'>('root');
	let currentStep = $state(0);
	let parentId = $state('');
	let content = $state('');
	let secret = $state('');
	let reveal = $state('');
	let submitState = $state<'idle' | 'publishing' | 'success' | 'error'>('idle');
	let errorMessage = $state('');
	let publishedId = $state('');
	let publishedRelays = $state<string[]>([]);
	let otsPublishState = $state<'idle' | 'publishing' | 'success' | 'error'>('idle');
	let otsPublishMessage = $state('');
	let otsAttestationEventId = $state('');
	let snapshotPublishState = $state<Record<number, 'idle' | 'publishing' | 'success' | 'error'>>(
		{}
	);
	let snapshotPublishMessages = $state<Record<number, string>>({});
	let snapshotPublishedIds = $state<Record<number, string>>({});

	const isLinkedCheckpoint = $derived(checkpointType === 'linked');
	const normalizedParentId = $derived(isLinkedCheckpoint ? parentId.trim() : '');
	const normalizedSecret = $derived(secret);
	const secretCommitment = $derived(
		normalizedSecret ? createSecretCommitment(normalizedSecret) : ''
	);
	const normalizedReveal = $derived(isLinkedCheckpoint ? reveal : '');
	const linkedCheckpointEvent = $derived(
		normalizedParentId ? eventStore.event({ id: normalizedParentId, relays: userReadRelays }) : null
	);
	const linkedCheckpointSummary = $derived(
		$linkedCheckpointEvent && $linkedCheckpointEvent.kind === OC_CHECKPOINT_KIND
			? getCheckpointSummary($linkedCheckpointEvent)
			: null
	);
	const linkedCheckpointCommitment = $derived(
		$linkedCheckpointEvent?.tags.find((tag) => tag[0] === 'commit' && tag[2])?.[2] ?? ''
	);
	const linkedCheckpointHasCommitment = $derived(!!linkedCheckpointCommitment);
	const parsedMetadata = $derived.by(() => {
		if (!$metadataEvent) return null;

		try {
			return JSON.parse($metadataEvent.content || '{}') as Record<string, string | undefined>;
		} catch {
			return null;
		}
	});
	const hasNip05Metadata = $derived(!!parsedMetadata?.nip05?.trim());
	const canContinueFromTypeStep = $derived(!isLinkedCheckpoint || !!normalizedParentId);
	const canContinueToFollowUp = $derived(submitState === 'success');
	const linkedRootId = $derived(
		linkedCheckpointSummary ? (linkedCheckpointSummary.rootId ?? linkedCheckpointSummary.id) : ''
	);
	const stepTwoCopy = $derived.by(() =>
		checkpointType === 'root'
			? {
					title: 'Step 2 · Explain the root claim',
					description:
						'Add a short note only if it helps people understand why this is the first continuity claim for this identity.',
					label: 'Root checkpoint explanation',
					placeholder:
						'Optional example: first continuity checkpoint for this identity, published before any key changes or recovery flow.',
					hint: 'Keep it concise. A root checkpoint usually explains that this is the starting continuity record and any brief context worth preserving.'
				}
			: {
					title: 'Step 2 · Explain the linked claim',
					description:
						'Add a short note only if it helps people understand how this checkpoint continues from the earlier one.',
					label: 'Linked checkpoint explanation',
					placeholder:
						'Optional example: rotating to a new key after device loss while preserving the earlier social graph and profile history.',
					hint: 'Keep it concise. A linked checkpoint usually explains what changed and why this new claim should be read together with the previous checkpoint.'
				}
	);
	const snapshotCandidates = $derived<SnapshotCandidate[]>(
		[$metadataEvent, $contactsEvent]
			.filter((event): event is NostrEvent => !!event)
			.map((event) => ({
				event,
				kind: event.kind,
				title:
					event.kind === kinds.Metadata ? 'Profile metadata snapshot' : 'Contact list snapshot',
				summary:
					event.kind === kinds.Metadata
						? summarizeMetadataEvent(event)
						: summarizeContactsEvent(event)
			}))
	);
	const checkpointSteps = $derived([
		{
			title: 'Checkpoint type',
			description: 'Choose whether this claim starts continuity or links to an earlier checkpoint.'
		},
		{
			title: 'Claim explanation',
			description: 'Add a short explanation that helps evaluators understand the claim.'
		},
		{
			title: 'Embedded evidence',
			description:
				'Optionally include a secret commitment, and reveal a secret only when the earlier checkpoint already committed to one.'
		},
		{
			title: 'Publish',
			description: 'Review the draft, then publish the checkpoint.'
		},
		{
			title: 'Follow-up',
			description: 'Preserve related evidence and track follow-up proof work.',
			disabled: !canContinueToFollowUp
		}
	]);
	const socialSnapshotCandidate = $derived(
		snapshotCandidates.find((candidate) => candidate.kind === kinds.Contacts) ?? null
	);
	const nip05SnapshotCandidate = $derived(
		snapshotCandidates.find((candidate) => candidate.kind === kinds.Metadata) ?? null
	);
	const publishDisabled = $derived(
		!readiness.canPublish ||
			(isLinkedCheckpoint && !normalizedParentId) ||
			submitState === 'publishing'
	);
	const publishHint = $derived.by(() => {
		if (!readiness.isLoggedIn) return 'Connect an identity to continue.';
		if (!readiness.canPublish) return 'Your current account cannot sign events yet.';
		if (isLinkedCheckpoint && !normalizedParentId)
			return 'Add the previous checkpoint id for a linked claim.';
		if (!content.trim())
			return 'A human-readable explanation is optional, but recommended for people inspecting the checkpoint later.';
		if (!readiness.hasContacts)
			return 'You can publish now, but a contact list is strongly recommended first.';
		return 'Ready to publish.';
	});
	const draftPreview = $derived(
		readiness.canPublish
			? buildCheckpointDraft({
					content,
					parentId: normalizedParentId,
					rootId: isLinkedCheckpoint ? linkedRootId : undefined,
					commitment: secretCommitment,
					reveal: normalizedReveal
				})
			: null
	);

	function setCheckpointType(nextType: 'root' | 'linked') {
		checkpointType = nextType;

		if (nextType === 'root') {
			parentId = '';
			reveal = '';
		}
	}

	$effect(() => {
		if (!isLinkedCheckpoint || linkedCheckpointHasCommitment) return;
		reveal = '';
	});

	function goToStep(index: number) {
		if (index < 0 || index >= checkpointSteps.length) return;
		if (checkpointSteps[index]?.disabled) return;
		if (index > 0 && !canContinueFromTypeStep) return;
		currentStep = index;
	}

	function nextStep() {
		if (currentStep === 0 && !canContinueFromTypeStep) return;
		goToStep(currentStep + 1);
	}

	function previousStep() {
		goToStep(currentStep - 1);
	}

	function formatTimestamp(unix: number) {
		return new Date(unix * 1000).toLocaleString();
	}

	function getSnapshotButtonLabel(kind: number) {
		return kind === kinds.Contacts ? 'Publish contact-list snapshot' : 'Publish metadata snapshot';
	}

	function summarizeMetadataEvent(event: NostrEvent) {
		try {
			const parsed = JSON.parse(event.content || '{}') as Record<string, string | undefined>;
			const parts = [parsed.name, parsed.display_name, parsed.nip05].filter(Boolean);
			return parts.length > 0
				? parts.join(' · ')
				: 'No display fields found in the fetched metadata content.';
		} catch {
			return 'Metadata content is not parseable JSON, but the raw event can still be snapshot.';
		}
	}

	function summarizeContactsEvent(event: NostrEvent) {
		const followedPubkeys = event.tags.filter((tag: string[]) => tag[0] === 'p').length;
		const relayHints = event.tags.filter((tag: string[]) => tag[0] === 'relay').length;
		return `${followedPubkeys} followed pubkeys · ${relayHints} relay hints`;
	}

	async function handleSnapshotPublish(kind: number) {
		const candidate = snapshotCandidates.find((item: SnapshotCandidate) => item.kind === kind);
		if (!candidate) return;

		snapshotPublishState = { ...snapshotPublishState, [kind]: 'publishing' };
		snapshotPublishMessages = { ...snapshotPublishMessages, [kind]: '' };

		try {
			const result = await publishSnapshot({ archivedEvent: candidate.event });
			snapshotPublishState = { ...snapshotPublishState, [kind]: 'success' };
			snapshotPublishMessages = {
				...snapshotPublishMessages,
				[kind]: `Published to ${result.relays.length} relays.`
			};
			snapshotPublishedIds = { ...snapshotPublishedIds, [kind]: result.event.id };
		} catch (error) {
			snapshotPublishState = { ...snapshotPublishState, [kind]: 'error' };
			snapshotPublishMessages = {
				...snapshotPublishMessages,
				[kind]: error instanceof Error ? error.message : 'Snapshot publication failed.'
			};
		}
	}

	async function handleReadinessOtsPublish(kind: number) {
		const candidate =
			kind === kinds.Metadata ? $metadataEvent : kind === kinds.Contacts ? $contactsEvent : null;
		if (!candidate) return;

		otsPublishState = 'publishing';
		otsPublishMessage = '';

		try {
			const result = await publishCheckpointOts(candidate.id);
			otsPublishState = 'success';
			otsPublishMessage = result.message;
			otsAttestationEventId = result.attestationEventId;
		} catch (error) {
			otsPublishState = 'error';
			otsPublishMessage =
				error instanceof Error ? error.message : 'OpenTimestamps attestation request failed.';
		}
	}

	$effect(() => {
		const event = $metadataEvent;
		if (!event) {
			metadataOtsEvents = [];
			return;
		}

		const filters = { kinds: [OTS_ATTESTATION_KIND], '#e': [event.id] };
		const sync = () => {
			metadataOtsEvents = eventStore
				.getByFilters(filters)
				.slice()
				.sort((a, b) => b.created_at - a.created_at);
		};

		sync();
		const sub = eventStore.timeline(filters).subscribe(sync);
		const cleanup = watchOtsProofs(event.id, event.pubkey, userReadRelays);
		return () => {
			sub.unsubscribe();
			cleanup();
		};
	});

	$effect(() => {
		const event = $contactsEvent;
		if (!event) {
			contactsOtsEvents = [];
			return;
		}

		const filters = { kinds: [OTS_ATTESTATION_KIND], '#e': [event.id] };
		const sync = () => {
			contactsOtsEvents = eventStore
				.getByFilters(filters)
				.slice()
				.sort((a, b) => b.created_at - a.created_at);
		};

		sync();
		const sub = eventStore.timeline(filters).subscribe(sync);
		const cleanup = watchOtsProofs(event.id, event.pubkey, userReadRelays);
		return () => {
			sub.unsubscribe();
			cleanup();
		};
	});

	async function handlePublish() {
		try {
			submitState = 'publishing';
			errorMessage = '';
			otsPublishState = 'idle';
			otsPublishMessage = '';
			otsAttestationEventId = '';

			const result = await publishCheckpoint({
				content,
				parentId: normalizedParentId,
				rootId: isLinkedCheckpoint ? linkedRootId : undefined,
				commitment: secretCommitment,
				reveal: normalizedReveal
			});

			publishedId = result.event.id;
			publishedRelays = result.relays;
			submitState = 'success';
			currentStep = 4;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Checkpoint publication failed.';
			submitState = 'error';
		}
	}
</script>

<AppShell
	title="Checkpoints"
	badge="guided publishing"
	intro="Create a root or linked checkpoint, optionally embed secret evidence, and keep corroborating evidence as surrounding context."
>
	<ReadinessPanel
		items={readinessItems}
		title="Checkpoint readiness"
		onPublishSnapshot={handleSnapshotPublish}
		onPublishOts={handleReadinessOtsPublish}
		snapshotState={snapshotPublishState}
		snapshotMessages={snapshotPublishMessages}
		snapshotLinks={Object.fromEntries(
			Object.entries(snapshotPublishedIds).map(([kind, id]) => [Number(kind), `/evidence/${id}`])
		)}
		otsState={{
			0: otsPublishState,
			3: otsPublishState
		}}
		otsMessages={{
			0: otsPublishMessage,
			3: otsPublishMessage
		}}
		otsLinks={{
			0: otsAttestationEventId ? `/evidence/${otsAttestationEventId}` : '',
			3: otsAttestationEventId ? `/evidence/${otsAttestationEventId}` : ''
		}}
	/>

	<Stepper steps={checkpointSteps} {currentStep} onStepSelect={goToStep}>
		{#snippet children()}
			{#if currentStep === 0}
				<SectionBlock
					title="Step 1 · Choose the checkpoint type"
					description="Start with one decision only. Root is for a first claim. Linked is for continuity from an earlier checkpoint."
				>
					<div class="grid gap-3 md:grid-cols-2">
						<button
							type="button"
							class={`rounded-2xl border p-4 text-left ${checkpointType === 'root' ? 'border-foreground' : ''}`}
							onclick={() => setCheckpointType('root')}
						>
							<p class="font-medium">Root checkpoint</p>
							<p class="text-muted-foreground mt-1 text-sm leading-6">
								Use when creating the first continuity claim for this identity.
							</p>
						</button>
						<button
							type="button"
							class={`rounded-2xl border p-4 text-left ${checkpointType === 'linked' ? 'border-foreground' : ''}`}
							onclick={() => setCheckpointType('linked')}
						>
							<p class="font-medium">Linked checkpoint</p>
							<p class="text-muted-foreground mt-1 text-sm leading-6">
								Use when continuing from a previous checkpoint after rotation, recovery, or update.
							</p>
						</button>
					</div>

					{#if isLinkedCheckpoint}
						<div class="mt-4 space-y-2">
							<label class="text-sm font-medium" for="parent-id">Previous checkpoint event id</label
							>
							<Input
								id="parent-id"
								bind:value={parentId}
								placeholder="Paste the prior checkpoint event id"
							/>
							<p class="text-muted-foreground text-sm leading-6">
								This links the new checkpoint to the earlier continuity claim you want to extend.
							</p>
							{#if normalizedParentId}
								<div class="rounded-2xl border p-4">
									<p class="font-medium">Linked checkpoint preview</p>
									{#if linkedCheckpointSummary}
										<a
											href={`/checkpoints/${linkedCheckpointSummary.id}`}
											class="hover:bg-accent/20 mt-3 block rounded-xl border p-4 transition-colors"
										>
											<div
												class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
											>
												<div class="space-y-1.5">
													<div class="flex flex-wrap items-center gap-2">
														<span class="rounded-full border px-2.5 py-1 text-xs font-medium">
															{linkedCheckpointSummary.kindLabel}
														</span>
														{#if linkedCheckpointSummary.rootId}
															<span class="rounded-full border px-2.5 py-1 text-xs">
																root {linkedCheckpointSummary.rootId.slice(0, 8)}…
															</span>
														{/if}
													</div>
													<PubkeyProfile pubkey={linkedCheckpointSummary.pubkey} />
													<p class="font-medium">
														{linkedCheckpointSummary.content ||
															'No human-readable checkpoint note provided.'}
													</p>
												</div>
												<div class="text-muted-foreground text-sm">
													{formatRelativeTimestamp(linkedCheckpointSummary.createdAt)}
												</div>
											</div>
										</a>
									{:else if $linkedCheckpointEvent}
										<div class="mt-3 rounded-xl border p-4 text-sm leading-6">
											<p class="font-medium">Loaded event is not a checkpoint</p>
											<p class="text-muted-foreground mt-1">
												The pasted event id resolved to kind {$linkedCheckpointEvent.kind}, not a
												checkpoint event.
											</p>
										</div>
									{:else}
										<div class="mt-3 rounded-xl border p-4 text-sm leading-6">
											<p class="font-medium">Waiting for linked checkpoint</p>
											<p class="text-muted-foreground mt-1">
												Paste an event id that is reachable from the current relay view to load its
												preview here.
											</p>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}

					<div class="mt-6 flex flex-wrap gap-3">
						<button
							type="button"
							class="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
							onclick={nextStep}
							disabled={!canContinueFromTypeStep}
						>
							Continue to explanation
						</button>
						{#if !canContinueFromTypeStep}
							<p class="text-muted-foreground text-sm leading-6">
								Add the previous checkpoint id before continuing with a linked checkpoint.
							</p>
						{/if}
					</div>
				</SectionBlock>
			{:else if currentStep === 1}
				<SectionBlock title={stepTwoCopy.title} description={stepTwoCopy.description}>
					<div class="space-y-2">
						<label class="text-sm font-medium" for="checkpoint-content">{stepTwoCopy.label}</label>
						<textarea
							id="checkpoint-content"
							bind:value={content}
							rows="6"
							class="min-h-36 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
							placeholder={stepTwoCopy.placeholder}
						></textarea>
						<p class="text-muted-foreground text-sm leading-6">
							{stepTwoCopy.hint}
						</p>
					</div>

					<div class="mt-6 flex flex-wrap gap-3">
						<button
							type="button"
							class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
							onclick={previousStep}
						>
							Back
						</button>
						<button
							type="button"
							class="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
							onclick={nextStep}
						>
							Continue to embedded evidence
						</button>
					</div>
				</SectionBlock>
			{:else if currentStep === 2}
				<SectionBlock
					title="Step 3 · Optional embedded evidence"
					description="Only secret commitments and eligible reveals live inside the checkpoint schema. Other evidence stays external."
				>
					<div class="rounded-2xl border p-4 text-sm leading-6">
						<p class="font-medium">What this step does</p>
						<p class="text-muted-foreground mt-2">
							The checkpoint event can embed a secret commitment and, on a later linked checkpoint,
							a reveal when the previous checkpoint already contains a commitment. Reactions,
							snapshots, NIP-05 continuity, and OpenTimestamps remain external corroboration.
						</p>
						{#if isLinkedCheckpoint && linkedRootId}
							<p class="text-muted-foreground mt-2 break-all">
								This linked checkpoint will reference root lineage {linkedRootId} and previous checkpoint
								{normalizedParentId}.
							</p>
						{/if}
						{#if isLinkedCheckpoint && normalizedParentId}
							<p class="text-muted-foreground mt-2">
								{#if $linkedCheckpointEvent}
									{#if linkedCheckpointHasCommitment}
										A reveal is available here because the previous checkpoint already committed to
										a secret.
									{:else}
										This previous checkpoint does not contain a secret commitment, so there is
										nothing to reveal yet.
									{/if}
								{:else}
									Loading the previous checkpoint to determine whether secret reveal is applicable.
								{/if}
							</p>
						{/if}
					</div>

					<div class="mt-4 rounded-xl border p-4">
						<div class="space-y-5">
							<div class="space-y-2">
								<p class="text-sm font-medium">Secret commitment and reveal</p>
								<p class="text-muted-foreground text-sm leading-6">
									Use a strong secret. The exact UTF-8 string matters, so changing spaces,
									capitalization, or punctuation changes the commitment.
								</p>
							</div>

							<div class="space-y-2 rounded-xl border p-4">
								<label class="text-sm font-medium" for="secret"
									>Secret to hash into commitment</label
								>
								<Input id="secret" bind:value={secret} placeholder="Optional secret value" />
								<p class="text-muted-foreground text-sm leading-6">
									This value is hashed before publication, so the checkpoint stores only the SHA-256
									digest unless you later reveal it in another checkpoint.
								</p>
								<SecretStrengthMeter {secret} />
								{#if secretCommitment}
									<p class="text-muted-foreground rounded-xl border px-3 py-2 text-xs break-all">
										Commitment: {secretCommitment}
									</p>
								{/if}
							</div>

							{#if isLinkedCheckpoint && linkedCheckpointHasCommitment}
								<div class="space-y-2 rounded-xl border p-4">
									<label class="text-sm font-medium" for="reveal">Secret reveal</label>
									<Input
										id="reveal"
										bind:value={reveal}
										placeholder="Optional previously committed secret"
									/>
									<p class="text-muted-foreground text-sm leading-6">
										Use reveal only when this linked checkpoint is intentionally exposing the exact
										earlier secret string.
									</p>
								</div>
							{/if}

							{#if !isLinkedCheckpoint}
								<p class="text-muted-foreground text-sm leading-6">
									Reveal appears only on linked checkpoints after an earlier checkpoint has
									committed to a secret.
								</p>
							{:else if normalizedParentId && $linkedCheckpointEvent && !linkedCheckpointHasCommitment}
								<p class="text-muted-foreground text-sm leading-6">
									No reveal field is shown because the linked previous checkpoint has no secret
									commitment.
								</p>
							{:else if normalizedParentId && !$linkedCheckpointEvent}
								<p class="text-muted-foreground text-sm leading-6">
									Checking the previous checkpoint before deciding whether reveal should be offered.
								</p>
							{/if}
						</div>
					</div>

					<div class="mt-4 space-y-4">
						<div class="rounded-xl border p-4 text-sm leading-6">
							<p class="font-medium">External corroboration: social context</p>
							<p class="text-muted-foreground mt-2">
								Reactions and contact-list snapshots are not encoded as checkpoint tags, but they
								often matter during evaluation.
							</p>
							{#if socialSnapshotCandidate}
								<div class="mt-4 rounded-xl border p-3">
									<p class="font-medium">Contact list snapshot</p>
									<p class="text-muted-foreground mt-1">
										Current fetched summary: {socialSnapshotCandidate.summary}
									</p>
									<p class="text-muted-foreground mt-1">
										Fetched event id: <span class="break-all"
											>{socialSnapshotCandidate.event.id}</span
										>
									</p>
									<p class="text-muted-foreground mt-1">
										Created at: {formatTimestamp(socialSnapshotCandidate.event.created_at)}
									</p>
									<details class="mt-2">
										<summary class="cursor-pointer text-sm font-medium"
											>Inspect raw fetched event</summary
										>
										<pre
											class="bg-muted mt-2 overflow-x-auto rounded-xl border p-3 text-xs leading-6">{JSON.stringify(
												socialSnapshotCandidate.event,
												null,
												2
											)}</pre>
									</details>
									<div class="mt-3 flex flex-wrap gap-3">
										<button
											type="button"
											class="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
											onclick={() => handleSnapshotPublish(socialSnapshotCandidate.kind)}
											disabled={snapshotPublishState[socialSnapshotCandidate.kind] === 'publishing'}
										>
											{snapshotPublishState[socialSnapshotCandidate.kind] === 'publishing'
												? 'Publishing…'
												: getSnapshotButtonLabel(socialSnapshotCandidate.kind)}
										</button>
										{#if snapshotPublishedIds[socialSnapshotCandidate.kind]}
											<a
												class="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
												href={`/evidence/${snapshotPublishedIds[socialSnapshotCandidate.kind]}`}
											>
												Open snapshot event
											</a>
										{/if}
									</div>
									{#if snapshotPublishMessages[socialSnapshotCandidate.kind]}
										<p
											class={`mt-2 text-sm ${snapshotPublishState[socialSnapshotCandidate.kind] === 'error' ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}
										>
											{snapshotPublishMessages[socialSnapshotCandidate.kind]}
										</p>
									{/if}
								</div>
							{:else}
								<div class="rounded-xl border p-3">
									<p class="font-medium">No contact list loaded yet</p>
									<p class="text-muted-foreground mt-1">
										Social corroboration gets stronger once kind 3 context is available for snapshot
										preservation.
									</p>
								</div>
							{/if}
						</div>

						<div class="rounded-xl border p-4 text-sm leading-6">
							<p class="font-medium">External corroboration: metadata and NIP-05</p>
							<p class="text-muted-foreground mt-2">
								NIP-05 continuity is corroborating evidence, not authoritative replacement.
								Snapshotting the current kind 0 event helps evaluators inspect what was published at
								this time.
							</p>
							{#if nip05SnapshotCandidate}
								<div class="mt-4 rounded-xl border p-3">
									<p class="font-medium">Profile metadata snapshot</p>
									<p class="text-muted-foreground mt-1">
										Current fetched summary: {nip05SnapshotCandidate.summary}
									</p>
									<p class="text-muted-foreground mt-1">
										Fetched event id: <span class="break-all"
											>{nip05SnapshotCandidate.event.id}</span
										>
									</p>
									<p class="text-muted-foreground mt-1">
										Created at: {formatTimestamp(nip05SnapshotCandidate.event.created_at)}
									</p>
									<details class="mt-2">
										<summary class="cursor-pointer text-sm font-medium"
											>Inspect raw fetched event</summary
										>
										<pre
											class="bg-muted mt-2 overflow-x-auto rounded-xl border p-3 text-xs leading-6">{JSON.stringify(
												nip05SnapshotCandidate.event,
												null,
												2
											)}</pre>
									</details>
									<div class="mt-3 flex flex-wrap gap-3">
										<button
											type="button"
											class="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
											onclick={() => handleSnapshotPublish(nip05SnapshotCandidate.kind)}
											disabled={snapshotPublishState[nip05SnapshotCandidate.kind] === 'publishing'}
										>
											{snapshotPublishState[nip05SnapshotCandidate.kind] === 'publishing'
												? 'Publishing…'
												: getSnapshotButtonLabel(nip05SnapshotCandidate.kind)}
										</button>
										{#if snapshotPublishedIds[nip05SnapshotCandidate.kind]}
											<a
												class="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
												href={`/evidence/${snapshotPublishedIds[nip05SnapshotCandidate.kind]}`}
											>
												Open snapshot event
											</a>
										{/if}
									</div>
									{#if snapshotPublishMessages[nip05SnapshotCandidate.kind]}
										<p
											class={`mt-2 text-sm ${snapshotPublishState[nip05SnapshotCandidate.kind] === 'error' ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}
										>
											{snapshotPublishMessages[nip05SnapshotCandidate.kind]}
										</p>
									{/if}
								</div>
							{:else}
								<div class="rounded-xl border p-3">
									<p class="font-medium">No profile metadata loaded yet</p>
									<p class="text-muted-foreground mt-1">
										Metadata corroboration gets stronger once a kind 0 event is available to
										snapshot.
									</p>
								</div>
							{/if}
							{#if hasNip05Metadata}
								<p class="text-muted-foreground mt-3 text-xs">
									A NIP-05 identifier is currently visible in fetched metadata.
								</p>
							{/if}
						</div>
					</div>

					<div class="mt-6 flex flex-wrap gap-3">
						<button
							type="button"
							class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
							onclick={previousStep}
						>
							Back
						</button>
						<button
							type="button"
							class="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
							onclick={nextStep}
						>
							Continue to publish
						</button>
					</div>
				</SectionBlock>
			{:else if currentStep === 3}
				<SectionBlock
					title="Step 4 · Publish"
					description="Show only the decision-critical guidance here. Raw event details stay available, but secondary."
				>
					<div class="space-y-4">
						<div class="rounded-2xl border p-5">
							<div class="rounded-xl border px-4 py-3 text-sm">
								<p class="font-medium">Publish status</p>
								<p class="text-muted-foreground mt-1 leading-6">{publishHint}</p>
							</div>

							<div class="mt-5 flex flex-wrap gap-3">
								<button
									type="button"
									class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
									onclick={previousStep}
								>
									Back
								</button>
								<button
									type="button"
									class="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
									onclick={handlePublish}
									disabled={publishDisabled}
								>
									{submitState === 'publishing' ? 'Publishing…' : 'Publish checkpoint'}
								</button>
								<a
									href="/settings"
									class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
								>
									Review relays
								</a>
							</div>

							{#if submitState === 'error'}
								<p
									class="mt-4 rounded-xl border border-red-500/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
								>
									{errorMessage}
								</p>
							{/if}

							{#if submitState === 'success'}
								<div class="mt-4 flex flex-wrap gap-3 text-sm">
									<a
										class="inline-flex items-center rounded-md border px-3 py-1.5 font-medium"
										href={`/checkpoints/${publishedId}`}
									>
										Open published checkpoint
									</a>
									<button
										type="button"
										class="inline-flex items-center rounded-md border px-3 py-1.5 font-medium"
										onclick={() => goToStep(4)}
									>
										Continue to follow-up
									</button>
								</div>
							{/if}
						</div>

						<details class="rounded-2xl border p-5">
							<summary class="cursor-pointer font-medium">Raw event preview</summary>
							{#if draftPreview}
								<pre
									class="bg-muted mt-3 overflow-x-auto rounded-xl border p-4 text-xs leading-6">{JSON.stringify(
										draftPreview,
										null,
										2
									)}</pre>
							{:else}
								<p class="text-muted-foreground mt-3 text-sm leading-6">
									Ensure signing is available to preview the publishable event.
								</p>
							{/if}
						</details>
					</div>
				</SectionBlock>
			{:else}
				<SectionBlock
					title="Step 5 · Follow-up hardening"
					description="After publication, review the checkpoint you just created and note the next hardening actions that can strengthen later evaluation."
				>
					<div class="space-y-4">
						<div class="rounded-2xl border p-4 text-sm leading-6">
							<p class="font-medium">Checkpoint overview</p>
							<p class="text-muted-foreground mt-2">
								This is the continuity record you just prepared. Use it to review what evaluators
								will see first.
							</p>
							<div class="mt-3 space-y-3">
								<div class="rounded-xl border p-3">
									<p class="font-medium">Published checkpoint id</p>
									<p class="text-muted-foreground mt-1 break-all">
										{publishedId || 'Not published yet.'}
									</p>
								</div>
								<div class="rounded-xl border p-3">
									<p class="font-medium">Embedded evidence summary</p>
									<p class="text-muted-foreground mt-1">
										{secretCommitment ? 'Commitment included. ' : 'No commitment included. '}
										{normalizedReveal ? 'Reveal included.' : 'No reveal included.'}
									</p>
								</div>
								<div class="rounded-xl border p-3">
									<p class="font-medium">Published relays</p>
									<p class="text-muted-foreground mt-1">
										{publishedRelays.length > 0
											? publishedRelays.join(', ')
											: 'Relay confirmation not available.'}
									</p>
								</div>
							</div>
						</div>

						<div class="rounded-2xl border p-4 text-sm leading-6">
							<p class="font-medium">OpenTimestamps follow-up</p>
							<p class="text-muted-foreground mt-2">
								OpenTimestamps is a follow-up hardening step. Anchor the published checkpoint into
								an external timestamp proof after the continuity claim is already live.
							</p>
							<ul class="text-muted-foreground mt-3 list-disc space-y-1 pl-5">
								<li>Anchor the checkpoint event itself.</li>
								<li>Also anchor kind 0 metadata when NIP-05 corroboration matters.</li>
								<li>Also anchor kind 3 contact-list context when social proof matters.</li>
							</ul>
							<div class="mt-4 flex flex-wrap gap-3">
								<button
									type="button"
									class="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
									onclick={async () => {
										if (!publishedId) return;
										otsPublishState = 'publishing';
										otsPublishMessage = '';
										try {
											const result = await publishCheckpointOts(publishedId, {
												relays: publishedRelays
											});
											otsAttestationEventId = result.attestationEventId;
											otsPublishMessage = result.message;
											otsPublishState = 'success';
										} catch (error) {
											otsPublishMessage =
												error instanceof Error
													? error.message
													: 'OpenTimestamps attestation publication failed.';
											otsPublishState = 'error';
										}
									}}
									disabled={!publishedId || otsPublishState === 'publishing'}
								>
									{otsPublishState === 'publishing' ? 'Publishing…' : 'Publish OTS attestation'}
								</button>
								{#if otsAttestationEventId}
									<a
										class="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
										href={`/evidence/${otsAttestationEventId}`}
									>
										Open attestation event
									</a>
								{/if}
							</div>
							{#if otsPublishMessage}
								<p
									class={`mt-3 text-sm ${otsPublishState === 'error' ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}
								>
									{otsPublishMessage}
								</p>
							{/if}
						</div>
					</div>

					<div class="mt-6 flex flex-wrap gap-3">
						<a
							href={`/checkpoints/${publishedId}`}
							class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
						>
							Go to checkpoint page
						</a>
						<button
							type="button"
							class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
							onclick={() => goToStep(3)}
						>
							Back to publish step
						</button>
						<a
							href="/create/snapshot"
							class="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
						>
							Standalone snapshot page
						</a>
					</div>
				</SectionBlock>
			{/if}
		{/snippet}
	</Stepper>
</AppShell>
