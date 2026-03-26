<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		intro,
		badge,
		actions,
		children
	}: {
		title: string;
		intro: string;
		badge?: string;
		actions?: { href: string; label: string; variant?: 'primary' | 'secondary' }[];
		children?: Snippet;
	} = $props();
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
	<section class="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
		<div class="max-w-2xl space-y-2">
			{#if badge}
				<div class="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
					{badge}
				</div>
			{/if}
			<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
			<p class="text-muted-foreground text-sm leading-6">{intro}</p>
		</div>

		{#if actions?.length}
			<div class="flex flex-wrap gap-2">
				{#each actions as action}
					<a
						href={action.href}
						class={action.variant === 'secondary'
							? 'inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium'
							: 'bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium'}
					>
						{action.label}
					</a>
				{/each}
			</div>
		{/if}
	</section>

	{@render children?.()}
</div>
