<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import SectionBlock from '$lib/components/SectionBlock.svelte';
	import { kinds, type NostrEvent } from 'nostr-tools';
	import { OC_SNAPSHOT_KIND } from '$lib/constants/oc';
	import { activeAccount } from '$lib/services/accountManager.svelte';
	import { eventStore } from '$lib/services/eventStore';
	import {
		getUserMailboxes,
		getUserReadRelays,
		parseSnapshotEvent,
		publishSnapshot
	} from '$lib/services/oc.svelte';

	type SnapshotCandidate = {
		event: NostrEvent;
		kind: number;
		title: string;
		summary: string;
		currentSnapshotId?: string;
		isOutdated: boolean;
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
	const snapshotTimeline = $derived(
		pubkey ? eventStore.timeline({ kinds: [OC_SNAPSHOT_KIND], authors: [pubkey] }) : null
	);
	const snapshotEvents = $derived(
		($snapshotTimeline ?? []).slice().sort((a, b) => b.created_at - a.created_at)
	);
	const parsedSnapshots = $derived(snapshotEvents.map(parseSnapshotEvent));
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
	const snapshotCandidates = $derived<SnapshotCandidate[]>(
		[$metadataEvent, $contactsEvent]
			.filter((event): event is NostrEvent => !!event)
			.map((event) => {
				const latestSnapshot = latestSnapshotsByKind.get(event.kind);
				const title =
					event.kind === kinds.Metadata ? 'Profile metadata snapshot' : 'Contact list snapshot';
				const summary =
					event.kind === kinds.Metadata
						? summarizeMetadataEvent(event)
						: summarizeContactsEvent(event);

				return {
					event,
					kind: event.kind,
					title,
					summary,
					currentSnapshotId: latestSnapshot?.id,
					isOutdated: latestSnapshot?.archivedEventId !== event.id
				};
			})
	);
	let publishState = $state<Record<number, 'idle' | 'publishing' | 'success' | 'error'>>({});
	let publishMessages = $state<Record<number, string>>({});
	let publishedIds = $state<Record<number, string>>({});

	function formatTimestamp(unix: number) {
		return new Date(unix * 1000).toLocaleString();
	}

	function summarizeMetadataEvent(event: NostrEvent) {
		try {
			const parsed = JSON.parse(event.content || '{}') as Record<string, string | undefined>;
			const parts = [parsed.name, parsed.display_name, parsed.nip05].filter(Boolean);
			return parts.length > 0
				? parts.join(' · ')
				: 'No display fields found in the fetched metadata content.';
		} catch {
			return 'Metadata content is not parseable JSON, but it can still be preserved.';
		}
	}

	function summarizeContactsEvent(event: NostrEvent) {
		const followedPubkeys = event.tags.filter((tag: string[]) => tag[0] === 'p').length;
		const relayHints = event.tags.filter((tag: string[]) => tag[0] === 'relay').length;
		return `${followedPubkeys} followed pubkeys · ${relayHints} relay hints`;
	}

	async function handleSnapshotPublish(kind: number) {
		const candidate = snapshotCandidates.find((item) => item.kind === kind);
		if (!candidate) return;

		publishState = { ...publishState, [kind]: 'publishing' };
		publishMessages = { ...publishMessages, [kind]: '' };

		try {
			const result = await publishSnapshot({ archivedEvent: candidate.event });
			publishState = { ...publishState, [kind]: 'success' };
			publishMessages = {
				...publishMessages,
				[kind]: `Published to ${result.relays.length} relays.`
			};
			publishedIds = { ...publishedIds, [kind]: result.event.id };
		} catch (error) {
			publishState = { ...publishState, [kind]: 'error' };
			publishMessages = {
				...publishMessages,
				[kind]: error instanceof Error ? error.message : 'Snapshot publication failed.'
			};
		}
	}
</script>

<AppShell
	title="Snapshots"
	badge="preservation"
	intro="Preserve current profile and contact-list state so later evaluators can inspect the historical evidence that supported a continuity claim."
	actions={[
		{ href: '/create/checkpoint', label: 'Publish checkpoint' },
		{ href: '/dashboard', label: 'Dashboard', variant: 'secondary' }
	]}
>
	<SectionBlock
		title="Snapshot now"
		description="Preserve the current version of important replaceable events so later evaluation has reliable historical context."
	>
		{#if snapshotCandidates.length > 0}
			<div class="grid gap-4 md:grid-cols-2">
				{#each snapshotCandidates as candidate}
					<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
						<div class="flex items-start justify-between gap-3">
							<p class="font-medium">{candidate.title}</p>
							<span
								class={`rounded-full border px-2.5 py-1 text-[11px] tracking-[0.14em] uppercase ${candidate.isOutdated ? '' : 'text-emerald-700 dark:text-emerald-300'}`}
							>
								{candidate.isOutdated ? 'new snapshot recommended' : 'already current'}
							</span>
						</div>
						<p class="text-muted-foreground mt-3">Current fetched summary: {candidate.summary}</p>
						<p class="text-muted-foreground mt-2 break-all">
							Current event id: {candidate.event.id}
						</p>
						<p class="text-muted-foreground mt-2">
							Created at: {formatTimestamp(candidate.event.created_at)}
						</p>
						{#if candidate.currentSnapshotId}
							<p class="text-muted-foreground mt-2 break-all">
								Latest snapshot id: {candidate.currentSnapshotId}
							</p>
						{/if}
						<details class="mt-3">
							<summary class="cursor-pointer text-sm font-medium"
								>Inspect current fetched event</summary
							>
							<pre
								class="bg-muted mt-2 overflow-x-auto rounded-xl border p-3 text-xs leading-6">{JSON.stringify(
									candidate.event,
									null,
									2
								)}</pre>
						</details>
						<div class="mt-3 flex flex-wrap gap-3">
							<button
								type="button"
								class="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
								onclick={() => handleSnapshotPublish(candidate.kind)}
								disabled={publishState[candidate.kind] === 'publishing'}
							>
								{publishState[candidate.kind] === 'publishing'
									? 'Publishing…'
									: `Publish kind ${candidate.kind} snapshot`}
							</button>
							{#if publishedIds[candidate.kind]}
								<a
									class="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
									href={`/evidence/${publishedIds[candidate.kind]}`}
								>
									Open new snapshot event
								</a>
							{/if}
						</div>
						{#if publishMessages[candidate.kind]}
							<p
								class={`mt-2 text-sm ${publishState[candidate.kind] === 'error' ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}
							>
								{publishMessages[candidate.kind]}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="bg-card text-muted-foreground rounded-2xl border p-5 text-sm">
				No current kind 0 or kind 3 event is loaded for the connected identity yet.
			</div>
		{/if}
	</SectionBlock>

	<SectionBlock
		title="Published snapshots"
		description="Previously preserved snapshots stay useful even after the live event changes."
	>
		{#if parsedSnapshots.length > 0}
			<div class="grid gap-4 md:grid-cols-2">
				{#each parsedSnapshots as snapshot}
					<div class="bg-card rounded-2xl border p-4 text-sm leading-6">
						<div class="flex items-start justify-between gap-3">
							<p class="font-medium">{snapshot.title}</p>
							<span
								class={`rounded-full border px-2.5 py-1 text-[11px] tracking-[0.14em] uppercase ${snapshot.isValid ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}
							>
								{snapshot.isValid ? 'locally consistent' : 'needs review'}
							</span>
						</div>
						<p class="text-muted-foreground mt-3">{snapshot.summary}</p>
						<p class="text-muted-foreground mt-2 break-all">Snapshot id: {snapshot.id}</p>
						<p class="text-muted-foreground mt-2 break-all">
							Archived event id: {snapshot.archivedEventId || 'Missing e tag'}
						</p>
						<p class="text-muted-foreground mt-2">
							Snapshot created at: {formatTimestamp(snapshot.createdAt)}
						</p>
						<p
							class="mt-2 text-sm {snapshot.isValid
								? 'text-muted-foreground'
								: 'text-amber-700 dark:text-amber-300'}"
						>
							{snapshot.validationMessage}
						</p>
						<a
							class="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
							href={`/evidence/${snapshot.id}`}
						>
							Open snapshot event
						</a>
						{#if snapshot.archivedEvent}
							<details class="mt-3">
								<summary class="cursor-pointer text-sm font-medium"
									>Inspect archived event JSON</summary
								>
								<pre
									class="bg-muted mt-2 overflow-x-auto rounded-xl border p-3 text-xs leading-6">{JSON.stringify(
										snapshot.archivedEvent,
										null,
										2
									)}</pre>
							</details>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="bg-card text-muted-foreground rounded-2xl border p-5 text-sm">
				No snapshot events have been published yet for the connected identity on the current relay
				view.
			</div>
		{/if}
	</SectionBlock>
</AppShell>
