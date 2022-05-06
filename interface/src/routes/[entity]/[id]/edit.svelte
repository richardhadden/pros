<script>
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';

	import Form from '$lib/components/form.svelte';

	const BASE_URI = 'http://127.0.0.1:8000/api';

	const get_form_data = async () => {};

	$: entity = $page.params.entity;
	$: id = $page.params.id;

	$: form_data = {};

	async function set_form_data_from_endpoint() {
		const resp = await fetch(`${BASE_URI}/${$schema[entity].app}/${entity}/${id}`);
		const response_json = await resp.json();
		console.log(response_json);
		form_data = Object.assign(
			{},
			...Object.entries($schema[entity].fields).map(([k, v]) => ({
				[k]: response_json[k]
			}))
		);
	}

	// Need to set form data to the defaults from the schema
	// when we mount component or navigate pages
	onMount(set_form_data_from_endpoint);
	afterNavigate(set_form_data_from_endpoint);

	$: console.log('form_data_new', form_data);
	let status = 'EDIT';

	const submit_form = async () => {
		console.log('submut', form_data);

		const resp = await fetch(`${BASE_URI}/${$schema[entity].app}/${entity}/${id}`, {
			method: 'PUT', // *GET, POST, PUT, DELETE, etc.
			mode: 'cors', // no-cors, *cors, same-origin
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			credentials: 'same-origin', // include, *same-origin, omit
			headers: {
				'Content-Type': 'application/json'
				// 'Content-Type': 'application/x-www-form-urlencoded',
			},

			body: JSON.stringify(form_data)
		});
		const json = await resp.json();
		console.log(json);
		status = json.saved ? 'saved' : 'save error';
	};
</script>

<h6>{status}</h6>

<Form {submit_form} bind:form_data {entity} />
