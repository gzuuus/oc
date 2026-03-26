<script lang="ts">
	let {
		summaryLoaded,
		reactionState,
		reactionMessage,
		lastReaction,
		onPublishReaction
	}: {
		summaryLoaded: boolean;
		reactionState: 'idle' | 'publishing' | 'success' | 'error';
		reactionMessage: string;
		lastReaction: '+' | '-' | null;
		onPublishReaction: (symbol: '+' | '-') => void;
	} = $props();
</script>

<div class="bg-card rounded-xl border p-5">
	<h3 class="font-medium">Participate</h3>
	<p class="text-muted-foreground mt-2 text-sm">
		Your reaction becomes part of the visible social proof. If you knew this identity before, your
		input carries more weight for others evaluating this claim.
	</p>

	<div class="mt-4 flex gap-3">
		<button
			class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
			type="button"
			onclick={() => onPublishReaction('+')}
			disabled={reactionState === 'publishing' || !summaryLoaded}
		>
			{#if reactionState === 'publishing' && lastReaction === '+'}
				Publishing…
			{:else}
				<span class="text-lg leading-none">+</span>
			{/if}
		</button>
		<button
			class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50"
			type="button"
			onclick={() => onPublishReaction('-')}
			disabled={reactionState === 'publishing' || !summaryLoaded}
		>
			{#if reactionState === 'publishing' && lastReaction === '-'}
				Publishing…
			{:else}
				<span class="text-lg leading-none">−</span>
			{/if}
		</button>
	</div>

	{#if reactionState === 'error'}
		<p
			class="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-300"
		>
			{reactionMessage}
		</p>
	{:else if reactionState === 'success'}
		<p
			class="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-700 dark:text-green-300"
		>
			{reactionMessage}
		</p>
	{/if}
</div>
