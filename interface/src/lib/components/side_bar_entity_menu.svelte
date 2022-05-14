<script>
	export let schema_data;
	export let top;
	import { schema } from '$lib/stores';
	import { _get_plural_display_name, _is_abstract } from '$lib/helpers.js';
	import { goto } from '$app/navigation';
	import { List, ListItem, ListGroup, Divider, Button, Icon } from 'svelte-materialify';
	import { mdiPlusCircle } from '@mdi/js';
	import { isEmpty } from 'ramda';

	let models = Object.entries(schema_data).map(([model_name, model]) => {
		return { ...model, model_name };
	});

	if (top) {
		models = models.filter((m) => m.top_level);
	}
</script>

{#each models as model}
	<ListItem dense class="text-uppercase" style="height: 2em">
		{#if !top}<span class="ml-2">↪︎</span>{/if}
		<Button
			text
			style="font-size: 0.75em;"
			on:click={() => goto(`/${model.model_name.toLowerCase()}/`)}
			>{_get_plural_display_name($schema, model.model_name)}</Button
		>

		<span slot="append">
			{#if !_is_abstract($schema, model.model_name)}
				<Button
					icon
					on:click={() => goto(`/${model.model_name.toLowerCase()}/new/`)}
					size="x-small"
					class=""
					><Icon path={mdiPlusCircle} />
				</Button>
			{/if}
		</span>
	</ListItem>

	{#if model?.subclasses && !isEmpty(model.subclasses)}
		<div class="ml-2"><svelte:self schema_data={model.subclasses} top={false} /></div>
	{/if}
	{#if top}
		<Divider />
	{/if}
{/each}
