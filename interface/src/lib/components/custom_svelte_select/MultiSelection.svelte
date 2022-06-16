<script>
	import { createEventDispatcher } from 'svelte';
	import { Button, Icon } from 'svelte-materialify';
	import { mdiClose } from '@mdi/js';
	const dispatch = createEventDispatcher();

	export let value = [];
	export let activeValue = undefined;
	export let isDisabled = false;
	export let multiFullItemClearable = false;
	export let getSelectionLabel = undefined;

	function handleClear(i, event) {
		event.stopPropagation();
		dispatch('multiItemClear', { i });
	}

	$: console.log('MS value', value);
</script>

<div>
	{#each value as item, i}
		<div class="select-outer primary-color ">
			<div class="select-inner white-text">
				{@html getSelectionLabel(item)}
				<Button
					class="primary-color"
					style="height:16px; width: 16px; margin-left: 10px; padding: 5px; color: rgba(255,255,255,0.9)"
					fab
					size="x-small"
					on:click={(event) => handleClear(i, event)}><Icon path={mdiClose} /></Button
				>
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	.select-outer {
		border-radius: 30px;
		padding-top: 5px;
		padding-bottom: 4px;
		padding-left: 14px;
		padding-right: 7px;
		display: inline-block;
		font-size: 0.7em;
		margin-right: 5px;
		margin-bottom: 5px;
		margin-top: 2px;
		text-transform: uppercase;
	}
</style>
