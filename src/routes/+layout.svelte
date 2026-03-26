<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/header.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import '$lib/services/eventLoader';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Header />
<ModeWatcher />
<div class="min-h-screen pt-14">
	{@render children()}
</div>
