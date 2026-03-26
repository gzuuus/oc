<script lang="ts">
	import { resolve } from '$app/paths';
	import Menu from '@lucide/svelte/icons/menu';
	import ThemeToggle from './theme-toggle.svelte';
	import ProfileCard from './ProfileCard.svelte';
	import { buttonVariants } from './ui/button/index.js';
	import * as Sheet from './ui/sheet/index.js';
	import { activeAccount } from '$lib/services/accountManager.svelte.js';
	import AccountLoginDialog from '../../AccountLoginDialog.svelte';

	const homeHref = $derived<`/`>('/');
	const links = [
		{ href: '/about', label: 'About' },
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/create/checkpoint', label: 'Checkpoints' },
		{ href: '/create/snapshot', label: 'Snapshots' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<header
	class="bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur"
>
	<div class="flex h-14 items-center justify-between px-4 py-4 sm:px-6">
		<!-- Logo -->
		<a
			href={resolve(homeHref)}
			class="flex items-center space-x-2 transition-transform duration-200 hover:scale-105"
		>
			<span class="text-sm font-semibold tracking-[0.18em] uppercase">Open Continuity</span>
		</a>

		<!-- Desktop Navigation -->
		<div class="hidden items-center space-x-4 sm:flex sm:space-x-6">
			<nav class="flex items-center gap-5 text-sm">
				{#each links as link}
					<a href={link.href} class="text-muted-foreground hover:text-foreground transition-colors">
						{link.label}
					</a>
				{/each}
			</nav>
			<div class="flex items-center gap-2 sm:gap-4">
				{#if $activeAccount}
					<div class="hidden items-center gap-2 sm:flex sm:gap-3">
						<ProfileCard pubkey={$activeAccount.pubkey} />
					</div>
				{:else}
					<div class="hidden sm:block">
						<AccountLoginDialog />
					</div>
				{/if}
			</div>
			<!-- Theme Toggle -->
			<div class="flex items-center space-x-2">
				<ThemeToggle />
			</div>
		</div>

		<!-- Mobile Menu Button -->
		<div class="flex items-center space-x-2 sm:hidden">
			<ThemeToggle />
			<Sheet.Root>
				<Sheet.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Menu">
					<Menu class="h-5 w-5" />
				</Sheet.Trigger>
				<Sheet.Content side="right" class="w-[300px] p-6 sm:w-[400px]">
					<div class="py-4">
						<nav class="flex flex-col gap-4 px-2 text-sm">
							{#each links as link}
								<a
									href={link.href}
									class="text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</a>
							{/each}
						</nav>
						<div class="mt-8 border-t pt-6">
							{#if $activeAccount}
								<div class="flex flex-col gap-4 px-2">
									<ProfileCard pubkey={$activeAccount.pubkey} />
								</div>
							{:else}
								<div class="px-2">
									<AccountLoginDialog />
								</div>
							{/if}
						</div>
					</div>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</div>
</header>
