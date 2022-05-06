<script context="module">
	export const prerender = true;
</script>

<script>
	const BASE_URI = 'http://127.0.0.1:8000/api';
	import { blur } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { schema, get_schema } from '$lib/stores';

	let schema_loaded = get_schema();
</script>

<svelte:head>
	<title>PROSO</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<header>
	<h1>Proso</h1>
	<nav>
		<ul>
			{#each Object.entries($schema) as [model, value]}
				<li><a href="/{model.toLowerCase()}/new">{model}</a></li>
			{/each}
		</ul>
	</nav>
</header>

{#await schema_loaded}
	Loading schema...
{:then}
	<slot />
{/await}
