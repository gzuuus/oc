# Open Continuity

Open Continuity is a Svelte-based Nostr web client for preparing, preserving, publishing, and evaluating identity continuity evidence.

The product is centered on two ideas:

- checkpoints: immutable continuity claims for identity transitions
- snapshots: preserved copies of replaceable events that matter during later evaluation

The app is designed to help users work through continuity as an evidence problem rather than an authoritative key-reassignment mechanism.

## Product focus

Open Continuity helps users:

- prepare continuity evidence before key loss or compromise
- preserve historical profile and social-context state
- publish root and linked checkpoints with clearer guidance
- evaluate claims through lineage, snapshots, and corroborating signals
- inspect conflicting evidence without hiding uncertainty

## Development

Install dependencies and start the local development server:

```sh
bun install
bun run dev
```

## Quality checks

Run the project checks:

```sh
bun run check
```

Create a production build:

```sh
bun run build
```
