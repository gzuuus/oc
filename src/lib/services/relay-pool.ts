import { dev } from '$app/environment';
import { RelayPool } from 'applesauce-relay';

export const isDevRelayOnly = dev;

// Create a single relay pool instance for the entire application
export const relayPool = new RelayPool();
relayPool.ignoreOffline = false;

export const devRelay = ['ws://localhost:10547'];

export const defaultRelays = isDevRelayOnly
	? devRelay
	: ['wss://relay.damus.io', 'wss://relay.nostr.net', 'wss://nos.lol', 'wss://nostr.mom'];

export const metadataRelays = isDevRelayOnly
	? devRelay
	: ['wss://purplepag.es/', 'wss://nos.lol', 'wss://relay.damus.io'];
