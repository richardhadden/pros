<script>
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';

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
	import PageLayout from '$lib/components/page_layout.svelte';
	import { mdiPlusBox } from '@mdi/js';

	import { _get_display_name, _get_plural_display_name, _is_abstract } from '$lib/helpers.js';

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
</script>

{#await set_page_data_from_endpoint then}
	<PageLayout entity={_get_plural_display_name($schema, entity)}>
		<span slot="header_title" class="text-capitalize"
			>All {_get_plural_display_name($schema, entity)}</span
		>

		<span slot="buttons">
			{#if !_is_abstract($schema, entity)}
				<Button
					icon
					size="small"
					outline
					type="submit"
					value="submit"
					on:click={() => goto(`/${entity}/new//`)}
					class="green-text text-darken-2 ml-2"><Icon path={mdiPlusBox} /></Button
				>
			{/if}
		</span>

		{#each page_data as item}
			<Row style="border-bottom: thin solid #eee">
				<Col>
					<Button
						rounded
						size="small"
						on:click={() => goto(`/${item.real_type}/${item.uid}/`)}
						class="mr-2 mb-2 chip primary-color"
						><span class="text-overline mr-2" style="font-size: 0.5em; padding-top: 0.3em"
							>{_get_display_name($schema, item.real_type)}</span
						>
						{item.label}</Button
					>
				</Col>
			</Row>
		{/each}
	</PageLayout>
{/await}
