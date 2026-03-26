<script lang="ts">
	import { formatRelativeTimestamp } from '$lib/utils/checkpoints';

	let {
		checkpointId,
		linkedClaims
	}: {
		checkpointId: string;
		linkedClaims: Array<{
			id: string;
			content: string;
			rootId?: string;
			createdAt: number;
		}>;
	} = $props();
</script>

{#if linkedClaims.length > 0}
	<div class="bg-card rounded-xl border p-5">
		<div class="flex items-center justify-between gap-3">
			<div>
				<h3 class="font-medium">Linked claims from this checkpoint</h3>
				<p class="text-muted-foreground mt-2 text-xs">
					Use this section to discover successor claims directly from the current checkpoint,
					including root checkpoints.
				</p>
			</div>
			<a href="/lineage/{checkpointId}" class="text-muted-foreground hover:text-foreground text-sm"
				>Open lineage</a
			>
		</div>

		<div class="mt-4 grid gap-3 md:grid-cols-2">
			{#each linkedClaims as claim}
				<a
					href={`/checkpoints/${claim.id}`}
					class="hover:bg-accent/20 rounded-xl border p-4 transition-colors"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-medium">Linked checkpoint</p>
							<p class="text-muted-foreground mt-2 text-sm leading-6">
								{claim.content || 'No human-readable checkpoint note provided.'}
							</p>
							{#if claim.rootId}
								<p class="text-muted-foreground mt-2 text-xs break-all">
									Root lineage: {claim.rootId}
								</p>
							{/if}
						</div>
						<span class="text-muted-foreground text-xs"
							>{formatRelativeTimestamp(claim.createdAt)}</span
						>
					</div>
				</a>
			{/each}
		</div>
	</div>
{/if}
