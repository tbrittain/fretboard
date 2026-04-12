<script lang="ts">
import { page } from "$app/state";

const { children } = $props();

let menuOpen = $state(false);

const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/quizzes/guess-the-note", label: "Guess The Note" },
	{ href: "/quizzes/note-math", label: "Note Math" },
	{ href: "/quizzes/interval-key-context", label: "Key Context Quiz" },
];
</script>

<header>
	<div class="brand">
		<a href="/" class="brand-link">
			<span class="brand-icon">🎸</span>
			<span class="brand-name">Fretboard</span>
		</a>
		<span class="brand-tagline">guitar theory trainer</span>
	</div>

	<nav class="desktop-nav">
		{#each navLinks as link}
			<a href={link.href} class:active={page.url.pathname === link.href}>
				{link.label}
			</a>
		{/each}
	</nav>

	<button class="menu-btn" onclick={() => (menuOpen = true)} aria-label="Open menu">
		&#9776;
	</button>
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
		<nav class="sidebar-nav">
			{#each navLinks as link}
				<a
					href={link.href}
					class:active={page.url.pathname === link.href}
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

<footer>
	<span>Made by <a href="https://tbrittain.com" target="_blank" rel="noopener noreferrer">Trey Brittain</a></span>
	<span class="sep">·</span>
	<span>© 2026</span>
	<span class="sep">·</span>
	<a
		href="https://github.com/tbrittain/fretboard"
		target="_blank"
		rel="noopener noreferrer"
		class="gh-link"
		aria-label="GitHub repository"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
		</svg>
	</a>
</footer>

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
		display: flex;
		flex-direction: column;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.5rem;
		background: #1e293b;
		border-bottom: 1px solid #334155;
	}

	/* Brand */
	.brand {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		margin-right: auto;
	}

	.brand-link {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		text-decoration: none;
	}

	.brand-icon {
		font-size: 1.4rem;
		line-height: 1;
	}

	.brand-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: #0891b2;
		line-height: 1;
	}

	.brand-tagline {
		font-size: 0.7rem;
		color: #64748b;
		padding-left: 1.9rem;
		letter-spacing: 0.02em;
	}

	/* Desktop nav */
	.desktop-nav {
		display: none;
		align-items: center;
		gap: 0.25rem;
	}

	.desktop-nav a {
		padding: 0.45rem 0.85rem;
		border-radius: 6px;
		color: #cbd5e1;
		text-decoration: none;
		font-size: 0.9rem;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.desktop-nav a:hover {
		background: #334155;
		color: #f1f5f9;
	}

	.desktop-nav a.active {
		background: #0891b2;
		color: white;
	}

	/* Mobile hamburger */
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

	/* Overlay & sidebar */
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

	.sidebar-nav {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.sidebar-nav a {
		display: block;
		padding: 0.6rem 0.75rem;
		border-radius: 6px;
		color: #cbd5e1;
		text-decoration: none;
		font-size: 0.95rem;
		transition: background 0.15s;
	}

	.sidebar-nav a:hover {
		background: #334155;
		color: #f1f5f9;
	}

	.sidebar-nav a.active {
		background: #0891b2;
		color: white;
	}

	/* Main content */
	main {
		flex: 1;
		padding: 2rem 1rem;
		max-width: 960px;
		width: 100%;
		margin: 0 auto;
	}

	/* Footer */
	footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 0.85rem 1.5rem;
		background: #1e293b;
		border-top: 1px solid #334155;
		font-size: 0.8rem;
		color: #64748b;
	}

	footer a {
		color: #64748b;
		text-decoration: none;
		transition: color 0.15s;
	}

	footer a:hover {
		color: #0891b2;
	}

	.sep {
		color: #475569;
	}

	.gh-link {
		display: flex;
		align-items: center;
	}

	/* Responsive: show desktop nav, hide hamburger on wider screens */
	@media (min-width: 640px) {
		.desktop-nav {
			display: flex;
		}

		.menu-btn {
			display: none;
		}
	}
</style>
