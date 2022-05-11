<script context="module">
	export const prerender = true;
</script>

<script>
	const BASE_URI = "http://127.0.0.1:8000/api";
	import { blur } from "svelte/transition";
	import { onMount } from "svelte";
	import { schema, get_schema } from "$lib/stores";
	import TopMenu from "$lib/components/top_menu.svelte";
	import "../app.css";

	let schema_loaded = get_schema();
</script>

<svelte:head>
	<title>PROSO</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<header class="bg-slate-100 top-10">
	<h1 class="font-light text-7xl">neo4me</h1>
	<nav>
		{#await schema_loaded then}
			<TopMenu schema_data={$schema} top={true} />
		{/await}
	</nav>
</header>

{#await schema_loaded}
	Loading schema...
{:then}
	<div class="mt-5 ml-10 mr-10">
		<slot />
	</div>
{/await}
