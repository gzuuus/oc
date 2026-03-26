export type BadgeTone = 'green' | 'red' | 'neutral';

export type ProofCardStatus = 'verified' | 'pending' | 'missing';

export function badgeClass(tone: BadgeTone) {
	if (tone === 'green') {
		return 'rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs text-green-700 dark:text-green-300';
	}

	if (tone === 'red') {
		return 'rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-700 dark:text-red-300';
	}

	return 'rounded-full border px-2.5 py-1 text-xs';
}

export function relationTone(reaction: {
	symbol: '+' | '-';
	inAuthorContacts: boolean;
	inPreviousContacts: boolean;
}) {
	if (!reaction.inAuthorContacts && !reaction.inPreviousContacts) return 'neutral' as const;
	return reaction.symbol === '+' ? ('green' as const) : ('red' as const);
}

export function continuityTone(reaction: { symbol: '+' | '-'; matchesPrevious: boolean }) {
	if (!reaction.matchesPrevious) return 'neutral' as const;
	return reaction.symbol === '+' ? ('green' as const) : ('red' as const);
}

function proofStatusClass(status: ProofCardStatus) {
	if (status === 'verified') return 'border-green-500/30 bg-green-500/5';
	if (status === 'pending') return 'border-amber-500/30 bg-amber-500/5';
	return '';
}

export function proofCardClass(status: ProofCardStatus = 'missing') {
	return `rounded-xl border p-4 ${proofStatusClass(status)}`.trim();
}

export function shortKey(value: string, start = 12, end = 8) {
	return value.length <= start + end ? value : `${value.slice(0, start)}…${value.slice(-end)}`;
}
