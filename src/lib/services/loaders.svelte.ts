import { createAddressLoader } from 'applesauce-loaders/loaders';
import { relayPool } from './relay-pool';
import { eventStore } from './eventStore';
import { relayStore } from '../stores/relay-store.svelte';
import { kinds } from 'nostr-tools';

// Create address loader
export const addressLoader = createAddressLoader(relayPool, { eventStore });

export const createRelayListByPubkeyLoader = (pubkey: string, relays?: string[]) => {
	const selectedRelays = relays || relayStore.selectedRelays;
	return addressLoader({
		pubkey,
		kind: kinds.RelayList,
		relays: selectedRelays
	});
};
