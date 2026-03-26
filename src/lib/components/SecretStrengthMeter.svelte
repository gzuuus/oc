<script lang="ts">
	import { estimateSecretStrength } from '$lib/utils/secret-strength';
	import { Spinner } from '$lib/components/ui/spinner';
	import { cn } from '$lib/utils';

	type Props = {
		secret?: string;
	};

	const props: Props = $props();
	const secret = $derived(props.secret ?? '');
	let debouncedSecret = $state('');
	let debounceHandle: ReturnType<typeof setTimeout> | null = null;
	const isUpdating = $derived(secret !== debouncedSecret);

	$effect(() => {
		if (debounceHandle) {
			clearTimeout(debounceHandle);
			debounceHandle = null;
		}

		if (!secret) {
			debouncedSecret = '';
			return;
		}

		debounceHandle = setTimeout(() => {
			debouncedSecret = secret;
			debounceHandle = null;
		}, 120);

		return () => {
			if (debounceHandle) {
				clearTimeout(debounceHandle);
				debounceHandle = null;
			}
		};
	});

	const strength = $derived(estimateSecretStrength(debouncedSecret));
	const toneClass = $derived.by(() => {
		if (strength.percent <= 20) return 'bg-red-500';
		if (strength.percent <= 40) return 'bg-orange-500';
		if (strength.percent <= 60) return 'bg-amber-500';
		if (strength.percent <= 80) return 'bg-lime-500';
		return 'bg-emerald-500';
	});
</script>

{#if secret}
	<div class="space-y-3 rounded-xl border p-3">
		<div class="flex items-center justify-between gap-3">
			<p class="text-sm font-medium">Secret strength</p>
			<p class="text-sm font-medium">{strength.label}</p>
		</div>

		<div class="bg-muted h-2 overflow-hidden rounded-full">
			<div
				class={cn('h-full rounded-full transition-all duration-200', toneClass)}
				style={`width: ${strength.percent}%`}
			></div>
		</div>

		<p class="text-muted-foreground text-sm leading-6">{strength.feedback}</p>

		{#if isUpdating}
			<p class="text-muted-foreground flex items-center gap-2 text-xs leading-5">
				<Spinner class="size-3" aria-label="Updating strength estimate" />
				<span>Updating strength estimate…</span>
			</p>
		{/if}

		<p class="text-muted-foreground text-xs leading-5">
			Estimated offline fast-hash crack time: {strength.offlineFastHashingDisplay}. log10 guesses:
			{strength.guessesLog10.toFixed(1)}. Estimated bits: {strength.estimatedBits.toFixed(1)}.
		</p>

		{#if strength.warnings.length > 0}
			<ul class="text-muted-foreground list-disc space-y-1 pl-5 text-xs leading-5">
				{#each strength.warnings as warning}
					<li>{warning}</li>
				{/each}
			</ul>
		{/if}

		<p class="text-muted-foreground text-xs leading-5">
			The exact entered string is evaluated as-is. Changing spaces, case, or punctuation changes the
			commitment.
		</p>
	</div>
{/if}
