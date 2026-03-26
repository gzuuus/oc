import type { NostrEvent } from 'nostr-tools';

export function getCheckpointParentId(event: NostrEvent): string | undefined {
	return event.tags.find((tag) => tag[0] === 'e')?.[1];
}

export function getCheckpointRootId(event: NostrEvent): string | undefined {
	return event.tags.find((tag) => tag[0] === 'E')?.[1];
}

export function isRootCheckpoint(event: NostrEvent): boolean {
	return !getCheckpointParentId(event);
}

export function getCheckpointCommitment(event: NostrEvent): string | undefined {
	return event.tags.find((tag) => tag[0] === 'commit' && tag[1] === 'sha256' && tag[2])?.[2];
}

export function getCheckpointReveal(event: NostrEvent): string | undefined {
	return event.tags.find((tag) => tag[0] === 'reveal' && tag[1])?.[1];
}

export function hasCheckpointRootTag(event: NostrEvent): boolean {
	return event.tags.some((tag) => tag[0] === 't' && tag[1] === 'root');
}

export function getCheckpointAlt(event: NostrEvent): string | undefined {
	return event.tags.find((tag) => tag[0] === 'alt' && tag[1])?.[1];
}

export function getCheckpointSummary(event: NostrEvent) {
	const parentId = getCheckpointParentId(event);
	const rootId = getCheckpointRootId(event);
	const commitment = getCheckpointCommitment(event);
	const reveal = getCheckpointReveal(event);
	const root = isRootCheckpoint(event);

	return {
		id: event.id,
		pubkey: event.pubkey,
		createdAt: event.created_at,
		content: event.content,
		rootId,
		parentId,
		isRoot: root,
		kindLabel: root ? 'root checkpoint' : 'linked checkpoint',
		hasRootTag: hasCheckpointRootTag(event),
		alt: getCheckpointAlt(event),
		commitment,
		reveal,
		hasCommit: !!commitment,
		hasReveal: !!reveal
	};
}

export function formatRelativeTimestamp(unix: number): string {
	const diff = Date.now() - unix * 1000;
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
