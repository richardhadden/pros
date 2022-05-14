<script>
	export let schema_data;
	export let top;

	import { isEmpty } from 'ramda';
	console.log('SD', schema_data);

	let models = Object.entries(schema_data).map(([model_name, model]) => {
		return { ...model, model_name };
	});

	if (top) {
		models = models.filter((m) => m.top_level);
	}
	console.log(models);
</script>

<div class="mt-2 ml-2">
	{#each models as model}
		<a
			href="/{model.model_name.toLowerCase()}/new"
			class="text-xs uppercase inline-block border border-green-700 bg-green-200 hover:bg-green-300 rounded-md p-2"
			>➕ {model.model_name}</a
		>

		{#if model?.subclasses && !isEmpty(model.subclasses)}
			<svelte:self schema_data={model.subclasses} top={false} />
		{/if}
	{/each}
</div>
