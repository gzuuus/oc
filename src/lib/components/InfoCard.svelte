<script lang="ts">
	let {
		title,
		description,
		href,
		meta
	}: {
		title: string;
		description: string;
		href?: string;
		meta?: string;
	} = $props();
</script>

<article class="bg-card rounded-2xl border p-5">
	<div class="space-y-3">
		<div class="flex items-start justify-between gap-3">
			<h2 class="text-lg font-semibold">{title}</h2>
			{#if meta}
				<span class="text-muted-foreground text-xs">{meta}</span>
			{/if}
		</div>
		<p class="text-muted-foreground text-sm leading-6">{description}</p>
		{#if href}
			<a {href} class="text-sm font-medium underline underline-offset-4">Open</a>
		{/if}
	</div>
</article>
