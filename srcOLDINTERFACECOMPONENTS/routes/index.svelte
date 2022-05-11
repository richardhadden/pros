<script>
	import { schema } from '$lib/stores';
</script>

{#each Object.entries($schema) as [model, value]}
	<h3>{model}</h3>
	{#each Object.entries(value['fields']) as [field_name, field_type]}
		<li>{field_name}</li>
	{/each}
{/each}
