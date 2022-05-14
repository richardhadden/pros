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

<ul>
	{#each models as model}
		<li class="ml-2">
			<a class="hover:text-blue-600" href="/{model.model_name.toLowerCase()}/">{model.model_name}</a
			>
			{#if model?.subclasses && !isEmpty(model.subclasses)}
				<svelte:self schema_data={model.subclasses} top={false} />
			{/if}
		</li>
	{/each}
</ul>
