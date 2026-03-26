<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import {
		badgeClass,
		proofCardClass,
		shortKey,
		type BadgeTone
	} from '$lib/components/checkpoint-detail/helpers';

	type ProofBadge = { label: string; tone: BadgeTone };
	type SnapshotCard = {
		id: string;
		title: string;
		summary: string;
		isValid: boolean;
	};
	type OtsProof = {
		id: string;
		hasBitcoinAttestation: boolean;
		contentSize: number;
		blockHeight: number | null;
	};
	type OtsActionState = 'idle' | 'publishing' | 'success' | 'error';
	type SecretProof = {
		currentCommitment: string | null;
		currentReveal: string | null;
		previousCommitment: string | null;
		previousReveal: string | null;
		linkedMatch: boolean | null;
		hasLinkedComparison: boolean;
		badges: ProofBadge[];
	};

	let {
		summary,
		otsProofs = [],
		secretProof,
		socialSnapshots = [],
		nip05Snapshots = [],
		previousCheckpointLoaded,
		hasCheckpoint,
		otsPublishState = 'idle',
		otsPublishMessage = '',
		otsAttestationLink = '',
		onPublishOts
	}: {
		summary: {
			parentId: string | null;
			rootId?: string | null;
			isRoot?: boolean;
		};
		otsProofs?: OtsProof[];
		secretProof: SecretProof;
		socialSnapshots?: SnapshotCard[];
		nip05Snapshots?: SnapshotCard[];
		previousCheckpointLoaded: boolean;
		hasCheckpoint: boolean;
		otsPublishState?: OtsActionState;
		otsPublishMessage?: string;
		otsAttestationLink?: string;
		onPublishOts?: () => void;
	} = $props();

	const hasSecretData = $derived(
		Boolean(secretProof.currentCommitment || secretProof.currentReveal || summary.parentId)
	);
	const hasVerificationDetails = $derived(
		hasSecretData || nip05Snapshots.length > 0 || otsProofs.length > 0 || socialSnapshots.length > 0
	);
</script>

{#if hasVerificationDetails}
	<div class="bg-card rounded-xl border p-5">
		<div class="flex items-center justify-between gap-3">
			<div>
				<h3 class="font-medium">Verification details</h3>
				<p class="text-muted-foreground mt-2 text-xs">
					Extra technical context for this checkpoint. Social interpretation stays in reactions.
				</p>
			</div>
			<span class="text-muted-foreground text-sm">
				{summary.isRoot ? 'root' : 'linked'}
				{#if otsProofs.length > 0}
					· {otsProofs.length} OTS{/if}
			</span>
		</div>

		<div class="mt-4 space-y-3">
			{#if hasSecretData}
				<Collapsible.Root open={secretProof.linkedMatch === false}>
					<div
						class={proofCardClass(
							secretProof.linkedMatch === true
								? 'verified'
								: summary.parentId
									? 'pending'
									: 'missing'
						)}
					>
						<Collapsible.Trigger
							class="group flex w-full items-start justify-between gap-3 text-left"
						>
							<div class="flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="font-medium">Secret continuity</span>
									{#if secretProof.linkedMatch === true}
										<span class={badgeClass('green')}>✓ Matches linked</span>
									{:else if secretProof.linkedMatch === false}
										<span class={badgeClass('red')}>✗ Does not match</span>
									{:else if summary.parentId && !secretProof.hasLinkedComparison}
										<span class="text-muted-foreground text-xs">No earlier commitment</span>
									{:else if summary.parentId}
										<span class="text-muted-foreground text-xs">Waiting for comparison</span>
									{/if}
								</div>
								<p class="text-muted-foreground mt-2 text-xs">
									Understand whether this checkpoint starts a secret trail, continues one, or has
									nothing to compare yet.
								</p>
							</div>
							<ChevronDown
								class="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
							/>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<div class="mt-4 space-y-3 text-sm">
								<div class="grid gap-3 md:grid-cols-2">
									<div class="rounded-lg border p-3">
										<p class="text-muted-foreground text-xs">Current checkpoint</p>
										<div class="mt-2 space-y-2">
											<div>
												<p class="text-muted-foreground text-[11px] tracking-wide uppercase">
													Commitment
												</p>
												{#if secretProof.currentCommitment}
													<code class="bg-muted mt-1 inline-flex rounded px-1.5 py-0.5 text-xs"
														>{shortKey(secretProof.currentCommitment)}</code
													>
												{:else}
													<p class="text-muted-foreground mt-1 text-xs">No commitment declared.</p>
												{/if}
											</div>
											<div>
												<p class="text-muted-foreground text-[11px] tracking-wide uppercase">
													Reveal
												</p>
												{#if secretProof.currentReveal}
													<code class="bg-muted mt-1 inline-flex rounded px-1.5 py-0.5 text-xs"
														>{shortKey(secretProof.currentReveal)}</code
													>
												{:else}
													<p class="text-muted-foreground mt-1 text-xs">No reveal declared.</p>
												{/if}
											</div>
										</div>
									</div>

									<div class="rounded-lg border p-3">
										<p class="text-muted-foreground text-xs">Linked checkpoint</p>
										{#if summary.parentId && previousCheckpointLoaded}
											<div class="mt-2 space-y-2">
												<div>
													<p class="text-muted-foreground text-[11px] tracking-wide uppercase">
														Commitment
													</p>
													{#if secretProof.previousCommitment}
														<code class="bg-muted mt-1 inline-flex rounded px-1.5 py-0.5 text-xs"
															>{shortKey(secretProof.previousCommitment)}</code
														>
													{:else}
														<p class="text-muted-foreground mt-1 text-xs">No commitment found.</p>
													{/if}
												</div>
												<div>
													<p class="text-muted-foreground text-[11px] tracking-wide uppercase">
														Reveal
													</p>
													{#if secretProof.previousReveal}
														<code class="bg-muted mt-1 inline-flex rounded px-1.5 py-0.5 text-xs"
															>{shortKey(secretProof.previousReveal)}</code
														>
													{:else}
														<p class="text-muted-foreground mt-1 text-xs">No reveal found.</p>
													{/if}
												</div>
											</div>
										{:else if summary.parentId}
											<p class="text-muted-foreground mt-2 text-xs">
												Loading linked checkpoint for comparison…
											</p>
										{:else}
											<p class="text-muted-foreground mt-2 text-xs">
												This is a root checkpoint, so there is no earlier secret to compare.
											</p>
										{/if}
									</div>
								</div>

								{#if summary.parentId}
									<div class="rounded-lg border p-3 text-xs">
										<p class="font-medium">Secret continuity check</p>
										{#if secretProof.linkedMatch === true}
											<p class="mt-1 text-green-600 dark:text-green-400">
												✓ SHA256(current reveal) matches the linked checkpoint commitment.
											</p>
										{:else if secretProof.linkedMatch === false}
											<p class="mt-1 text-red-600 dark:text-red-400">
												✗ SHA256(current reveal) does not match the linked checkpoint commitment.
											</p>
										{:else if !secretProof.hasLinkedComparison}
											<p class="text-muted-foreground mt-1">
												The earlier linked checkpoint does not include a secret commitment, so a
												reveal comparison is not applicable here.
											</p>
										{:else}
											<p class="text-muted-foreground mt-1">
												Waiting for enough linked checkpoint data to compare the reveal against the
												earlier commitment.
											</p>
										{/if}
									</div>
								{/if}
							</div>
						</Collapsible.Content>
					</div>
				</Collapsible.Root>
			{/if}

			{#if socialSnapshots.length > 0}
				<Collapsible.Root>
					<div class={proofCardClass('verified')}>
						<Collapsible.Trigger
							class="group flex w-full items-start justify-between gap-3 text-left"
						>
							<div class="flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="font-medium">Archived contact snapshots</span>
									<span class={badgeClass('green')}>{socialSnapshots.length} snapshot(s)</span>
								</div>
								<p class="text-muted-foreground mt-2 text-xs">
									Contact-list snapshots can help preserve surrounding social context without
									repeating the reactions section.
								</p>
							</div>
							<ChevronDown
								class="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
							/>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<div class="mt-4 space-y-2">
								{#each socialSnapshots.slice(0, 2) as snapshot}
									<a
										href="/evidence/{snapshot.id}"
										class="hover:bg-accent/20 block rounded-lg border p-2 text-sm transition-colors"
									>
										<div class="flex items-center justify-between gap-2">
											<span>{snapshot.title}</span>
											<span class="rounded-full border px-2 py-0.5 text-[10px] uppercase"
												>{snapshot.isValid ? 'usable' : 'review'}</span
											>
										</div>
										<p class="text-muted-foreground mt-1 truncate text-xs">{snapshot.summary}</p>
									</a>
								{/each}
							</div>
						</Collapsible.Content>
					</div>
				</Collapsible.Root>
			{/if}

			<Collapsible.Root open={nip05Snapshots.length === 0}>
				<div class={proofCardClass(nip05Snapshots.length > 0 ? 'verified' : 'pending')}>
					<Collapsible.Trigger
						class="group flex w-full items-start justify-between gap-3 text-left"
					>
						<div class="flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-medium">Metadata / NIP-05</span>
								{#if nip05Snapshots.length > 0}
									<span class={badgeClass('green')}>{nip05Snapshots.length} snapshot(s)</span>
								{:else}
									<span class="text-muted-foreground text-xs">No snapshots found</span>
								{/if}
							</div>
							<p class="text-muted-foreground mt-2 text-xs">
								Inspect archived metadata when you want extra profile or NIP-05 context.
							</p>
						</div>
						<ChevronDown
							class="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="mt-4 space-y-2">
							{#if nip05Snapshots.length > 0}
								{#each nip05Snapshots.slice(0, 2) as snapshot}
									<a
										href="/evidence/{snapshot.id}"
										class="hover:bg-accent/20 block rounded-lg border p-2 text-sm transition-colors"
									>
										<div class="flex items-center justify-between gap-2">
											<span>{snapshot.title}</span>
											<span class="rounded-full border px-2 py-0.5 text-[10px] uppercase"
												>{snapshot.isValid ? 'usable' : 'review'}</span
											>
										</div>
										<p class="text-muted-foreground mt-1 truncate text-xs">{snapshot.summary}</p>
									</a>
								{/each}
							{:else}
								<p class="text-muted-foreground text-xs">
									No archived metadata snapshot is attached to this checkpoint yet.
								</p>
							{/if}
						</div>
					</Collapsible.Content>
				</div>
			</Collapsible.Root>

			<Collapsible.Root open={otsProofs.length === 0}>
				<div class={proofCardClass(otsProofs.length > 0 ? 'verified' : 'pending')}>
					<Collapsible.Trigger
						class="group flex w-full items-start justify-between gap-3 text-left"
					>
						<div class="flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-medium">OpenTimestamps attestations</span>
								{#if otsProofs.length > 0}
									<span class={badgeClass('green')}>{otsProofs.length}</span>
								{:else}
									<span class="text-muted-foreground text-xs">No OTS yet</span>
								{/if}
							</div>
							<p class="text-muted-foreground mt-2 text-xs">
								Cryptographic timestamp evidence for when this checkpoint existed.
							</p>
						</div>
						<ChevronDown
							class="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="mt-4 space-y-2">
							{#if otsProofs.length > 0}
								{#each otsProofs as proof}
									<a
										href="/evidence/{proof.id}"
										class="hover:bg-accent/20 block rounded-lg border p-2 text-sm transition-colors"
									>
										<div class="flex items-center justify-between gap-2">
											<span>OTS attestation</span>
											{#if proof.hasBitcoinAttestation}
												<span class={badgeClass('green')}>Verified</span>
											{:else}
												<span class="text-muted-foreground text-xs">Pending</span>
											{/if}
										</div>
										<div class="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-xs">
											<span>{proof.contentSize} bytes</span>
											{#if proof.blockHeight}
												<span>Block #{proof.blockHeight}</span>
											{/if}
										</div>
									</a>
								{/each}
							{:else}
								<div class="rounded-lg border p-3 text-xs">
									<div class="flex items-start gap-3">
										<ShieldCheck class="text-muted-foreground mt-0.5 size-4 shrink-0" />
										<div class="min-w-0 flex-1">
											<p class="font-medium">Request OTS for this checkpoint</p>
											<p class="text-muted-foreground mt-1 leading-6">
												Create an OpenTimestamps attestation for the checkpoint event itself so
												people can inspect an external timestamp proof here.
											</p>
											<button
												type="button"
												class="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
												onclick={() => onPublishOts?.()}
												disabled={!hasCheckpoint ||
													!onPublishOts ||
													otsPublishState === 'publishing'}
											>
												{otsPublishState === 'publishing'
													? 'Requesting…'
													: 'Request checkpoint OTS'}
											</button>
											{#if otsAttestationLink}
												<a
													class="ml-2 inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
													href={otsAttestationLink}
												>
													Open OTS proof
												</a>
											{/if}
											{#if otsPublishMessage}
												<p
													class={`mt-2 ${otsPublishState === 'error' ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}
												>
													{otsPublishMessage}
												</p>
											{/if}
										</div>
									</div>
								</div>
							{/if}
						</div>
					</Collapsible.Content>
				</div>
			</Collapsible.Root>
		</div>
	</div>
{/if}
