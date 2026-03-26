<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import PubkeyProfile from '$lib/components/PubkeyProfile.svelte';
	import SectionBlock from '$lib/components/SectionBlock.svelte';
	import { kinds } from 'nostr-tools';
	import { getOutboxes } from 'applesauce-core/helpers';
	import { eventStore } from '$lib/services/eventStore';
	import { watchCheckpointTimeline } from '$lib/services/oc.svelte';
	import { relayStore } from '$lib/stores/relay-store.svelte';
	import { getCheckpointSummary, formatRelativeTimestamp } from '$lib/utils/checkpoints';
	import { OC_CHECKPOINT_KIND } from '$lib/constants/oc';

	let { params } = $props();

	const checkpoint = $derived(
		eventStore.event({ id: params.id, relays: relayStore.selectedRelays })
	);
	const checkpointSummary = $derived(
		$checkpoint?.kind === OC_CHECKPOINT_KIND ? getCheckpointSummary($checkpoint) : null
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
	const checkpointTimeline = $derived(eventStore.timeline({ kinds: [OC_CHECKPOINT_KIND] }));
	const allCheckpointEvents = $derived(($checkpointTimeline ?? []).slice());
	const ancestorChain = $derived.by(() => {
		const chain: ReturnType<typeof getCheckpointSummary>[] = [];
		const seen = new Set<string>();
		let cursor = checkpointSummary;

		while (cursor && !seen.has(cursor.id)) {
			chain.unshift(cursor);
			seen.add(cursor.id);
			if (!cursor.parentId) break;
			const parentEvent = allCheckpointEvents.find((event) => event.id === cursor?.parentId);
			cursor = parentEvent ? getCheckpointSummary(parentEvent) : null;
		}

		return chain;
	});
	const lineageRoot = $derived(ancestorChain[0] ?? null);
	const directSuccessors = $derived(
		allCheckpointEvents
			.filter((event) => event.tags.some((tag) => tag[0] === 'e' && tag[1] === params.id))
			.sort((a, b) => b.created_at - a.created_at)
			.map(getCheckpointSummary)
	);
	const competingBranches = $derived.by(() => {
		const comparisonAnchorId = lineageRoot?.id ?? params.id;

		return allCheckpointEvents
			.filter((event) => event.id !== params.id)
			.filter((event) => event.tags.some((tag) => tag[0] === 'e' && tag[1] === comparisonAnchorId))
			.sort((a, b) => b.created_at - a.created_at)
			.map(getCheckpointSummary);
	});

	$effect(() => watchCheckpointTimeline(undefined, checkpointReadRelays));
</script>

<AppShell
	title={`Lineage ${params.id}`}
	badge="lineage view"
	intro="Trace the continuity chain, spot competing branches, and open any claim for closer inspection."
	actions={[
		{ href: `/checkpoints/${params.id}`, label: 'Open checkpoint' },
		{ href: '/dashboard', label: 'Dashboard', variant: 'secondary' }
	]}
>
	<SectionBlock
		title="How to read this view"
		description="Focus on structure first: origin, this claim, then any successor branches competing for trust."
	>
		<div class="grid gap-3 md:grid-cols-3">
			<div class="bg-card rounded-2xl border p-4">
				<h2 class="font-semibold">Origin</h2>
				<p class="text-muted-foreground mt-2 text-sm leading-6">
					Trace back to the root claim before judging successors.
				</p>
			</div>
			<div class="bg-card rounded-2xl border p-4">
				<h2 class="font-semibold">Current claim</h2>
				<p class="text-muted-foreground mt-2 text-sm leading-6">
					Review whether this checkpoint extends a known prior record.
				</p>
			</div>
			<div class="bg-card rounded-2xl border p-4">
				<h2 class="font-semibold">Competing branches</h2>
				<p class="text-muted-foreground mt-2 text-sm leading-6">
					Multiple successors stay visible so disagreement is not hidden.
				</p>
			</div>
		</div>
	</SectionBlock>

	<SectionBlock
		title="Ancestor chain"
		description="This path shows the current checkpoint in the context of the earlier claims it references."
	>
		{#if ancestorChain.length > 0}
			<div class="grid gap-3">
				{#each ancestorChain as item, index}
					<a
						href={`/checkpoints/${item.id}`}
						class="bg-card hover:bg-accent/20 rounded-2xl border p-4 transition-colors"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="font-medium">
									{index === 0
										? 'Root checkpoint'
										: index === ancestorChain.length - 1
											? 'Current checkpoint'
											: 'Linked checkpoint'}
								</p>
								<div class="mt-2">
									<PubkeyProfile pubkey={item.pubkey} showNip05={true} />
								</div>
								<p class="text-muted-foreground mt-2 text-sm leading-6">
									{item.content || 'No human-readable checkpoint note provided.'}
								</p>
							</div>
							<span class="text-muted-foreground text-sm"
								>{formatRelativeTimestamp(item.createdAt)}</span
							>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="bg-card text-muted-foreground rounded-2xl border p-5 text-sm">
				This checkpoint is still loading or no lineage information is available yet on the current
				relay view.
			</div>
		{/if}
	</SectionBlock>

	<SectionBlock
		title="Successor branches"
		description="If multiple linked checkpoints point at the same root claim, they remain visible side by side for honest comparison, even when you opened a linked checkpoint first."
	>
		{#if lineageRoot && lineageRoot.id !== params.id}
			<p class="text-muted-foreground mb-4 text-sm">
				Comparing branches from root checkpoint {lineageRoot.id} so you can still see competing linked
				claims from the same lineage.
			</p>
		{/if}
		{#if competingBranches.length > 0}
			<div class="grid gap-3 md:grid-cols-2">
				{#each competingBranches as branch}
					<a
						href={`/checkpoints/${branch.id}`}
						class="bg-card hover:bg-accent/20 rounded-2xl border p-4 transition-colors"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="font-medium">Candidate successor</p>
								<div class="mt-2">
									<PubkeyProfile pubkey={branch.pubkey} showNip05={true} />
								</div>
								<p class="text-muted-foreground mt-2 text-sm leading-6">
									{branch.content || 'No human-readable checkpoint note provided.'}
								</p>
								{#if branch.rootId}
									<p class="text-muted-foreground mt-2 text-sm break-all">
										Root lineage: {branch.rootId}
									</p>
								{/if}
							</div>
							<span class="text-muted-foreground text-sm"
								>{formatRelativeTimestamp(branch.createdAt)}</span
							>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="bg-card text-muted-foreground rounded-2xl border p-5 text-sm">
				No competing linked checkpoints are visible for this lineage right now.
			</div>
		{/if}
	</SectionBlock>
</AppShell>
