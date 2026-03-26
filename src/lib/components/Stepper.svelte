<script lang="ts">
	import type { Snippet } from 'svelte';

	type StepItem = {
		title: string;
		description?: string;
		disabled?: boolean;
	};

	let {
		steps,
		currentStep = 0,
		onStepSelect,
		children
	}: {
		steps: readonly StepItem[];
		currentStep?: number;
		onStepSelect?: (index: number) => void;
		children?: Snippet;
	} = $props();
</script>

<div class="space-y-6">
	<ol class="flex items-center justify-between gap-2">
		{#each steps as step, index}
			{@const isCurrent = index === currentStep}
			{@const isComplete = index < currentStep}
			<li>
				<button
					type="button"
					class={`inline-flex size-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
						step.disabled ? 'cursor-not-allowed opacity-50' : ''
					} ${
						isCurrent
							? 'border-foreground bg-foreground text-background'
							: isComplete
								? 'border-foreground/40 text-foreground'
								: 'border-border text-muted-foreground'
					}`}
					onclick={() => !step.disabled && onStepSelect?.(index)}
					aria-current={isCurrent ? 'step' : undefined}
					disabled={step.disabled}
					aria-label={step.title}
				>
					{index + 1}
				</button>
			</li>
		{/each}
	</ol>

	<div>
		{@render children?.()}
	</div>
</div>
