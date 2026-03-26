<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import ReadinessPanel from '$lib/components/ReadinessPanel.svelte';
	import SectionBlock from '$lib/components/SectionBlock.svelte';
	import { kinds, type NostrEvent } from 'nostr-tools';
	import { relayStore } from '$lib/stores/relay-store.svelte';
	import { activeAccount } from '$lib/services/accountManager.svelte';
	import { buildReadinessItems } from '$lib/data/app';
	import {
		getIdentityReadiness,
		getUserReadRelays,
		parseSnapshotEvent,
		publishCheckpointOts,
		publishSnapshot,
		watchOtsProofs,
		watchCheckpointTimeline
	} from '$lib/services/oc.svelte';
	import { eventStore } from '$lib/services/eventStore';
	import { OC_CHECKPOINT_KIND, OC_SNAPSHOT_KIND, OTS_ATTESTATION_KIND } from '$lib/constants/oc';
	import { formatRelativeTimestamp, getCheckpointSummary } from '$lib/utils/checkpoints';

	const pubkey = $derived($activeAccount?.pubkey);
	const userReadRelays = $derived(getUserReadRelays(pubkey));
	const metadataEvent = $derived(
		pubkey ? eventStore.replaceable({ kind: kinds.Metadata, pubkey, relays: userReadRelays }) : null
	);
	const contactsEvent = $derived(
		pubkey ? eventStore.replaceable({ kind: kinds.Contacts, pubkey, relays: userReadRelays }) : null
	);
	const readiness = $derived.by(() => {
		const readiness = getIdentityReadiness($activeAccount);
		const hasRelaySelection = relayStore.selectedRelays.length > 0;

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
	const snapshotTimeline = $derived(
		pubkey ? eventStore.timeline({ kinds: [OC_SNAPSHOT_KIND], authors: [pubkey] }) : null
	);
	const parsedSnapshots = $derived(($snapshotTimeline ?? []).map(parseSnapshotEvent));
	const latestSnapshotsByKind = $derived.by(() => {
		const map = new Map<number, ReturnType<typeof parseSnapshotEvent>>();

		for (const snapshot of parsedSnapshots) {
			if (typeof snapshot.archivedKind !== 'number') continue;
			if (!map.has(snapshot.archivedKind)) {
				map.set(snapshot.archivedKind, snapshot);
			}
		}

		return map;
	});
	let metadataOtsEvents = $state<NostrEvent[]>([]);
	let contactsOtsEvents = $state<NostrEvent[]>([]);
	let snapshotState = $state<Record<number, 'idle' | 'publishing' | 'success' | 'error'>>({});
	let snapshotMessages = $state<Record<number, string>>({});
	let snapshotLinks = $state<Record<number, string>>({});
	let otsState = $state<Record<number, 'idle' | 'publishing' | 'success' | 'error'>>({});
	let otsMessages = $state<Record<number, string>>({});
	let otsLinks = $state<Record<number, string>>({});
	const readinessItems = $derived(
		buildReadinessItems({
			...readiness,
			hasMetadataSnapshot:
				!!$metadataEvent &&
				latestSnapshotsByKind.get(kinds.Metadata)?.archivedEventId === $metadataEvent.id,
			hasContactsSnapshot:
				!!$contactsEvent &&
				latestSnapshotsByKind.get(kinds.Contacts)?.archivedEventId === $contactsEvent.id,
			hasMetadataOts: metadataOtsEvents.length > 0,
			hasContactsOts: contactsOtsEvents.length > 0
		})
	);
	const checkpointTimeline = $derived(
		pubkey ? eventStore.timeline({ kinds: [OC_CHECKPOINT_KIND], authors: [pubkey] }) : null
	);
	const recentCheckpoints = $derived(
		($checkpointTimeline ?? []).slice(0, 5).map(getCheckpointSummary)
	);

	$effect(() => {
		if (!pubkey) return;
		const stopCheckpoints = watchCheckpointTimeline(pubkey, userReadRelays);

		return () => {
			stopCheckpoints();
		};
	});

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

	async function handleSnapshotPublish(kind: number) {
		const candidate =
			kind === kinds.Metadata ? $metadataEvent : kind === kinds.Contacts ? $contactsEvent : null;
		if (!candidate) return;

		snapshotState = { ...snapshotState, [kind]: 'publishing' };
		snapshotMessages = { ...snapshotMessages, [kind]: '' };

		try {
			const result = await publishSnapshot({ archivedEvent: candidate });
			snapshotState = { ...snapshotState, [kind]: 'success' };
			snapshotMessages = {
				...snapshotMessages,
				[kind]: `Published to ${result.relays.length} relays.`
			};
			snapshotLinks = { ...snapshotLinks, [kind]: `/evidence/${result.event.id}` };
		} catch (error) {
			snapshotState = { ...snapshotState, [kind]: 'error' };
			snapshotMessages = {
				...snapshotMessages,
				[kind]: error instanceof Error ? error.message : 'Snapshot publication failed.'
			};
		}
	}

	async function handleOtsPublish(kind: number) {
		const candidate =
			kind === kinds.Metadata ? $metadataEvent : kind === kinds.Contacts ? $contactsEvent : null;
		if (!candidate) return;

		otsState = { ...otsState, [kind]: 'publishing' };
		otsMessages = { ...otsMessages, [kind]: '' };

		try {
			const result = await publishCheckpointOts(candidate.id);
			otsState = { ...otsState, [kind]: 'success' };
			otsMessages = { ...otsMessages, [kind]: result.message };
			otsLinks = { ...otsLinks, [kind]: `/evidence/${result.attestationEventId}` };
		} catch (error) {
			otsState = { ...otsState, [kind]: 'error' };
			otsMessages = {
				...otsMessages,
				[kind]:
					error instanceof Error ? error.message : 'OpenTimestamps attestation request failed.'
			};
		}
	}
</script>

<AppShell
	title="Dashboard"
	badge={$activeAccount ? 'connected identity' : 'exploration mode'}
	intro={$activeAccount
		? 'Review readiness, preserve stronger evidence, and move into checkpoint publishing with context.'
		: 'Connect an identity to assess readiness, preserve state, and begin continuity publishing.'}
	actions={[
		{ href: '/create/checkpoint', label: 'Publish checkpoint' },
		{ href: '/create/snapshot', label: 'Preserve snapshots', variant: 'secondary' }
	]}
>
	<ReadinessPanel
		items={readinessItems}
		onPublishSnapshot={handleSnapshotPublish}
		onPublishOts={handleOtsPublish}
		{snapshotState}
		{snapshotMessages}
		{snapshotLinks}
		{otsState}
		{otsMessages}
		{otsLinks}
	/>

	<SectionBlock
		title="Recent checkpoints"
		description="The latest continuity claims visible for the connected identity."
	>
		{#if recentCheckpoints.length}
			<div class="grid gap-3">
				{#each recentCheckpoints as checkpoint}
					<a
						href={`/checkpoints/${checkpoint.id}`}
						class="hover:bg-accent/20 rounded-xl border p-4 transition-colors"
					>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div class="space-y-1.5">
								<div class="flex flex-wrap items-center gap-2">
									<span class="rounded-full border px-2.5 py-1 text-xs font-medium"
										>{checkpoint.kindLabel}</span
									>
								</div>
								<p class="font-medium">
									{checkpoint.content || 'No public note was added to this checkpoint claim.'}
								</p>
								<p class="text-muted-foreground text-sm">
									{checkpoint.hasCommit ? 'commit' : 'no commit'} · {checkpoint.hasReveal
										? 'reveal'
										: 'no reveal'}
								</p>
							</div>
							<div class="text-muted-foreground text-sm">
								{formatRelativeTimestamp(checkpoint.createdAt)}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="bg-card text-muted-foreground rounded-2xl border p-5 text-sm">
				No checkpoint events are visible yet for the connected identity on the current relay set.
			</div>
		{/if}
	</SectionBlock>
</AppShell>
