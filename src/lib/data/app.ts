import type { NostrEvent } from 'nostr-tools';

type ReadinessItem = {
	label: string;
	status: 'ready' | 'recommended' | 'attention';
	detail: string;
	previewTitle?: string;
	previewContent?: string;
	kind?: number;
	hasSnapshot?: boolean;
	hasOts?: boolean;
	snapshotDetail?: string;
	otsDetail?: string;
};

function formatEventPreview(event: NostrEvent | undefined) {
	if (!event) return undefined;

	try {
		return JSON.stringify(
			{
				id: event.id,
				pubkey: event.pubkey,
				kind: event.kind,
				created_at: event.created_at,
				tags: event.tags,
				content: event.content
			},
			null,
			2
		);
	} catch {
		return event.content || 'Event content is available but could not be formatted.';
	}
}

export const readinessItems: ReadinessItem[] = [
	{
		label: 'Kind 3 contact list',
		status: 'recommended' as const,
		detail: 'Prepare relevant contacts before publishing a checkpoint so social proof has context.'
	},
	{
		label: 'Snapshots for profile and contacts',
		status: 'recommended' as const,
		detail:
			'Preserve replaceable events alongside checkpoint publication to strengthen later evaluation.'
	},
	{
		label: 'Proof channel declarations',
		status: 'attention' as const,
		detail:
			'Decide which proofs you will publish now and which corroboration will be gathered later.'
	}
];

export function buildReadinessItems(input: {
	hasMetadata: boolean;
	hasContacts: boolean;
	isMetadataLoading?: boolean;
	isContactsLoading?: boolean;
	metadataEvent?: NostrEvent;
	contactsEvent?: NostrEvent;
	hasMetadataSnapshot?: boolean;
	hasContactsSnapshot?: boolean;
	hasMetadataOts?: boolean;
	hasContactsOts?: boolean;
}): ReadinessItem[] {
	return [
		{
			label: 'Kind 0 metadata',
			kind: 0,
			status: input.hasMetadata
				? ('ready' as const)
				: input.isMetadataLoading
					? ('recommended' as const)
					: ('recommended' as const),
			detail: input.hasMetadata
				? 'Profile metadata is available and can be preserved as historical evidence.'
				: input.isMetadataLoading
					? 'Looking for profile metadata on the selected and discovered relays.'
					: 'Profile metadata is missing from the current relay view.',
			hasSnapshot: input.hasMetadataSnapshot,
			hasOts: input.hasMetadataOts,
			snapshotDetail: input.hasMetadata
				? input.hasMetadataSnapshot
					? 'A metadata snapshot is already available.'
					: 'No metadata snapshot has been preserved yet.'
				: 'Load or publish metadata first before preserving a snapshot.',
			otsDetail: input.hasMetadata
				? input.hasMetadataOts
					? 'An OpenTimestamps attestation is already available for the current metadata event.'
					: 'No OpenTimestamps attestation has been found for the current metadata event.'
				: 'Load metadata first before requesting an OpenTimestamps attestation.',
			previewTitle: input.hasMetadata ? 'Kind 0 event preview' : undefined,
			previewContent: input.hasMetadata ? formatEventPreview(input.metadataEvent) : undefined
		},
		{
			label: 'Kind 3 contact list',
			kind: 3,
			status: input.hasContacts
				? ('ready' as const)
				: input.isContactsLoading
					? ('recommended' as const)
					: ('attention' as const),
			detail: input.hasContacts
				? 'A contact list is present, giving social proof evaluation historical context.'
				: input.isContactsLoading
					? 'Looking for a contact list on the selected and discovered relays.'
					: 'Create or fetch a contact list before checkpoint publication.',
			hasSnapshot: input.hasContactsSnapshot,
			hasOts: input.hasContactsOts,
			snapshotDetail: input.hasContacts
				? input.hasContactsSnapshot
					? 'A contact-list snapshot is already available.'
					: 'No contact-list snapshot has been preserved yet.'
				: 'Load or publish a contact list first before preserving a snapshot.',
			otsDetail: input.hasContacts
				? input.hasContactsOts
					? 'An OpenTimestamps attestation is already available for the current contact-list event.'
					: 'No OpenTimestamps attestation has been found for the current contact-list event.'
				: 'Load a contact list first before requesting an OpenTimestamps attestation.',
			previewTitle: input.hasContacts ? 'Kind 3 event preview' : undefined,
			previewContent: input.hasContacts ? formatEventPreview(input.contactsEvent) : undefined
		}
	];
}

export const dashboardSections = [
	{
		title: 'Prepare continuity evidence',
		description:
			'Review readiness, preserve important state, and move into guided checkpoint publishing.',
		href: '/create/checkpoint',
		meta: 'recommended start'
	},
	{
		title: 'Preserve replaceable state',
		description:
			'Snapshot profile and contact-list events so later evaluators can inspect historical context.',
		href: '/create/snapshot',
		meta: 'evidence preservation'
	},
	{
		title: 'Understand the product model',
		description: 'Learn how checkpoints, snapshots, corroboration, and uncertainty work together.',
		href: '/about',
		meta: 'product overview'
	}
];

export const checkpointHighlights = [
	'Root vs linked checkpoint distinction is always visible.',
	'Supporting evidence is separated from interpretation.',
	'Competing successors remain visible rather than hidden.'
];

export const checkpointEvidence = [
	{
		title: 'Snapshots',
		description:
			'Preserved profile and contact list events that can be inspected as archived evidence.'
	},
	{
		title: 'Embedded and external evidence',
		description:
			'Embedded secret evidence plus external corroboration such as snapshots, reactions, NIP-05 context, and OTS.'
	},
	{
		title: 'Participation',
		description: 'Attestations and reactions that help evaluators assess community corroboration.'
	}
];

export const lineageStages = [
	{
		title: 'Origin checkpoint',
		description: 'The root continuity claim establishing the initial identity anchor.'
	},
	{
		title: 'Candidate successor',
		description: 'A linked checkpoint proposing continuity to a new key.'
	},
	{
		title: 'Competing branch',
		description: 'Another linked claim that must remain visible until evaluators decide.'
	}
];

export const settingsSections = [
	{
		title: 'Relay selection',
		description: 'Manage the relay set used for discovery, snapshots, and publication.'
	},
	{
		title: 'Signing method',
		description: 'Review how the current account signs publishable events.'
	},
	{
		title: 'Debug visibility',
		description: 'Keep raw event inspection available without forcing it into every page.'
	}
];
