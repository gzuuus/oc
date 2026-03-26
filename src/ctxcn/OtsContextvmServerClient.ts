import { Client } from '@modelcontextprotocol/sdk/client';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
	NostrClientTransport,
	type NostrTransportOptions,
	PrivateKeySigner,
	ApplesauceRelayPool
} from '@contextvm/sdk';

export interface OtsEventInput {
	/**
	 * Raw event id, nevent, or naddr reference for the target Nostr event
	 */
	target: string;
	/**
	 * Additional relay URLs to merge into event resolution for the target
	 */
	relayUrls?: string[];
}

export interface OtsEventOutput {
	targetEventId: string;
	attestationEventId: string;
	/**
	 * Human-readable summary indicating whether the attestation was newly published or an existing one was reused
	 */
	message: string;
}

export interface VerifyOtsInput {
	/**
	 * Raw event id, nevent, or naddr reference for the target Nostr event
	 */
	target: string;
}

export interface VerifyOtsOutput {
	fileHash: string;
	bitcoinAttestations: number;
	pendingAttestations: number;
	attestationHeights: number[];
	targetEventId: string;
	digestMatches: boolean;
	bitcoinVerified: boolean;
	verificationMode: 'public-bitcoin-api';
	provider: string;
	blockHeight: number | null;
	blockHash: string | null;
	attestedTime: number | null;
	hasPendingAttestations: boolean;
	isPending: boolean;
	message: string;
}

export type OtsContextvmServer = {
	OtsEvent: (target: string, relayUrls?: string[]) => Promise<OtsEventOutput>;
	VerifyOts: (target: string) => Promise<VerifyOtsOutput>;
};

export class OtsContextvmServerClient implements OtsContextvmServer {
	static readonly SERVER_PUBKEY =
		'e1c1c32729cbd542c9b9ce7ee6e421c434e07835228020c4f57140782f02496a';
	static readonly DEFAULT_RELAYS = ['wss://relay.contextvm.org', 'wss://relay2.contextvm.org'];
	private client: Client;
	private transport: Transport;

	constructor(
		options: Partial<NostrTransportOptions> & { privateKey?: string; relays?: string[] } = {}
	) {
		this.client = new Client({
			name: 'OtsContextvmServerClient',
			version: '1.0.0'
		});

		// Private key precedence: constructor options > config file
		const resolvedPrivateKey = options.privateKey || '';

		// Use options.signer if provided, otherwise create from resolved private key
		const signer = options.signer || new PrivateKeySigner(resolvedPrivateKey);
		// Use options.relays if provided, otherwise use class DEFAULT_RELAYS
		const relays = options.relays || OtsContextvmServerClient.DEFAULT_RELAYS;
		// Use options.relayHandler if provided, otherwise create from relays
		const relayHandler = options.relayHandler || new ApplesauceRelayPool(relays);
		const serverPubkey = options.serverPubkey;
		const { privateKey: _, ...rest } = options;

		this.transport = new NostrClientTransport({
			serverPubkey: serverPubkey || OtsContextvmServerClient.SERVER_PUBKEY,
			signer,
			relayHandler,
			isStateless: true,
			...rest
		});

		// Auto-connect in constructor
		this.client.connect(this.transport).catch((error) => {
			console.error(`Failed to connect to server: ${error}`);
		});
	}

	async disconnect(): Promise<void> {
		await this.transport.close();
	}

	private async call<T = unknown>(name: string, args: Record<string, unknown>): Promise<T> {
		const result = await this.client.callTool({
			name,
			arguments: { ...args }
		});
		return result.structuredContent as T;
	}

	/**
	 * Accepts a Nostr event reference and synchronously publishes an OpenTimestamps-backed NIP-03 attestation, reusing an existing recorded attestation when available.
	 * @param {string} target Raw event id, nevent, or naddr reference for the target Nostr event
	 * @param {string[]} relayUrls [optional] Additional relay URLs to merge into event resolution for the target
	 * @returns {Promise<OtsEventOutput>} The result of the ots_event operation
	 */
	async OtsEvent(target: string, relayUrls?: string[]): Promise<OtsEventOutput> {
		return this.call('ots_event', { target, relayUrls });
	}

	/**
	 * Verifies an OpenTimestamps proof for a Nostr event.
	 * @param {string} target Raw event id, nevent, or naddr reference for the target Nostr event
	 * @returns {Promise<VerifyOtsOutput>} The result of the verify_ots operation
	 */
	async VerifyOts(target: string): Promise<VerifyOtsOutput> {
		return this.call('verify_ots', { target });
	}
}
