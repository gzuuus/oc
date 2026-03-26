import { createEventLoaderForStore } from 'applesauce-loaders/loaders';
import { Observable } from 'rxjs';
import { relayPool } from './relay-pool';
import { eventStore } from './eventStore';
import { defaultRelays, metadataRelays } from './relay-pool';
import { relayActions, relayStore } from '$lib/stores/relay-store.svelte';

const activeRelaySelection = new Observable<string[]>((subscriber) => {
	subscriber.next([...relayStore.selectedRelays]);

	const removeCallback = relayActions.onRelayChange((relays) => {
		subscriber.next([...relays]);
	});

	return () => {
		removeCallback();
	};
});

export const eventLoader = createEventLoaderForStore(eventStore, relayPool, {
	lookupRelays: metadataRelays,
	extraRelays: new Observable<string[]>((subscriber) => {
		const subscription = activeRelaySelection.subscribe((relays) => {
			subscriber.next([...new Set([...relays, ...defaultRelays])]);
		});

		return () => subscription.unsubscribe();
	})
});
