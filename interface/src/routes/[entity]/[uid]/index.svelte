<script>
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';

	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import { object_without_properties, prevent_default } from 'svelte/internal';
	import { _get_display_name, _get_plural_display_name } from '$lib/helpers.js';
	import PageLayout from '$lib/components/page_layout.svelte';
	import { groupBy } from 'ramda';

	import Form from '$lib/components/form.svelte';
	import {
		AppBar,
		Avatar,
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
	let reverse_relations = {};
	$: console.log('PAGE_DATA', page_data);
	$: console.log('REV RELS', reverse_relations);

	const group_reverse_relations_by_type = groupBy((item) => {
		return item.real_type;
	});

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
		reverse_relations = Object.assign(
			{},
			...Object.entries($schema[entity].reverse_relations).map(([k, v]) => ({
				[k]: group_reverse_relations_by_type(response_json[k])
			}))
		);
	}

	// Need to set form data to the defaults from the schema
	// when we mount component or navigate pages
	onMount(load_data);
	afterNavigate(load_data);
</script>

{#await load_data then}
	<PageLayout entity={_get_display_name($schema, entity)}>
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
				<Col cols={3} class="text-overline d-flex flex-col align-center"
					>{key.replaceAll('_', ' ')}</Col
				>
				{#if $schema[entity]?.fields[key]?.type === 'relation'}
					<Col cols={9} class="d-flex flex-col flex-wrap align-center pt-5">
						{#each value as v}
							<Button
								rounded
								size="small"
								on:click={() => goto(`/${v.real_type}/${v.uid}/`)}
								class="mr-2 mb-2 chip primary-color"
								><span class="text-overline mr-2" style="font-size: 0.5em; padding-top: 0.3em"
									>{_get_display_name($schema, v.real_type)}</span
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
		<Row class="mt-10">
			{#each Object.entries(reverse_relations) as [rel_type, rel_group]}
				<Col cols={3} class="text-overline d-flex flex-col align-center"
					>{rel_type.replaceAll('_', ' ')}</Col
				>
				<Col cols={9}>
					{#each Object.entries(rel_group) as [related_type, related_list]}
						<Row style="border-bottom: thin solid #eee" class="pt-2">
							<Col cols={3}>
								<div>
									<Chip size="x-small" class="pl-0 mt-1" style="padding-right: 4px;"
										><Avatar style="position: relative; left: 0.8em;">⇨</Avatar><span
											style="position: relative; top: 0.1em"
											>{_get_plural_display_name($schema, related_type)}</span
										></Chip
									>
								</div>
							</Col>
							<Col>
								{#each related_list as item}
									<Button
										rounded
										size="small"
										on:click={() => goto(`/${item.real_type}/${item.uid}/`)}
										class="mr-2 mb-2 chip indigo white-text"
										><span class="text-overline mr-2" style="font-size: 0.5em; padding-top: 0.3em"
											>{_get_display_name($schema, item.real_type)}</span
										>
										{item.label}</Button
									>
								{/each}
							</Col>
						</Row>
					{/each}
				</Col>
			{/each}
		</Row>
	</PageLayout>
{/await}
