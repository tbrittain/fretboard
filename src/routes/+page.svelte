<svelte:head>
	<title>Fretboard</title>
</svelte:head>

<div class="hero">
	<h2>Learn guitar theory, one quiz at a time.</h2>
	<p>Practice note names, intervals, and key context directly on an interactive fretboard.</p>
</div>

<section class="quizzes">
	<h3>Quizzes</h3>
	<div class="cards">
		<a class="card" href="/quizzes/guess-the-note">
			<h4>Guess The Note</h4>
			<p>A fret lights up — name the pitch class before the timer runs out.</p>
			<span class="start">Start →</span>
		</a>
		<a class="card" href="/quizzes/note-math">
			<h4>Note Math</h4>
			<p>Given a starting note and a semitone offset, name the resulting pitch.</p>
			<span class="start">Start →</span>
		</a>
		<a class="card" href="/quizzes/interval-key-context">
			<h4>Key Context Quiz</h4>
			<p>Name every scale degree in a key, then locate the notes on the neck.</p>
			<span class="start">Start →</span>
		</a>
	</div>
</section>

<style>
	.hero {
		padding: 0 0 2rem;
		border-bottom: 1px solid #334155;
		margin-bottom: 2rem;
	}

	.hero h2 {
		margin: 0 0 0.5rem;
		font-size: 1.6rem;
		font-weight: 600;
		color: #f1f5f9;
	}

	.hero p {
		margin: 0;
		font-size: 1rem;
		color: #94a3b8;
	}

	.quizzes h3 {
		margin: 0 0 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #64748b;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem 1.5rem;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.15s, background 0.15s;
	}

	.card:hover {
		border-color: #0891b2;
		background: #162433;
	}

	.card h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #f1f5f9;
	}

	.card p {
		margin: 0;
		font-size: 0.9rem;
		color: #94a3b8;
		flex: 1;
	}

	.start {
		font-size: 0.875rem;
		font-weight: 600;
		color: #0891b2;
	}
</style>
