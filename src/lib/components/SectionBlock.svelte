<script lang="ts">
	let {
		title,
		description,
		children
	}: {
		title: string;
		description?: string;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<section class="space-y-4">
	<div class="space-y-1">
		<h2 class="text-xl font-semibold tracking-tight">{title}</h2>
		{#if description}
			<p class="text-muted-foreground text-sm leading-6">{description}</p>
		{/if}
	</div>
	{@render children?.()}
</section>
