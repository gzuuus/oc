<script lang="ts">
	import PubkeyProfile from '$lib/components/PubkeyProfile.svelte';
	import {
		badgeClass,
		continuityTone,
		relationTone,
		type BadgeTone
	} from '$lib/components/checkpoint-detail/helpers';
	import { formatRelativeTimestamp } from '$lib/utils/checkpoints';

	type HighlightBadge = { label: string; tone: BadgeTone };
	type RecentReaction = {
		pubkey: string;
		createdAt: number;
		symbol: '+' | '-';
		inAuthorContacts: boolean;
		inPreviousContacts: boolean;
		matchesPrevious: boolean;
	};

	let {
		positivesCount,
		negativesCount,
		reactionEventsCount,
		socialHighlights,
		recentReactions,
		hasParent
	}: {
		positivesCount: number;
		negativesCount: number;
		reactionEventsCount: number;
		socialHighlights: HighlightBadge[];
		recentReactions: RecentReaction[];
		hasParent: boolean;
	} = $props();
</script>

<div class="bg-card rounded-xl border p-5">
	<div class="flex items-center justify-between">
		<h3 class="font-medium">Reactions</h3>
		<div class="flex items-center gap-4 text-sm">
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
				{positivesCount} +
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-2 w-2 rounded-full bg-red-500"></span>
				{negativesCount} -
			</span>
		</div>
	</div>

	{#if reactionEventsCount > 0}
		<p class="text-muted-foreground mt-2 text-xs">
			Community responses appear here. Give extra weight to people who already knew this identity or
			reacted across linked checkpoints.
		</p>
		{#if socialHighlights.length > 0}
			<div class="mt-3 rounded-xl border p-3 text-xs">
				<p class="font-medium">What stands out</p>
				<ul class="text-muted-foreground mt-2 space-y-1">
					{#each socialHighlights as badge}
						<li class="flex items-start gap-2">
							<span class={badgeClass(badge.tone)}
								>{badge.tone === 'green'
									? 'support'
									: badge.tone === 'red'
										? 'dispute'
										: 'note'}</span
							>
							<span>{badge.label}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{:else}
		<p class="text-muted-foreground mt-2 text-xs">
			No reactions yet. Be the first to participate if you have relevant context.
		</p>
	{/if}

	{#if recentReactions.length > 0}
		<div class="mt-4 space-y-2 border-t pt-4">
			{#each recentReactions as reaction}
				<div class="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
					<div class="flex min-w-0 items-center gap-2">
						<span
							class:text-green-600={reaction.symbol === '+'}
							class:text-red-600={reaction.symbol === '-'}
							class="font-medium"
						>
							{reaction.symbol}
						</span>
						<PubkeyProfile pubkey={reaction.pubkey} />
						<div class="flex flex-wrap gap-1">
							{#if reaction.inAuthorContacts}
								<span class={badgeClass(relationTone(reaction))}>
									{reaction.symbol === '+' ? 'known by author' : 'known by author'}
								</span>
							{/if}
							{#if reaction.inPreviousContacts}
								<span class={badgeClass(relationTone(reaction))}> seen in previous contacts </span>
							{/if}
							{#if hasParent}
								<span class={badgeClass(continuityTone(reaction))}>
									{#if reaction.matchesPrevious}
										{reaction.symbol === '+' ? 'repeated support' : 'repeated dispute'}
									{:else}
										new on this checkpoint
									{/if}
								</span>
							{/if}
						</div>
					</div>
					<span class="text-muted-foreground text-xs"
						>{formatRelativeTimestamp(reaction.createdAt)}</span
					>
				</div>
			{/each}
		</div>
	{/if}
</div>
