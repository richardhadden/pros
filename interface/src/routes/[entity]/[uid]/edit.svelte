<script>
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';

	import Form from '$lib/components/form.svelte';
	import { ProgressCircular, Button, Icon } from 'svelte-materialify';
	import { mdiContentSaveEdit, mdiEyeArrowLeft } from '@mdi/js';
	import PageLayout from '$lib/components/page_layout.svelte';

	const BASE_URI = 'http://127.0.0.1:8000/api';
	import { blur, fade } from 'svelte/transition';

	$: entity = $page.params.entity;
	$: uid = $page.params.uid;

	$: form_data = {};
	$: console.log('FORM DATA', form_data);

	let data_loaded = false;

	async function set_form_data_from_endpoint() {
		const resp = await fetch(`${BASE_URI}/${$schema[entity].app}/${entity}/${uid}`);
		const response_json = await resp.json();

		form_data = Object.assign(
			{},
			...Object.entries($schema[entity].fields).map(([k, v]) => ({
				[k]:
					$schema[entity].fields[k].type === 'relation'
						? response_json[k].map((i) => ({ value: i.uid, label: i.label }))
						: response_json[k]
			}))
		);
		console.log('Form data on loading', form_data);
		data_loaded = true;
	}

	// Need to set form data to the defaults from the schema
	// when we mount component or navigate pages
	onMount(set_form_data_from_endpoint);
	afterNavigate(set_form_data_from_endpoint);

	let status = 'editing (unsaved)';

	const submit_form = async () => {
		const submission_data = Object.entries(form_data).reduce((obj, [k, v]) => {
			obj[k] =
				$schema[entity].fields[k].type === 'relation'
					? v.map((r) => ({ uid: r.value, label: r.label }))
					: v;
			return obj;
		}, {});

		const resp = await fetch(`${BASE_URI}/${$schema[entity].app}/${entity}/${uid}`, {
			method: 'PUT', // *GET, POST, PUT, DELETE, etc.
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
	};
</script>

{#if data_loaded}
	<PageLayout {entity} action="edit">
		<span slot="header_title">{form_data['label']}</span>
		<span slot="buttons">
			<Button
				icon
				size="small"
				outline
				type="submit"
				value="submit"
				on:click={() => goto(`/${entity}/${uid}/`)}
				class="green-text text-darken-2 ml-2"><Icon path={mdiEyeArrowLeft} /></Button
			>
			<Button
				icon
				size="small"
				outline
				type="submit"
				value="submit"
				on:click={submit_form}
				class="red-text text-darken-2 ml-2"><Icon path={mdiContentSaveEdit} /></Button
			>
		</span>
		<Form {submit_form} bind:form_data {entity} />
	</PageLayout>
{:else}
	<ProgressCircular />
{/if}
