<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import InfoCard from '$lib/components/InfoCard.svelte';
	import SectionBlock from '$lib/components/SectionBlock.svelte';
	import { kinds } from 'nostr-tools';
	import { getOutboxes } from 'applesauce-core/helpers';
	import { activeAccount } from '$lib/services/accountManager.svelte';
	import { eventStore } from '$lib/services/eventStore';
	import { getMailboxLookupRelays } from '$lib/services/oc.svelte';
	import { relayStore } from '$lib/stores/relay-store.svelte';
	import { settingsSections } from '$lib/data/app';

	const pubkey = $derived($activeAccount?.pubkey);
	const mailboxLookupRelays = $derived(getMailboxLookupRelays());
	const relayListEvent = $derived(
		pubkey
			? eventStore.replaceable({ kind: kinds.RelayList, pubkey, relays: mailboxLookupRelays })
			: null
	);
	const outboxRelays = $derived($relayListEvent ? getOutboxes($relayListEvent) : []);
</script>

<AppShell
	title="Settings"
	badge="application controls"
	intro="Review which relays the app uses and which outbox relays your identity advertises."
	actions={[
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/create/checkpoint', label: 'Publish checkpoint', variant: 'secondary' }
	]}
>
	<SectionBlock
		title="Current relay set"
		description="These relays affect what the app can discover and where it can publish."
	>
		<div class="bg-card rounded-2xl border p-5">
			{#if relayStore.selectedRelays.length > 0}
				<ul class="space-y-2 text-sm">
					{#each relayStore.selectedRelays as relay}
						<li class="font-mono">{relay}</li>
					{/each}
				</ul>
			{:else}
				<p class="text-muted-foreground text-sm">
					No relays are currently selected for discovery or publication.
				</p>
			{/if}
		</div>
	</SectionBlock>

	<SectionBlock
		title="Connected identity"
		description="Use this public key when you need to verify which account is currently active in the app."
	>
		<div class="bg-card rounded-2xl border p-5">
			{#if pubkey}
				<div class="space-y-2">
					<p class="text-sm font-medium">Public key</p>
					<p class="font-mono text-sm break-all">{pubkey}</p>
				</div>
			{:else}
				<p class="text-muted-foreground text-sm">
					Connect an identity to see the active public key here.
				</p>
			{/if}
		</div>
	</SectionBlock>

	<SectionBlock
		title="User outbox relays"
		description="These relays come from the connected account relay list and help fetch current profile and contact-list state."
	>
		<div class="bg-card rounded-2xl border p-5">
			{#if !pubkey}
				<p class="text-muted-foreground text-sm">
					Connect an identity to load the outbox relays it advertises.
				</p>
			{:else if outboxRelays.length > 0}
				<ul class="space-y-2 text-sm">
					{#each outboxRelays as relay}
						<li class="font-mono">{relay}</li>
					{/each}
				</ul>
			{:else}
				<p class="text-muted-foreground text-sm">
					No outbox relays have been discovered yet for the connected identity on the current relay
					view.
				</p>
			{/if}
		</div>
	</SectionBlock>
</AppShell>
