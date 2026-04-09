<script lang="ts">
	import { page } from '$app/stores';

	let { children } = $props();

	let menuOpen = $state(false);

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/quizzes/guess-the-note', label: 'Guess The Note' },
		{ href: '/quizzes/note-math', label: 'Note Math' },
	];
</script>

<header>
	<button class="menu-btn" onclick={() => (menuOpen = true)} aria-label="Open menu">
		&#9776;
	</button>
	<h1><a href="/">Fretboard</a></h1>
</header>

{#if menuOpen}
	<div
		class="overlay"
		role="presentation"
		onclick={() => (menuOpen = false)}
		onkeydown={() => {}}
	></div>
	<aside class="sidebar">
		<div class="sidebar-header">
			<span>Navigation</span>
			<button onclick={() => (menuOpen = false)} aria-label="Close menu">&#10005;</button>
		</div>
		<nav>
			{#each navLinks as link}
				<a
					href={link.href}
					class:active={$page.url.pathname === link.href}
					onclick={() => (menuOpen = false)}
				>
					{link.label}
				</a>
			{/each}
		</nav>
	</aside>
{/if}

<main>
	{@render children()}
</main>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: 'Ubuntu', sans-serif;
		background: #0f172a;
		color: #e2e8f0;
		min-height: 100vh;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	header h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	header h1 a {
		color: #f1f5f9;
		text-decoration: none;
	}

	.menu-btn {
		background: none;
		border: none;
		color: #cbd5e1;
		cursor: pointer;
		padding: 0.4rem 0.6rem;
		border-radius: 4px;
		font-size: 1.3rem;
		line-height: 1;
	}

	.menu-btn:hover {
		background: #334155;
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 40;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		height: 100%;
		width: 280px;
		background: #1e293b;
		border-right: 1px solid #334155;
		z-index: 50;
		display: flex;
		flex-direction: column;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid #334155;
		font-weight: 600;
		font-size: 1rem;
	}

	.sidebar-header button {
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.25rem 0.4rem;
		border-radius: 4px;
	}

	.sidebar-header button:hover {
		background: #334155;
		color: #f1f5f9;
	}

	nav {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	nav a {
		display: block;
		padding: 0.6rem 0.75rem;
		border-radius: 6px;
		color: #cbd5e1;
		text-decoration: none;
		font-size: 0.95rem;
		transition: background 0.15s;
	}

	nav a:hover {
		background: #334155;
		color: #f1f5f9;
	}

	nav a.active {
		background: #0891b2;
		color: white;
	}

	main {
		padding: 2rem 1rem;
		max-width: 960px;
		margin: 0 auto;
	}
</style>
