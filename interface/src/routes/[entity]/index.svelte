<script>
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';

	import Form from '$lib/components/form.svelte';

	const BASE_URI = `http://127.0.0.1:8000/api`;

	$: entity = $page.params.entity;
	$: id = $page.params.id;

	let page_data = [];
	async function set_page_data_from_endpoint() {
		const resp = await fetch(`${BASE_URI}/${$schema[entity].app}/${entity}/`);
		const response_json = await resp.json();
		console.log('response_data', response_json);
		page_data = response_json;
	}
	// Need to set form data to the defaults from the schema
	// when we mount component or navigate pages
	onMount(set_page_data_from_endpoint);
	afterNavigate(set_page_data_from_endpoint);
</script>

<h1 class="text-lg mb-5">{entity}</h1>
<a href="/{entity}/new">NEW</a>

{#await set_page_data_from_endpoint then}
	{#each page_data as item}
		<div>
			<a href="/{entity}/{item.uid}/">{item.label}</a>
		</div>
	{/each}
{/await}
