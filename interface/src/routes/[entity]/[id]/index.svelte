<script>
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';

	import Form from '$lib/components/form.svelte';

	const BASE_URI = 'http://127.0.0.1:8000/api';

	$: entity = $page.params.entity;
	$: id = $page.params.id;

	let page_data = {};
	$: console.log('PAGE_DATA', page_data);

	async function load_data() {
		const resp = await fetch(`${BASE_URI}/${$schema[entity].app}/${entity}/${id}`);
		const response_json = await resp.json();
		console.log('response_data', response_json);
		page_data = Object.assign(
			{},
			...Object.entries($schema[entity].fields).map(([k, v]) => ({
				[k]:
					$schema[entity].fields[k].type === 'relation'
						? response_json[k].map((a) => ({ id: a.uid, label: a.label }))
						: response_json[k]
			}))
		);
	}

	// Need to set form data to the defaults from the schema
	// when we mount component or navigate pages
	onMount(load_data);
	afterNavigate(load_data);
</script>

<h1 class="text-lg mb-5">
	View: <b>{page_data['label']}</b> <a href="/{entity}/{id}/edit">EDIT</a>
</h1>
<h6>{status}</h6>

{#await load_data then}
	{#each Object.entries(page_data) as [key, value]}
		<div>
			{key}: {#if typeof value === 'object'}
				{#each value as v} {v.label} {/each}
			{:else}
				{value}
			{/if}
		</div>
	{/each}
{/await}
