<script lang="ts">
	import { getMailboxLookupRelays, getUserReadRelaysFromMailboxes } from '$lib/services/oc.svelte';
	import { eventStore } from '$lib/services/eventStore';
	import { pubkeyToHexColor } from '$lib/utils';

	let {
		pubkey,
		size = 'sm',
		showNip05 = false,
		class: className = ''
	}: {
		pubkey: string;
		size?: 'sm' | 'md';
		showNip05?: boolean;
		class?: string;
	} = $props();

	const mailboxLookupRelays = $derived(getMailboxLookupRelays());
	const userMailboxes = $derived(eventStore.mailboxes({ pubkey, relays: mailboxLookupRelays }));
	const readRelays = $derived(getUserReadRelaysFromMailboxes($userMailboxes));
	const profile = $derived(eventStore.profile({ pubkey, relays: readRelays }));
	const displayName = $derived(
		$profile?.display_name || $profile?.name || `${pubkey.slice(0, 12)}…`
	);
	const secondaryLabel = $derived.by(() => {
		if (showNip05 && $profile?.nip05) return $profile.nip05;
		return `${pubkey.slice(0, 12)}…${pubkey.slice(-8)}`;
	});
	const avatarSize = $derived(size === 'md' ? 'h-10 w-10' : 'h-8 w-8');
	const nameSize = $derived(size === 'md' ? 'text-sm' : 'text-xs');
</script>

{#if $profile?.picture}
	<div class={`flex items-center gap-2 ${className}`}>
		<img
			src={$profile.picture}
			alt={displayName}
			class={`${avatarSize} rounded-full object-cover`}
		/>
		<div class="min-w-0">
			<p class={`truncate font-medium ${nameSize}`}>{displayName}</p>
			<p class="text-muted-foreground truncate text-xs">{secondaryLabel}</p>
		</div>
	</div>
{:else}
	<div class={`flex items-center gap-2 ${className}`}>
		<div
			class={`${avatarSize} rounded-full`}
			style={`background-color: ${pubkeyToHexColor(pubkey)}`}
		></div>
		<div class="min-w-0">
			<p class={`truncate font-medium ${nameSize}`}>{displayName}</p>
			<p class="text-muted-foreground truncate text-xs">{secondaryLabel}</p>
		</div>
	</div>
{/if}
