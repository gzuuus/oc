<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import SectionBlock from '$lib/components/SectionBlock.svelte';

	const capabilities = [
		{
			title: 'Prepare',
			description:
				'Check whether profile metadata, contact-list context, and surrounding corroboration are in place before a catastrophic event.'
		},
		{
			title: 'Preserve',
			description:
				'Snapshot replaceable kind 0 and kind 3 events so later evaluators can inspect the historical state that mattered at publication time.'
		},
		{
			title: 'Publish',
			description:
				'Create root and linked checkpoints with guided flows that keep lineage, embedded evidence, preserved context, and follow-up steps understandable.'
		},
		{
			title: 'Evaluate',
			description:
				'Inspect lineage, reactions, snapshots, and corroborating evidence while keeping conflicting evidence and uncertainty visible.'
		}
	];

	const principles = [
		'Evidence, not authority — the app helps people inspect claims, not accept canonical truth.',
		'Guided, not overwhelming — protocol detail is available without becoming the default reading mode.',
		'Safe defaults — stronger continuity practices should feel normal and easy to adopt.',
		'Honest uncertainty — confidence comes from visible factors, not opaque scoring.',
		'Conflict stays visible — competing successor claims and disputes are first-class cases.'
	];
</script>

<AppShell
	title="About Open Continuity"
	badge="product overview"
	intro="Open Continuity is a specialized Nostr client for preparing, preserving, publishing, and evaluating identity continuity evidence."
	actions={[
		{ href: '/create/checkpoint', label: 'Publish a checkpoint' },
		{ href: '/dashboard', label: 'Open dashboard', variant: 'secondary' }
	]}
>
	<SectionBlock
		title="Why it exists"
		description="Nostr identity is tied to a public key. When a key is lost, compromised, or abandoned, there is no central authority that can definitively declare its legitimate replacement."
	>
		<div class="grid gap-4 md:grid-cols-2">
			<div class="bg-card rounded-2xl border p-5 text-sm leading-7">
				<p>
					Open Continuity helps identity owners prepare stronger evidence before something goes
					wrong, and helps evaluators inspect continuity claims without being pushed toward false
					certainty.
				</p>
			</div>
			<div class="bg-card rounded-2xl border p-5 text-sm leading-7">
				<p>
					The product is built around checkpoints and snapshots: immutable records that preserve
					continuity claims and the surrounding state people may need later to judge them.
				</p>
			</div>
		</div>
	</SectionBlock>

	<SectionBlock
		title="Core capabilities"
		description="The app turns protocol events into an evidence workflow that is practical for normal users and useful for advanced investigators."
	>
		<div class="grid gap-4 md:grid-cols-2">
			{#each capabilities as capability}
				<div class="bg-card rounded-2xl border p-5">
					<h2 class="text-lg font-semibold">{capability.title}</h2>
					<p class="text-muted-foreground mt-2 text-sm leading-6">{capability.description}</p>
				</div>
			{/each}
		</div>
	</SectionBlock>

	<SectionBlock
		title="Product principles"
		description="These principles shape the design language, the publishing flows, and the way evidence is presented throughout the app."
	>
		<div class="bg-card rounded-2xl border p-5">
			<ul class="grid gap-3 text-sm leading-6">
				{#each principles as principle}
					<li class="rounded-xl border p-3">{principle}</li>
				{/each}
			</ul>
		</div>
	</SectionBlock>
</AppShell>
