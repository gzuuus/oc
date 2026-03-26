<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import PubkeyProfile from '$lib/components/PubkeyProfile.svelte';
	import SectionBlock from '$lib/components/SectionBlock.svelte';
	import { kinds, type NostrEvent } from 'nostr-tools';
	import { eventStore } from '$lib/services/eventStore';
	import { relayStore } from '$lib/stores/relay-store.svelte';
	import {
		parseSnapshotEvent,
		watchOtsProofs,
		watchPublishedSnapshots
	} from '$lib/services/oc.svelte';
	import { getCheckpointSummary, formatRelativeTimestamp } from '$lib/utils/checkpoints';
	import { OC_CHECKPOINT_KIND, OC_SNAPSHOT_KIND, OTS_ATTESTATION_KIND } from '$lib/constants/oc';

	let { params } = $props();

	const record = $derived(eventStore.event({ id: params.id, relays: relayStore.selectedRelays }));
	const checkpointSummary = $derived(
		$record && $record.kind === OC_CHECKPOINT_KIND ? getCheckpointSummary($record) : null
	);
	const snapshotSummary = $derived(
		$record && $record.kind === OC_SNAPSHOT_KIND ? parseSnapshotEvent($record) : null
	);
	const relatedReactionEvents = $derived(
		eventStore
			.getByFilters({ kinds: [kinds.Reaction], '#e': [params.id] })
			.sort((a, b) => b.created_at - a.created_at)
	);
	const otsEvents = $derived(
		eventStore
			.getByFilters({ kinds: [OTS_ATTESTATION_KIND], '#e': [params.id] })
			.sort((a, b) => b.created_at - a.created_at)
	);

	function shortKey(value: string, start = 12, end = 8) {
		return value.length <= start + end ? value : `${value.slice(0, start)}…${value.slice(-end)}`;
	}

	function getRecordTitle(event?: NostrEvent | null) {
		if (!event) return `Evidence ${params.id}`;
		if (event.kind === OC_CHECKPOINT_KIND) return 'Checkpoint evidence';
		if (event.kind === OC_SNAPSHOT_KIND) return 'Snapshot evidence';
		if (event.kind === kinds.Reaction) return 'Participation evidence';
		return `Evidence kind ${event.kind}`;
	}

	$effect(() => watchOtsProofs(params.id));

	$effect(() => {
		if (!$record?.pubkey) return;
		return watchPublishedSnapshots($record.pubkey);
	});
</script>

<AppShell
	title={getRecordTitle($record)}
	badge="inspector"
	intro="Inspect the raw event, related evidence, and the client interpretation without hiding the underlying data."
	actions={[
		{ href: `/checkpoints/${params.id}`, label: 'Back to checkpoint' },
		{ href: '/dashboard', label: 'Dashboard', variant: 'secondary' }
	]}
>
	<SectionBlock
		title="Summary first"
		description="Start with the client summary, then drill into exact event data only if you need deeper verification."
	>
		{#if $record}
			<div class="grid gap-3 md:grid-cols-3">
				<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
					<p class="font-medium">Kind</p>
					<p class="text-muted-foreground mt-2">{$record.kind}</p>
				</div>
				<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
					<p class="font-medium">Author</p>
					<div class="mt-2">
						<PubkeyProfile pubkey={$record.pubkey} showNip05={true} />
					</div>
				</div>
				<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
					<p class="font-medium">Seen time</p>
					<p class="text-muted-foreground mt-2">{formatRelativeTimestamp($record.created_at)}</p>
				</div>
			</div>
		{:else}
			<div class="bg-card text-muted-foreground rounded-2xl border p-5 text-sm">
				Loading this event from the current relay view.
			</div>
		{/if}
	</SectionBlock>

	<SectionBlock
		title="Parsed interpretation"
		description="These summaries help with orientation, but they are not authoritative proof by themselves."
	>
		{#if checkpointSummary}
			<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
				<p class="font-medium">Checkpoint interpretation</p>
				<p class="text-muted-foreground mt-2">
					{checkpointSummary.content || 'No human-readable checkpoint note provided.'}
				</p>
				<p class="text-muted-foreground mt-2">
					Type: {checkpointSummary.parentId ? 'linked continuity claim' : 'root continuity claim'}
				</p>
				{#if checkpointSummary.parentId}
					<p class="text-muted-foreground mt-2 break-all">
						Previous checkpoint: {checkpointSummary.parentId}
					</p>
				{/if}
				{#if checkpointSummary.rootId}
					<p class="text-muted-foreground mt-2">
						Root lineage: {checkpointSummary.rootId}
					</p>
				{/if}
				{#if checkpointSummary.hasCommit || checkpointSummary.hasReveal}
					<p class="text-muted-foreground mt-2">
						Embedded evidence: {checkpointSummary.hasCommit
							? 'commit '
							: ''}{checkpointSummary.hasReveal ? 'reveal' : ''}
					</p>
				{/if}
			</div>
		{:else if snapshotSummary}
			<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
				<p class="font-medium">Snapshot interpretation</p>
				<p class="text-muted-foreground mt-2">{snapshotSummary.summary}</p>
				<p class="text-muted-foreground mt-2 break-all">
					Archived event id: {snapshotSummary.archivedEventId || 'Missing e tag'}
				</p>
				<p
					class="mt-2 text-sm {snapshotSummary.isValid
						? 'text-muted-foreground'
						: 'text-amber-700 dark:text-amber-300'}"
				>
					{snapshotSummary.validationMessage}
				</p>
			</div>
		{:else if $record?.kind === kinds.Reaction}
			<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
				<p class="font-medium">Participation interpretation</p>
				<p class="text-muted-foreground mt-2">
					{$record.content === '-'
						? 'This event disputes the referenced checkpoint.'
						: 'This event endorses the referenced checkpoint.'}
				</p>
			</div>
		{:else}
			<div class="bg-card text-muted-foreground rounded-2xl border p-4 text-sm leading-6">
				No specialized parser is available for this event kind yet, so rely on the raw event and
				tags below.
			</div>
		{/if}
	</SectionBlock>

	<SectionBlock
		title="Related evidence"
		description="Use nearby reactions, attestations, and preserved context to inspect supporting or conflicting signals."
	>
		<div class="grid gap-3 md:grid-cols-2">
			<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
				<p class="font-medium">Reactions linked to this event</p>
				<p class="text-muted-foreground mt-2">
					{relatedReactionEvents.length} visible participation events
				</p>
			</div>
			<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
				<p class="font-medium">OTS attestations</p>
				<p class="text-muted-foreground mt-2">{otsEvents.length} visible OTS-related events</p>
			</div>
		</div>
	</SectionBlock>

	<SectionBlock
		title="Raw event"
		description="Protocol data remains directly inspectable so advanced users can verify the client interpretation independently."
	>
		{#if $record}
			<pre class="bg-muted overflow-x-auto rounded-xl border p-4 text-xs leading-6">{JSON.stringify(
					$record,
					null,
					2
				)}</pre>
		{:else}
			<div class="bg-card text-muted-foreground rounded-2xl border p-5 text-sm">
				The raw event will appear here once it is available.
			</div>
		{/if}
	</SectionBlock>
</AppShell>
