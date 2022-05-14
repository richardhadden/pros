<script>
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';
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
	import { mdiPlusBox } from '@mdi/js';
	import Form from '$lib/components/form.svelte';

	import NewEntityMenu from '$lib/components/new_entity_menu.svelte';

	const BASE_URI = `http://127.0.0.1:8000/api`;

	$: entity = $page.params.entity;

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

{#await set_page_data_from_endpoint then}
	<AppBar class="pl-2 pr-2 elevation-1">
		<span slot="icon"
			><span class="text-overline mr-2" style="font-size: 0.5em; padding-top: 0.3em">{entity}</span
			></span
		>
		<span slot="title">All {entity}s</span>
		<div style="flex-grow:1" />

		<Button
			icon
			size="small"
			outline
			type="submit"
			value="submit"
			on:click={() => goto(`/${entity}/new//`)}
			class="green-text text-darken-2 ml-2"><Icon path={mdiPlusBox} /></Button
		>
	</AppBar>
	<div class="mt-3">
		<Container style="width: 60em;">
			{#each page_data as item}
				<Row style="border-bottom: thin solid #eee">
					<Col>
						<Button
							rounded
							size="small"
							on:click={() => goto(`/${item.real_type}/${item.uid}/`)}
							class="mr-2 mb-2 chip primary-color"
							><span class="text-overline mr-2" style="font-size: 0.5em; padding-top: 0.3em"
								>{item.real_type}</span
							>
							{item.label}</Button
						>
					</Col>
				</Row>
			{/each}
		</Container>
	</div>
{/await}
