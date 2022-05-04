<script context="module">
	export const prerender = true;
</script>

<script>
	const BASE_URI = 'http://127.0.0.1:8000/api';

	const get_page = async (path) => {
		const res = await fetch(BASE_URI + path);
		return res;
	};

	import { onMount } from 'svelte';
	import { schema } from '$lib/stores';

	onMount(async () => {
		const res = await get_page('/schema');
		const schema_file = await res.json();
		schema.set(schema_file);
	});
</script>

<svelte:head>
	<title>Home</title>
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

<slot />
