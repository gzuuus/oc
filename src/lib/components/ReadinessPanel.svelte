<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import FileArchive from '@lucide/svelte/icons/file-archive';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';

	type Item = {
		label: string;
		status: 'ready' | 'recommended' | 'attention';
		detail: string;
		previewTitle?: string;
		previewContent?: string;
		kind?: number;
		hasSnapshot?: boolean;
		hasOts?: boolean;
		snapshotDetail?: string;
		otsDetail?: string;
	};
	type ActionState = 'idle' | 'publishing' | 'success' | 'error';

	let {
		items,
		title = 'Identity readiness',
		onPublishSnapshot,
		onPublishOts,
		snapshotState = {},
		snapshotMessages = {},
		otsState = {},
		otsMessages = {},
		snapshotLinks = {},
		otsLinks = {}
	}: {
		items: Item[];
		title?: string;
		onPublishSnapshot?: (kind: number) => void;
		onPublishOts?: (kind: number) => void;
		snapshotState?: Record<number, ActionState>;
		snapshotMessages?: Record<number, string>;
		otsState?: Record<number, ActionState>;
		otsMessages?: Record<number, string>;
		snapshotLinks?: Record<number, string>;
		otsLinks?: Record<number, string>;
	} = $props();

	const statusClasses: Record<Item['status'], string> = {
		ready: 'bg-green-500/12 text-green-700 dark:text-green-300',
		recommended: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
		attention: 'bg-red-500/12 text-red-700 dark:text-red-300'
	};

	function getSnapshotLabel(kind: number) {
		return kind === 3 ? 'Create kind 3 snapshot' : 'Create kind 0 snapshot';
	}

	function getOtsLabel(kind: number) {
		return kind === 3 ? 'Request kind 3 OTS' : 'Request kind 0 OTS';
	}
</script>

<section class="bg-card rounded-2xl border p-5">
	<div class="space-y-1">
		<h2 class="text-lg font-semibold">{title}</h2>
		<p class="text-muted-foreground text-sm">
			Review evidence before publishing or evaluating continuity claims.
		</p>
	</div>

	<div class="mt-4 space-y-3">
		{#each items as item}
			{#if item.previewContent}
				<Collapsible.Root>
					<div class="rounded-xl border p-4">
						<Collapsible.Trigger
							class="group flex w-full items-start justify-between gap-3 text-left"
						>
							<div class="space-y-2">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-medium">{item.label}</p>
									<span
										class={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[item.status]}`}
									>
										{item.status}
									</span>
								</div>
								<p class="text-muted-foreground text-sm leading-6">{item.detail}</p>
								<p class="text-muted-foreground text-xs">
									{item.previewTitle ?? 'Event preview'}
								</p>
							</div>
							<ChevronDown
								class="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
							/>
						</Collapsible.Trigger>
						<Collapsible.Content>
							{#if typeof item.kind === 'number'}
								<div class="mt-3 grid gap-3 md:grid-cols-2">
									<div class="rounded-xl border p-3">
										<div class="flex items-start gap-3">
											<FileArchive class="text-muted-foreground mt-0.5 size-4 shrink-0" />
											<div class="min-w-0 flex-1">
												<p class="text-sm font-medium">Snapshot preservation</p>
												<p class="text-muted-foreground mt-1 text-xs leading-6">
													{item.snapshotDetail}
												</p>
												{#if !item.hasSnapshot}
													<button
														type="button"
														class="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
														onclick={() => onPublishSnapshot?.(item.kind!)}
														disabled={!onPublishSnapshot ||
															snapshotState[item.kind] === 'publishing'}
													>
														{snapshotState[item.kind] === 'publishing'
															? 'Publishing…'
															: getSnapshotLabel(item.kind)}
													</button>
												{:else if snapshotLinks[item.kind]}
													<a
														class="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
														href={snapshotLinks[item.kind]}
													>
														Open snapshot
													</a>
												{/if}
												{#if snapshotMessages[item.kind]}
													<p
														class={`mt-2 text-xs ${snapshotState[item.kind] === 'error' ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}
													>
														{snapshotMessages[item.kind]}
													</p>
												{/if}
											</div>
										</div>
									</div>
									<div class="rounded-xl border p-3">
										<div class="flex items-start gap-3">
											<ShieldCheck class="text-muted-foreground mt-0.5 size-4 shrink-0" />
											<div class="min-w-0 flex-1">
												<p class="text-sm font-medium">OpenTimestamps</p>
												<p class="text-muted-foreground mt-1 text-xs leading-6">{item.otsDetail}</p>
												{#if !item.hasOts}
													<button
														type="button"
														class="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
														onclick={() => onPublishOts?.(item.kind!)}
														disabled={!onPublishOts || otsState[item.kind] === 'publishing'}
													>
														{otsState[item.kind] === 'publishing'
															? 'Requesting…'
															: getOtsLabel(item.kind)}
													</button>
												{:else if otsLinks[item.kind]}
													<a
														class="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
														href={otsLinks[item.kind]}
													>
														Open OTS proof
													</a>
												{/if}
												{#if otsMessages[item.kind]}
													<p
														class={`mt-2 text-xs ${otsState[item.kind] === 'error' ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}
													>
														{otsMessages[item.kind]}
													</p>
												{/if}
											</div>
										</div>
									</div>
								</div>
							{/if}
							<pre
								class="bg-muted/40 mt-3 overflow-x-auto rounded-lg p-3 text-xs leading-6 break-all whitespace-pre-wrap">{item.previewContent}</pre>
						</Collapsible.Content>
					</div>
				</Collapsible.Root>
			{:else}
				<div
					class="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between"
				>
					<div>
						<p class="font-medium">{item.label}</p>
						<p class="text-muted-foreground text-sm leading-6">{item.detail}</p>
					</div>
					<span
						class={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[item.status]}`}
					>
						{item.status}
					</span>
				</div>
			{/if}
		{/each}
	</div>
</section>
