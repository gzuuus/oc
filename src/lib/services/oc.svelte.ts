import { bytesToHex } from '@noble/hashes/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { kinds, type NostrEvent } from 'nostr-tools';
import { relayStore } from '$lib/stores/relay-store.svelte';
import {
	OtsContextvmServerClient,
	type OtsEventOutput
} from '../../ctxcn/OtsContextvmServerClient';
import { activeAccount } from './accountManager.svelte';
import { eventStore } from './eventStore';
import './eventLoader';
import { OC_CHECKPOINT_KIND, OC_SNAPSHOT_KIND, OTS_ATTESTATION_KIND } from '$lib/constants/oc';
import { devRelay, isDevRelayOnly, metadataRelays, relayPool } from './relay-pool';
import { getInboxes, getOutboxes } from 'applesauce-core/helpers';

export type IdentityReadiness = {
	isLoggedIn: boolean;
	hasMetadata: boolean;
	hasContacts: boolean;
	canPublish: boolean;
	pubkey?: string;
	metadataEvent?: NostrEvent;
	contactsEvent?: NostrEvent;
};

export type CheckpointDraftInput = {
	content?: string;
	parentId?: string;
	rootId?: string;
	commitment?: string;
	reveal?: string;
	relays?: string[];
};

export type IdentityEvidenceState = IdentityReadiness & {
	isMetadataLoading: boolean;
	isContactsLoading: boolean;
};

export type PublishCheckpointResult = {
	event: NostrEvent;
	relays: string[];
};

export type PublishSnapshotResult = PublishCheckpointResult;

export type PublishOtsResult = OtsEventOutput & {
	relays: string[];
};

export type SnapshotDraftInput = {
	archivedEvent: NostrEvent;
	relays?: string[];
};

export type SnapshotSummary = {
	id: string;
	archivedEventId: string;
	archivedKind?: number;
	createdAt: number;
	pubkey: string;
	archivedEvent?: NostrEvent;
	isValid: boolean;
	validationMessage: string;
	title: string;
	summary: string;
};

type UserMailboxes = { inboxes: string[]; outboxes: string[] } | undefined;

function dedupeRelays(relays: (string | null | undefined)[]) {
	return Array.from(
		new Set(relays.filter((relay): relay is string => !!relay?.trim()).map((relay) => relay.trim()))
	);
}

export function getUserMailboxes(pubkey?: string): UserMailboxes {
	if (isDevRelayOnly) {
		return {
			inboxes: [...devRelay],
			outboxes: [...devRelay]
		};
	}

	if (!pubkey) return undefined;
	const relayList = eventStore.getReplaceable(kinds.RelayList, pubkey);
	if (!relayList) return undefined;

	return {
		inboxes: getInboxes(relayList),
		outboxes: getOutboxes(relayList)
	};
}

export function getMailboxLookupRelays(relays?: string[]) {
	if (isDevRelayOnly) return [...devRelay];
	return dedupeRelays([...(relays ?? relayStore.selectedRelays), ...metadataRelays]);
}

export function getUserOutboxRelays(pubkey?: string) {
	return getUserMailboxes(pubkey)?.outboxes ?? [];
}

export function getMergedRelays(relays?: string[]) {
	if (isDevRelayOnly) return [...devRelay];
	return dedupeRelays(relays ?? relayStore.selectedRelays);
}

export function getUserReadRelays(pubkey?: string, relays?: string[]) {
	return getEffectiveUserRelays(pubkey, relays);
}

export function getUserReadRelaysFromMailboxes(mailboxes?: UserMailboxes, relays?: string[]) {
	if (isDevRelayOnly) return [...devRelay];
	return dedupeRelays([...(relays ?? relayStore.selectedRelays), ...(mailboxes?.outboxes ?? [])]);
}

export function getEffectiveUserRelays(pubkey?: string, relays?: string[]) {
	if (isDevRelayOnly) return [...devRelay];
	return dedupeRelays([...getMergedRelays(relays), ...getUserOutboxRelays(pubkey)]);
}

export function watchPublishedSnapshots(pubkey?: string, relays?: string[]) {
	if (!pubkey) return () => {};

	const effectiveRelays = getEffectiveUserRelays(pubkey, relays);
	const filters = { kinds: [OC_SNAPSHOT_KIND], authors: [pubkey] };
	const timelineSub = eventStore.timeline(filters).subscribe();

	const relaySubscription = relayPool
		.subscription(effectiveRelays, [filters])
		.subscribe((event) => {
			if (typeof event !== 'string' && !eventStore.getEvent(event.id)) {
				eventStore.add(event);
			}
		});

	return () => {
		timelineSub.unsubscribe();
		relaySubscription.unsubscribe();
	};
}

export function ensureEvent(id: string, relays?: string[]) {
	const normalizedId = id.trim();
	if (!normalizedId || eventStore.getEvent(normalizedId)) return null;

	return eventStore.event({ id: normalizedId, relays: getMergedRelays(relays) }).subscribe();
}

export function watchOtsProofs(eventId: string, pubkey?: string, relays?: string[]) {
	const normalizedId = eventId.trim();
	if (!normalizedId) return () => {};

	const effectiveRelays = pubkey ? getEffectiveUserRelays(pubkey, relays) : getMergedRelays(relays);
	const filters = { kinds: [OTS_ATTESTATION_KIND], '#e': [normalizedId] };
	const timelineSub = eventStore.timeline(filters).subscribe();

	const relaySubscription = relayPool
		.subscription(effectiveRelays, [filters])
		.subscribe((event) => {
			if (typeof event !== 'string' && !eventStore.getEvent(event.id)) {
				eventStore.add(event);
			}
		});

	return () => {
		timelineSub.unsubscribe();
		relaySubscription.unsubscribe();
	};
}

export function watchCheckpointTimeline(pubkey?: string, relays?: string[]) {
	const effectiveRelays = pubkey ? getEffectiveUserRelays(pubkey, relays) : getMergedRelays(relays);
	const filters = pubkey
		? { kinds: [OC_CHECKPOINT_KIND], authors: [pubkey] }
		: { kinds: [OC_CHECKPOINT_KIND] };

	const timelineSub = eventStore.timeline(filters).subscribe();

	const relaySubscription = relayPool
		.subscription(effectiveRelays, [filters])
		.subscribe((event) => {
			if (typeof event !== 'string' && !eventStore.getEvent(event.id)) {
				eventStore.add(event);
			}
		});

	return () => {
		timelineSub.unsubscribe();
		relaySubscription.unsubscribe();
	};
}

export function createSecretCommitment(secret: string) {
	return bytesToHex(sha256(new TextEncoder().encode(secret)));
}

export function getIdentityReadiness(
	account: { pubkey: string; signer?: unknown } | null | undefined = activeAccount.value
): IdentityReadiness {
	if (!account) {
		return {
			isLoggedIn: false,
			hasMetadata: false,
			hasContacts: false,
			canPublish: false
		};
	}

	const metadataEvent = eventStore.getReplaceable(kinds.Metadata, account.pubkey);
	const contactsEvent = eventStore.getReplaceable(kinds.Contacts, account.pubkey);

	return {
		isLoggedIn: true,
		pubkey: account.pubkey,
		hasMetadata: !!metadataEvent,
		hasContacts: !!contactsEvent,
		canPublish: !!account.signer,
		metadataEvent,
		contactsEvent
	};
}

export function getIdentityEvidenceState(
	account: { pubkey: string; signer?: unknown } | null | undefined = activeAccount.value
): IdentityEvidenceState {
	const readiness = getIdentityReadiness(account);
	const hasRelaySelection = relayStore.selectedRelays.length > 0;

	if (!account) {
		return {
			...readiness,
			isMetadataLoading: false,
			isContactsLoading: false
		};
	}

	return {
		...readiness,
		isMetadataLoading: hasRelaySelection && !readiness.hasMetadata,
		isContactsLoading: hasRelaySelection && !readiness.hasContacts
	};
}

export function getRecentCheckpoints(pubkey?: string) {
	const filters = pubkey
		? { kinds: [OC_CHECKPOINT_KIND], authors: [pubkey] }
		: { kinds: [OC_CHECKPOINT_KIND] };

	return eventStore.getByFilters(filters).sort((a, b) => b.created_at - a.created_at);
}

export function buildCheckpointDraft(input: CheckpointDraftInput) {
	const account = activeAccount.value;
	if (!account) {
		throw new Error('You must log in before creating a checkpoint.');
	}

	const content = input.content?.trim() ?? '';
	const parentId = input.parentId?.trim() ?? '';
	const rootId = input.rootId?.trim() ?? '';

	const tags: string[][] = [];

	if (parentId) {
		tags.push(['e', parentId]);
	}

	if (rootId) {
		tags.push(['E', rootId]);
	} else if (parentId) {
		throw new Error('Linked checkpoints require a root checkpoint id.');
	} else {
		tags.push(['t', 'root']);
	}

	if (input.commitment?.trim()) {
		tags.push(['commit', 'sha256', input.commitment.trim()]);
	}

	if (input.reveal?.trim()) {
		tags.push(['reveal', input.reveal.trim()]);
	}

	tags.push(['alt', 'Identity continuity checkpoint']);

	return {
		kind: OC_CHECKPOINT_KIND,
		created_at: Math.floor(Date.now() / 1000),
		content,
		tags,
		pubkey: account.pubkey
	};
}

export function buildSnapshotDraft(input: SnapshotDraftInput) {
	const account = activeAccount.value;
	if (!account) {
		throw new Error('You must log in before creating a snapshot.');
	}

	const archivedEvent = input.archivedEvent;

	return {
		kind: OC_SNAPSHOT_KIND,
		created_at: Math.floor(Date.now() / 1000),
		content: JSON.stringify(archivedEvent),
		tags: [
			['e', archivedEvent.id],
			['k', String(archivedEvent.kind)],
			['alt', `Snapshot of replaceable event kind ${archivedEvent.kind}`]
		],
		pubkey: account.pubkey
	};
}

export function parseSnapshotEvent(event: NostrEvent): SnapshotSummary {
	const archivedEventId = event.tags.find((tag) => tag[0] === 'e')?.[1] ?? '';
	const archivedKindValue = event.tags.find((tag) => tag[0] === 'k')?.[1];
	const archivedKind = archivedKindValue ? Number(archivedKindValue) : undefined;

	try {
		const archivedEvent = JSON.parse(event.content) as NostrEvent;
		const isKindValid = typeof archivedKind === 'number' && Number.isFinite(archivedKind);
		const isConsistent =
			!!archivedEvent &&
			typeof archivedEvent.id === 'string' &&
			archivedEvent.id === archivedEventId &&
			(!isKindValid || archivedEvent.kind === archivedKind);

		const title =
			archivedEvent.kind === kinds.Metadata
				? 'Profile metadata snapshot'
				: archivedEvent.kind === kinds.Contacts
					? 'Contact list snapshot'
					: `Kind ${archivedEvent.kind} snapshot`;

		const summary =
			archivedEvent.kind === kinds.Metadata
				? summarizeMetadataContent(archivedEvent)
				: archivedEvent.kind === kinds.Contacts
					? summarizeContactsContent(archivedEvent)
					: 'Archived replaceable event preserved for later inspection.';

		return {
			id: event.id,
			archivedEventId,
			archivedKind,
			createdAt: event.created_at,
			pubkey: event.pubkey,
			archivedEvent,
			isValid: isConsistent,
			validationMessage: isConsistent
				? 'Embedded event matches the snapshot references.'
				: 'Embedded event content does not match the referenced event id or kind.',
			title,
			summary
		};
	} catch {
		return {
			id: event.id,
			archivedEventId,
			archivedKind,
			createdAt: event.created_at,
			pubkey: event.pubkey,
			isValid: false,
			validationMessage: 'Snapshot content is not valid archived event JSON.',
			title:
				archivedKind === kinds.Metadata
					? 'Profile metadata snapshot'
					: archivedKind === kinds.Contacts
						? 'Contact list snapshot'
						: 'Snapshot',
			summary: 'The preserved content could not be parsed locally.'
		};
	}
}

function summarizeMetadataContent(event: NostrEvent) {
	try {
		const parsed = JSON.parse(event.content || '{}') as Record<string, string | undefined>;
		const parts = [parsed.name, parsed.display_name, parsed.nip05].filter(Boolean);
		return parts.length > 0
			? parts.join(' · ')
			: 'No display fields found in the archived metadata content.';
	} catch {
		return 'Archived metadata content is not parseable JSON.';
	}
}

function summarizeContactsContent(event: NostrEvent) {
	const followedPubkeys = event.tags.filter((tag: string[]) => tag[0] === 'p').length;
	const relayHints = event.tags.filter((tag: string[]) => tag[0] === 'relay').length;
	return `${followedPubkeys} followed pubkeys · ${relayHints} relay hints`;
}

export async function publishCheckpoint(
	input: CheckpointDraftInput
): Promise<PublishCheckpointResult> {
	const account = activeAccount.value;
	if (!account) {
		throw new Error('You must log in before publishing a checkpoint.');
	}

	const relays = getEffectiveUserRelays(account.pubkey, input.relays);
	if (!relays.length) {
		throw new Error('Select at least one relay before publishing.');
	}

	const draft = buildCheckpointDraft({ ...input, relays });
	const event = await account.signEvent(draft);

	await relayPool.publish(relays, event);
	if (!eventStore.getEvent(event.id)) {
		eventStore.add(event);
	}

	return {
		event,
		relays
	};
}

export async function publishSnapshot(input: SnapshotDraftInput): Promise<PublishSnapshotResult> {
	const account = activeAccount.value;
	if (!account) {
		throw new Error('You must log in before publishing a snapshot.');
	}

	const relays = getEffectiveUserRelays(account.pubkey, input.relays);
	if (!relays.length) {
		throw new Error('Select at least one relay before publishing a snapshot.');
	}

	const draft = buildSnapshotDraft(input);
	const event = await account.signEvent(draft);

	await relayPool.publish(relays, event);
	if (!eventStore.getEvent(event.id)) {
		eventStore.add(event);
	}

	return {
		event,
		relays
	};
}

export async function publishCheckpointOts(
	target: string,
	options?: { relays?: string[] }
): Promise<PublishOtsResult> {
	const account = activeAccount.value;
	if (!account) {
		throw new Error('You must log in before publishing an OpenTimestamps attestation.');
	}

	const normalizedTarget = target.trim();
	if (!normalizedTarget) {
		throw new Error(
			'A published checkpoint id is required before creating an OpenTimestamps attestation.'
		);
	}

	const relays = getEffectiveUserRelays(account.pubkey, options?.relays);
	if (!relays.length) {
		throw new Error('Select at least one relay before publishing an OpenTimestamps attestation.');
	}

	const client = new OtsContextvmServerClient();

	try {
		const result = await client.OtsEvent(normalizedTarget, relays);
		return {
			...result,
			relays
		};
	} finally {
		await client.disconnect();
	}
}
