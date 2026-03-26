<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import InfoCard from '$lib/components/InfoCard.svelte';
	import PubkeyProfile from '$lib/components/PubkeyProfile.svelte';
	import SectionBlock from '$lib/components/SectionBlock.svelte';
	import { OC_CHECKPOINT_KIND } from '$lib/constants/oc';
	import { dashboardSections } from '$lib/data/app';
	import { activeAccount } from '$lib/services/accountManager.svelte';
	import { eventStore } from '$lib/services/eventStore';
	import {
		getMailboxLookupRelays,
		getUserReadRelaysFromMailboxes,
		watchCheckpointTimeline
	} from '$lib/services/oc.svelte';
	import { formatRelativeTimestamp, getCheckpointSummary } from '$lib/utils/checkpoints';

	const pubkey = $derived($activeAccount?.pubkey);
	const mailboxLookupRelays = $derived(getMailboxLookupRelays());
	const userMailboxes = $derived(
		pubkey ? eventStore.mailboxes({ pubkey, relays: mailboxLookupRelays }) : undefined
	);
	const homeReadRelays = $derived(getUserReadRelaysFromMailboxes($userMailboxes));
	const checkpointTimeline = $derived(eventStore.timeline({ kinds: [OC_CHECKPOINT_KIND] }));
	const recentCheckpoints = $derived(
		($checkpointTimeline ?? []).slice(0, 12).map(getCheckpointSummary)
	);

	$effect(() => {
		const stopCheckpoints = watchCheckpointTimeline(undefined, homeReadRelays);
		const stopOwnCheckpoints = pubkey ? watchCheckpointTimeline(pubkey, homeReadRelays) : () => {};

		return () => {
			stopCheckpoints();
			stopOwnCheckpoints();
		};
	});
</script>

<AppShell
	title="Open Continuity"
	badge="evidence workflows"
	intro="Prepare evidence, publish checkpoints, and evaluate continuity claims without pretending there is a single authority."
>
	<SectionBlock title="Start here">
		<div class="grid gap-4">
			{#each dashboardSections as section}
				<InfoCard {...section} />
			{/each}
		</div>
	</SectionBlock>

	<SectionBlock
		title="Recent checkpoints"
		description="Visible checkpoint claims from the current relay view. Open one to inspect it in context."
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
								<PubkeyProfile pubkey={checkpoint.pubkey} />
								<p class="font-medium">
									{checkpoint.content || 'No human-readable checkpoint note provided.'}
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
				No checkpoints have been discovered yet on the currently selected relays.
			</div>
		{/if}
	</SectionBlock>
</AppShell>
