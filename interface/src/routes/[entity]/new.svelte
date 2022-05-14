<script>
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema, get_schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';

	import Form from '$lib/components/form.svelte';
	import {
		AppBar,
		Button,
		Card,
		Container,
		Row,
		Col,
		Chip,
		Divider,
		Icon,
		ListItem,
		Menu
	} from 'svelte-materialify';
	import { mdiContentSave } from '@mdi/js';

	import PageLayout from '$lib/components/page_layout.svelte';

	const BASE_URI = 'http://127.0.0.1:8000/api';

	$: entity = $page.params.entity;

	$: form_data = {};

	function set_default_form_data() {
		form_data = Object.assign(
			{},
			...Object.entries($schema[entity].fields).map(([k, v]) => ({
				[k]: v.default_value
			}))
		);
	}

	// Need to set form data to the defaults from the schema
	// when we mount component or navigate pages
	onMount(set_default_form_data);
	afterNavigate(set_default_form_data);

	//$: console.log('form_data_new', form_data);
	let status = 'new';

	const submit_form = async () => {
		const submission_data = Object.entries(form_data).reduce((obj, [k, v]) => {
			obj[k] =
				$schema[entity].fields[k].type === 'relation'
					? v.map((r) => ({ uid: r.value, label: r.label }))
					: v;
			return obj;
		}, {});
		const resp = await fetch(BASE_URI + '/' + $schema[entity].app + '/' + entity + '/new/', {
			method: 'POST', // *GET, POST, PUT, DELETE, etc.
			mode: 'cors', // no-cors, *cors, same-origin
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			credentials: 'same-origin', // include, *same-origin, omit
			headers: {
				'Content-Type': 'application/json'
				// 'Content-Type': 'application/x-www-form-urlencoded',
			},

			body: JSON.stringify(submission_data)
		});
		const json = await resp.json();

		status = json.saved ? 'saved' : 'save error';
		goto(`/${entity}/${json.uid}/`);
	};
</script>

<PageLayout {entity}>
	<span slot="header_title">{form_data['label'] || `New ${entity}`}</span>
	<span slot="buttons">
		<Button
			icon
			size="small"
			outline
			type="submit"
			value="submit"
			on:click={submit_form}
			class="green-text text-darken-2"><Icon path={mdiContentSave} /></Button
		>
	</span>
	<Form {submit_form} bind:form_data {entity} />
</PageLayout>
