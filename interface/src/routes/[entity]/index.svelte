<script>
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';

	import Form from '$lib/components/form.svelte';

	import NewEntityMenu from '$lib/components/new_entity_menu.svelte';

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

	const capitalize = (s) => {
		if (typeof s !== 'string') return '';
		return s.charAt(0).toUpperCase() + s.slice(1);
	};
</script>

<h3 class="text-uppercase">{entity}s</h3>

<div>
	<a
		href="/{entity}/new"
		class="text-xs uppercase inline-block border border-green-700 bg-green-200 hover:bg-green-300 rounded-md p-2"
		>➕ {entity}</a
	>

	{#if $schema[entity].subclasses}
		<NewEntityMenu schema_data={$schema[entity].subclasses} />
	{/if}
</div>

{#await set_page_data_from_endpoint then}
	{#each page_data as item}
		<div>
			<a href="/{item.real_type}/{item.uid}/">{item.label}</a>
		</div>
	{/each}
{/await}
