<script>
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { prevent_default } from 'svelte/internal';

	import PageLayout from '$lib/components/page_layout.svelte';

	import Form from '$lib/components/form.svelte';
	import {
		AppBar,
		Button,
		Container,
		Row,
		Col,
		Chip,
		Divider,
		Icon,
		ListItem,
		Menu
	} from 'svelte-materialify';
	import { mdiFileDocumentEdit } from '@mdi/js';

	const BASE_URI = 'http://127.0.0.1:8000/api';

	$: entity = $page.params.entity;
	$: uid = $page.params.uid;

	let page_data = {};
	$: console.log('PAGE_DATA', page_data);

	async function load_data() {
		const resp = await fetch(`${BASE_URI}/${$schema[entity].app}/${entity}/${uid}`);
		const response_json = await resp.json();
		console.log('response_data', response_json);
		page_data = Object.assign(
			{},
			...Object.entries($schema[entity].fields).map(([k, v]) => ({
				[k]:
					$schema[entity].fields[k].type === 'relation'
						? response_json[k].map((a) => ({ uid: a.uid, label: a.label, real_type: a.real_type }))
						: response_json[k]
			}))
		);
	}

	// Need to set form data to the defaults from the schema
	// when we mount component or navigate pages
	onMount(load_data);
	afterNavigate(load_data);
</script>

{#await load_data then}
	<PageLayout {entity}>
		<span slot="header_title">{page_data['label']}</span>
		<span slot="buttons"
			><Button
				icon
				size="small"
				outline
				type="submit"
				value="submit"
				on:click={() => goto(`/${entity}/${uid}/edit/`)}
				class="green-text text-darken-2 ml-2"><Icon path={mdiFileDocumentEdit} /></Button
			></span
		>
		{#each Object.entries(page_data) as [key, value]}
			<Row style="border-bottom: thin solid #eee">
				<Col cols={3} class="text-overline d-flex flex-col align-center">{key}</Col>

				{#if $schema[entity]?.fields[key]?.type === 'relation'}
					<Col cols={9} class="d-flex flex-col flex-wrap align-center pt-5">
						{#each value as v}
							<Button
								rounded
								size="small"
								on:click={() => goto(`/${v.real_type}/${v.uid}/`)}
								class="mr-2 mb-2 chip primary-color"
								><span class="text-overline mr-2" style="font-size: 0.5em; padding-top: 0.3em"
									>{v.real_type}</span
								>
								{v.label}</Button
							>
						{/each}
					</Col>
				{:else}
					<Col cols={9} class="d-flex flex-col flex-wrap align-center">
						{value ? value : ''}
					</Col>
				{/if}
			</Row>
		{/each}
	</PageLayout>
{/await}
