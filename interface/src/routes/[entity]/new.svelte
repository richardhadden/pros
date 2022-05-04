<script>
	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';

	import Form from '$lib/components/form.svelte';

	const BASE_URI = 'http://127.0.0.1:8000/api';

	$: entity = $page.params.entity;
	$: form_data = {};
	$: console.log(form_data);

	let status = 'new';

	const submit_form = async () => {
		console.log('submut');
		console.log(form_data);
		const resp = await fetch(BASE_URI + '/' + $schema[entity].app + '/' + entity + '/new/', {
			method: 'POST', // *GET, POST, PUT, DELETE, etc.
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
		status = json.saved ? 'saved' : 'save error';
	};
</script>

<h6>{status}</h6>
<h1>{entity}</h1>

<Form {submit_form} bind:form_data {entity} />
