<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import PubkeyProfile from '$lib/components/PubkeyProfile.svelte';
	import LinkedClaimsSection from '$lib/components/checkpoint-detail/LinkedClaimsSection.svelte';
	import ParticipateSection from '$lib/components/checkpoint-detail/ParticipateSection.svelte';
	import ReactionsSection from '$lib/components/checkpoint-detail/ReactionsSection.svelte';
	import { kinds, type EventTemplate, type NostrEvent } from 'nostr-tools';
	import { getOutboxes } from 'applesauce-core/helpers';
	import { activeAccount } from '$lib/services/accountManager.svelte';
	import { eventStore } from '$lib/services/eventStore';
	import { relayPool } from '$lib/services/relay-pool';
	import {
		createSecretCommitment,
		ensureEvent,
		getMergedRelays,
		publishCheckpointOts,
		watchCheckpointTimeline,
		watchOtsProofs
	} from '$lib/services/oc.svelte';
	import { relayStore } from '$lib/stores/relay-store.svelte';
	import { getCheckpointSummary, formatRelativeTimestamp } from '$lib/utils/checkpoints';
	import { OC_CHECKPOINT_KIND, OC_SNAPSHOT_KIND, OTS_ATTESTATION_KIND } from '$lib/constants/oc';
	import { parseSnapshotEvent } from '$lib/services/oc.svelte';
	import { shortKey, type BadgeTone } from '$lib/components/checkpoint-detail/helpers';

	let { params } = $props();
	let reactionState = $state<'idle' | 'publishing' | 'success' | 'error'>('idle');
	let reactionMessage = $state('');
	let lastReaction = $state<'+' | '-' | null>(null);
	let otsPublishState = $state<'idle' | 'publishing' | 'success' | 'error'>('idle');
	let otsPublishMessage = $state('');
	let otsAttestationLink = $state('');

	const checkpoint = $derived(
		eventStore.event({ id: params.id, relays: relayStore.selectedRelays })
	);
	const summary = $derived(
		$checkpoint && $checkpoint.kind === OC_CHECKPOINT_KIND
			? getCheckpointSummary($checkpoint)
			: null
	);
	const checkpointRelayList = $derived(
		$checkpoint
			? eventStore.replaceable({
					kind: kinds.RelayList,
					pubkey: $checkpoint.pubkey,
					relays: relayStore.selectedRelays
				})
			: null
	);
	const checkpointOutboxRelays = $derived(
		$checkpointRelayList ? getOutboxes($checkpointRelayList) : []
	);
	const checkpointReadRelays = $derived.by(() =>
		$checkpoint
			? [...new Set([...relayStore.selectedRelays, ...checkpointOutboxRelays])]
			: [...relayStore.selectedRelays]
	);
	let liveOtsProofEvents = $state<NostrEvent[]>([]);
	const otsProofEvents = $derived(liveOtsProofEvents);
	const hasOtsProof = $derived(otsProofEvents.length > 0);
	const relatedSnapshotTimeline = $derived(
		$checkpoint
			? eventStore.timeline({ kinds: [OC_SNAPSHOT_KIND], authors: [$checkpoint.pubkey] })
			: null
	);
	const relatedSnapshotEvents = $derived(($relatedSnapshotTimeline ?? []).slice());
	const relatedSnapshots = $derived(
		relatedSnapshotEvents
			.map(parseSnapshotEvent)
			.filter((snapshot) => snapshot.archivedKind === 0 || snapshot.archivedKind === 3)
			.sort((a, b) => b.createdAt - a.createdAt)
			.slice(0, 4)
	);
	const checkpointTimeline = $derived(eventStore.timeline({ kinds: [OC_CHECKPOINT_KIND] }));
	const previousCheckpoint = $derived(
		summary?.parentId
			? eventStore.event({ id: summary.parentId, relays: checkpointReadRelays })
			: null
	);
	const checkpointContacts = $derived(
		$checkpoint
			? eventStore.replaceable({
					kind: kinds.Contacts,
					pubkey: $checkpoint.pubkey,
					relays: checkpointReadRelays
				})
			: null
	);
	const previousCheckpointContacts = $derived(
		$previousCheckpoint
			? eventStore.replaceable({
					kind: kinds.Contacts,
					pubkey: $previousCheckpoint.pubkey,
					relays: checkpointReadRelays
				})
			: null
	);
	const linkedClaims = $derived(
		($checkpointTimeline ?? [])
			.filter((event) => event.id !== params.id)
			.filter((event) => event.tags.some((tag) => tag[0] === 'e' && tag[1] === params.id))
			.sort((a, b) => b.created_at - a.created_at)
			.map(getCheckpointSummary)
	);
	const reactionTimeline = $derived(
		eventStore.timeline({ kinds: [kinds.Reaction], '#e': [params.id] })
	);
	const reactionEvents = $derived(($reactionTimeline ?? []).slice());
	const uniqueReactionState = $derived.by(() => {
		const latestByPubkey = new Map<string, (typeof reactionEvents)[number]>();

		for (const event of [...reactionEvents].sort((a, b) => b.created_at - a.created_at)) {
			if (!latestByPubkey.has(event.pubkey)) {
				latestByPubkey.set(event.pubkey, event);
			}
		}

		const uniqueReactions = [...latestByPubkey.values()].sort(
			(a, b) => b.created_at - a.created_at
		);

		return {
			uniqueReactions,
			positives: uniqueReactions.filter((event) => !event.content || event.content === '+'),
			negatives: uniqueReactions.filter((event) => event.content === '-')
		};
	});
	const positives = $derived(uniqueReactionState.positives);
	const negatives = $derived(uniqueReactionState.negatives);
	const currentContactPubkeys = $derived.by(() => {
		const tags = $checkpointContacts?.tags ?? [];
		return new Set(tags.filter((tag) => tag[0] === 'p' && tag[1]).map((tag) => tag[1]));
	});
	const previousContactPubkeys = $derived.by(() => {
		const tags = $previousCheckpointContacts?.tags ?? [];
		return new Set(tags.filter((tag) => tag[0] === 'p' && tag[1]).map((tag) => tag[1]));
	});
	const previousPositivePubkeys = $derived.by(
		() => new Set(positives.map((event) => event.pubkey))
	);
	const previousNegativePubkeys = $derived.by(
		() => new Set(negatives.map((event) => event.pubkey))
	);
	const reactionContext = $derived.by(() => {
		const decorateReaction = (
			event: (typeof uniqueReactionState.uniqueReactions)[number],
			symbol: '+' | '-'
		) => {
			const inAuthorContacts = currentContactPubkeys.has(event.pubkey);
			const inPreviousContacts = previousContactPubkeys.has(event.pubkey);
			const matchesPrevious =
				symbol === '+'
					? previousPositivePubkeys.has(event.pubkey)
					: previousNegativePubkeys.has(event.pubkey);

			return {
				id: event.id,
				pubkey: event.pubkey,
				createdAt: event.created_at,
				symbol,
				inAuthorContacts,
				inPreviousContacts,
				matchesPrevious,
				priority: [inPreviousContacts, matchesPrevious, inAuthorContacts].filter(Boolean).length
			};
		};

		const positivesWithContext = positives
			.map((event) => decorateReaction(event, '+'))
			.sort((a, b) => b.priority - a.priority || b.createdAt - a.createdAt);
		const negativesWithContext = negatives
			.map((event) => decorateReaction(event, '-'))
			.sort((a, b) => b.priority - a.priority || b.createdAt - a.createdAt);

		return {
			positives: positivesWithContext,
			negatives: negativesWithContext,
			recent: [...positivesWithContext, ...negativesWithContext]
				.sort((a, b) => b.priority - a.priority || b.createdAt - a.createdAt)
				.slice(0, 6)
		};
	});
	const socialHighlights = $derived.by(() => {
		const items = [] as Array<{ label: string; tone: BadgeTone }>;
		const supportingAuthorMatches = reactionContext.positives.filter(
			(reaction) => reaction.inAuthorContacts
		).length;
		const disputingAuthorMatches = reactionContext.negatives.filter(
			(reaction) => reaction.inAuthorContacts
		).length;
		if ($checkpointContacts) {
			if (supportingAuthorMatches > 0) {
				items.push({
					label: `${supportingAuthorMatches} supporting reactions from author contacts`,
					tone: 'green'
				});
			}
			if (disputingAuthorMatches > 0) {
				items.push({
					label: `${disputingAuthorMatches} disputing reactions from author contacts`,
					tone: 'red'
				});
			}
			if (supportingAuthorMatches === 0 && disputingAuthorMatches === 0) {
				items.push({
					label: 'No reactions from author contacts',
					tone: 'neutral'
				});
			}
		}
		if (summary?.parentId) {
			const repeatedSupport = reactionContext.positives.filter(
				(reaction) => reaction.matchesPrevious
			).length;
			const repeatedDisputes = reactionContext.negatives.filter(
				(reaction) => reaction.matchesPrevious
			).length;
			if (repeatedSupport > 0) {
				items.push({
					label: `${repeatedSupport} supporting reactions repeated from previous checkpoint`,
					tone: 'green'
				});
			}
			if (repeatedDisputes > 0) {
				items.push({
					label: `${repeatedDisputes} disputes repeated from previous checkpoint`,
					tone: 'red'
				});
			}
			if (repeatedSupport === 0 && repeatedDisputes === 0) {
				items.push({
					label: 'No repeated reactions from previous checkpoint',
					tone: 'neutral'
				});
			}
		}
		return items;
	});
	const checkpointStatusSummary = $derived.by(() => {
		const items: string[] = [];
		if (hasOtsProof) {
			items.push('Has OpenTimestamps attestation');
		}
		if (summary?.parentId) {
			if (secretProof.hasLinkedComparison && secretProof.linkedMatch === true) {
				items.push('Secret continuity matches the linked checkpoint');
			} else if (secretProof.hasLinkedComparison && secretProof.linkedMatch === false) {
				items.push('Secret continuity does not match the linked checkpoint');
			} else if (!secretProof.hasLinkedComparison) {
				items.push('No earlier secret commitment to compare');
			}
		} else if (secretProof.currentCommitment) {
			items.push('Starts a new secret commitment trail');
		}
		if (positives.length > 0 || negatives.length > 0) {
			items.push(`${positives.length} support · ${negatives.length} dispute`);
		}
		return items;
	});

	const otsProofs = $derived(
		[...otsProofEvents]
			.sort((a, b) => b.created_at - a.created_at)
			.map((event) => {
				const targetKind = event.tags.find((tag) => tag[0] === 'k')?.[1] ?? null;
				const relayHint = event.tags.find((tag) => tag[0] === 'e')?.[2] ?? null;
				const hasBitcoinAttestation = event.content.trim().length > 0;
				// Parse attestation height from content if available
				const attestationMatch = event.content.match(/block\s*#?(\d+)/i);
				const blockHeight = attestationMatch ? parseInt(attestationMatch[1], 10) : null;

				return {
					id: event.id,
					createdAt: event.created_at,
					pubkey: event.pubkey,
					targetKind,
					relayHint,
					hasBitcoinAttestation,
					contentSize: event.content.length,
					blockHeight
				};
			})
	);

	// Group snapshots by their relevance to proofs
	const socialSnapshots = $derived(
		relatedSnapshots.filter((s) => s.archivedKind === kinds.Contacts)
	);
	const nip05Snapshots = $derived(
		relatedSnapshots.filter((s) => s.archivedKind === kinds.Metadata)
	);
	const recentReactions = $derived(reactionContext.recent);
	const secretProof = $derived.by(() => {
		const commitTag = $checkpoint?.tags.find((tag) => tag[0] === 'commit' && tag[2]);
		const revealTag = $checkpoint?.tags.find((tag) => tag[0] === 'reveal' && tag[1]);
		const previousCommitTag = $previousCheckpoint?.tags.find(
			(tag) => tag[0] === 'commit' && tag[2]
		);
		const previousRevealTag = $previousCheckpoint?.tags.find(
			(tag) => tag[0] === 'reveal' && tag[1]
		);
		const reveal = revealTag?.[1] ?? null;
		const previousReveal = previousRevealTag?.[1] ?? null;
		const previousCommitment = previousCommitTag?.[2] ?? null;
		const hasLinkedComparison = Boolean(summary?.parentId && previousCommitment);
		const linkedMatch =
			reveal && previousCommitment ? createSecretCommitment(reveal) === previousCommitment : null;

		return {
			currentCommitment: commitTag?.[2] ?? null,
			currentReveal: reveal,
			previousCommitment,
			previousReveal,
			hasLinkedComparison,
			linkedMatch,
			badges: [
				...(summary?.parentId
					? [
							{
								label:
									linkedMatch === null
										? 'No linked secret comparison yet'
										: linkedMatch
											? 'Linked secret matches'
											: 'Linked secret does not match',
								tone: (linkedMatch === null
									? 'neutral'
									: linkedMatch
										? 'green'
										: 'red') as BadgeTone
							}
						]
					: []),
				...(commitTag ? [{ label: 'Secret commit defined', tone: 'neutral' as const }] : []),
				...(revealTag ? [{ label: 'Secret reveal defined', tone: 'neutral' as const }] : [])
			] as Array<{ label: string; tone: BadgeTone }>
		};
	});

	async function publishReaction(symbol: '+' | '-') {
		if (!$activeAccount) {
			reactionState = 'error';
			reactionMessage = 'Log in before publishing a reaction.';
			return;
		}
		if (!$checkpoint) {
			reactionState = 'error';
			reactionMessage = 'Wait for the checkpoint to load before reacting.';
			return;
		}
		const relays = [...new Set([...relayStore.selectedRelays, ...checkpointOutboxRelays])];
		if (!relays.length) {
			reactionState = 'error';
			reactionMessage = 'Select at least one relay before publishing a reaction.';
			return;
		}

		reactionState = 'publishing';
		reactionMessage = '';
		lastReaction = symbol;

		try {
			const draft: EventTemplate = {
				kind: kinds.Reaction,
				created_at: Math.floor(Date.now() / 1000),
				content: symbol,
				tags: [
					['e', $checkpoint.id],
					['p', $checkpoint.pubkey],
					['k', String($checkpoint.kind)],
					['alt', symbol === '+' ? 'Checkpoint +' : 'Checkpoint -']
				]
			};
			const event = await $activeAccount.signEvent(draft);
			await relayPool.publish(relays, event);
			if (!eventStore.getEvent(event.id)) {
				eventStore.add(event);
			}
			reactionState = 'success';
			reactionMessage = `${symbol} reaction published.`;
		} catch (error) {
			reactionState = 'error';
			reactionMessage = error instanceof Error ? error.message : 'Reaction publication failed.';
		}
	}

	async function publishCheckpointAttestation() {
		if (!$checkpoint) {
			otsPublishState = 'error';
			otsPublishMessage = 'Wait for the checkpoint to load before requesting OpenTimestamps.';
			return;
		}

		otsPublishState = 'publishing';
		otsPublishMessage = '';
		otsAttestationLink = '';

		try {
			const result = await publishCheckpointOts($checkpoint.id, { relays: checkpointReadRelays });
			otsPublishState = 'success';
			otsPublishMessage = result.message;
			otsAttestationLink = `/evidence/${result.attestationEventId}`;
		} catch (error) {
			otsPublishState = 'error';
			otsPublishMessage =
				error instanceof Error ? error.message : 'OpenTimestamps attestation request failed.';
		}
	}

	$effect(() => {
		const subscription = ensureEvent(params.id, checkpointReadRelays);
		return () => {
			subscription?.unsubscribe();
		};
	});

	$effect(() => {
		if (!summary?.parentId) return;
		const subscription = ensureEvent(summary.parentId, checkpointReadRelays);
		return () => {
			subscription?.unsubscribe();
		};
	});

	$effect(() => {
		const filters = { kinds: [OTS_ATTESTATION_KIND], '#e': [params.id] };
		const syncOtsProofs = () => {
			liveOtsProofEvents = eventStore
				.getByFilters(filters)
				.slice()
				.sort((a, b) => b.created_at - a.created_at);
		};

		syncOtsProofs();
		const timelineSub = eventStore.timeline(filters).subscribe(() => {
			syncOtsProofs();
		});

		const cleanup = watchOtsProofs(params.id, $checkpoint?.pubkey, checkpointReadRelays);
		return () => {
			timelineSub.unsubscribe();
			cleanup();
		};
	});
	$effect(() => watchCheckpointTimeline(undefined, checkpointReadRelays));

	$effect(() => {
		const subscription = relayPool
			.subscription(getMergedRelays(checkpointReadRelays), [
				{ kinds: [kinds.Reaction], '#e': [params.id] }
			])
			.subscribe((event) => {
				if (typeof event !== 'string' && !eventStore.getEvent(event.id)) {
					eventStore.add(event);
				}
			});
		return () => subscription.unsubscribe();
	});
</script>

<AppShell
	title="Checkpoint"
	badge="evaluation"
	intro="Review this continuity claim and add your reaction if you have context to share."
>
	<!-- Checkpoint Event -->
	{#if summary}
		<div class="bg-card rounded-xl border">
			<div class="p-5">
				<div class="flex flex-wrap items-center gap-2">
					<span class="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
						{summary.kindLabel}
					</span>
					{#if summary.parentId}
						<span class="rounded-full border px-2.5 py-1 text-xs">linked</span>
					{:else}
						<span class="rounded-full border px-2.5 py-1 text-xs">root</span>
					{/if}
					{#if hasOtsProof}
						<span
							class="rounded-full border border-green-500/30 px-2.5 py-1 text-xs text-green-600 dark:text-green-400"
						>
							OTS verified
						</span>
					{/if}
				</div>
				<p class="mt-4 text-sm leading-relaxed">
					{summary.content || 'No explanation provided.'}
				</p>

				{#if checkpointStatusSummary.length > 0}
					<div class="mt-4 rounded-xl border p-3 text-sm">
						<p class="font-medium">At a glance</p>
						<ul class="text-muted-foreground mt-2 space-y-1 text-xs">
							{#each checkpointStatusSummary as item}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if summary.parentId}
					<div class="text-muted-foreground mt-4 flex flex-wrap gap-2 text-xs">
						<a
							href="/checkpoints/{summary.parentId}"
							class="hover:text-foreground rounded-full border px-2.5 py-1"
						>
							Previous {shortKey(summary.parentId)}
						</a>
					</div>
				{/if}
			</div>
			<div class="bg-muted/30 border-t px-5 py-3">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<PubkeyProfile pubkey={summary.pubkey} showNip05={true} />
					<span class="text-muted-foreground text-xs"
						>{formatRelativeTimestamp(summary.createdAt)}</span
					>
				</div>
			</div>
		</div>
	{:else}
		<div class="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
			Loading checkpoint…
		</div>
	{/if}

	<LinkedClaimsSection checkpointId={params.id} {linkedClaims} />

	<ReactionsSection
		positivesCount={positives.length}
		negativesCount={negatives.length}
		reactionEventsCount={reactionEvents.length}
		{socialHighlights}
		{recentReactions}
		hasParent={Boolean(summary?.parentId)}
	/>

	<ParticipateSection
		summaryLoaded={Boolean(summary)}
		{reactionState}
		{reactionMessage}
		{lastReaction}
		onPublishReaction={publishReaction}
	/>

	<!-- Navigation -->
	<div class="flex justify-between gap-4 text-sm">
		<a
			href="/lineage/{params.id}"
			class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
		>
			← View lineage
		</a>
		<a
			href="/evidence/{params.id}"
			class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
		>
			Inspect raw →
		</a>
	</div>
</AppShell>
