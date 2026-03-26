import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import { adjacencyGraphs, dictionary as commonDictionary } from '@zxcvbn-ts/language-common';
import { dictionary as enDictionary, translations } from '@zxcvbn-ts/language-en';

export type SecretStrength = {
	score: number;
	percent: number;
	label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong';
	feedback: string;
	warnings: string[];
	guessesLog10: number;
	estimatedBits: number;
	offlineFastHashingDisplay: string;
};

zxcvbnOptions.setOptions({
	translations,
	graphs: adjacencyGraphs,
	dictionary: {
		...commonDictionary,
		...enDictionary
	}
});

const LOG10_2 = Math.log10(2);

const EMPTY_SECRET_STRENGTH: SecretStrength = {
	score: 0,
	percent: 0,
	label: 'Very weak',
	feedback: 'Add a long random secret for stronger offline-guess resistance.',
	warnings: [],
	guessesLog10: 0,
	estimatedBits: 0,
	offlineFastHashingDisplay: 'less than a second'
};

function getStrengthBand(estimatedBits: number) {
	if (estimatedBits >= 128) {
		return {
			percent: 100,
			label: 'Very strong' as const,
			feedback:
				'Estimated search space exceeds 128 bits. This is strong for a SHA-256 commitment preimage.'
		};
	}

	if (estimatedBits >= 96) {
		return {
			percent: 80,
			label: 'Strong' as const,
			feedback:
				'Strong secret, but still below the 128-bit target for a very strong SHA-256 commitment preimage.'
		};
	}

	if (estimatedBits >= 64) {
		return {
			percent: 60,
			label: 'Fair' as const,
			feedback:
				'Moderate resistance, but consider a longer or more random secret for stronger offline-guess resistance.'
		};
	}

	if (estimatedBits >= 40) {
		return {
			percent: 40,
			label: 'Weak' as const,
			feedback:
				'This secret is still too guessable for a high-confidence commitment. Prefer a much longer random value.'
		};
	}

	return {
		percent: 20,
		label: 'Very weak' as const,
		feedback:
			'Very low resistance to offline guessing. Use a long randomly generated secret instead.'
	};
}

export function estimateSecretStrength(secret: string): SecretStrength {
	if (!secret) {
		return EMPTY_SECRET_STRENGTH;
	}

	const result = zxcvbn(secret);
	const warning = result.feedback.warning?.trim();
	const suggestions =
		result.feedback.suggestions?.map((entry) => entry.trim()).filter(Boolean) ?? [];
	const warnings = warning ? [warning, ...suggestions] : suggestions;
	const estimatedBits = result.guessesLog10 / LOG10_2;
	const band = getStrengthBand(estimatedBits);

	return {
		score: result.score,
		percent: band.percent,
		label: band.label,
		feedback: band.feedback,
		warnings,
		guessesLog10: result.guessesLog10,
		estimatedBits,
		offlineFastHashingDisplay: result.crackTimesDisplay.offlineFastHashing1e10PerSecond
	};
}
