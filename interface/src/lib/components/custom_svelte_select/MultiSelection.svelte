<script>
	import { createEventDispatcher } from 'svelte';
	import { Chip } from 'svelte-materialify';
	const dispatch = createEventDispatcher();

	export let value = [];
	export let activeValue = undefined;
	export let isDisabled = false;
	export let multiFullItemClearable = true;
	export let getSelectionLabel = undefined;

	function handleClear(i, event) {
		event.stopPropagation();
		dispatch('multiItemClear', { i });
	}
</script>

<div>
	{#each value as item, i}
		<Chip size="small" close on:close={(event) => handleClear(i, event)} class="mr-1 mb-1">
			<div class="multiSelectItem_label">
				{@html getSelectionLabel(item)}
			</div>
		</Chip>
	{/each}
</div>
