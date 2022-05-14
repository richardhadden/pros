<script>
	import { onMount } from 'svelte';
	import Select from '$lib/components/custom_svelte_select/Select.svelte';
	import { schema } from '$lib/stores.js';
	import { Chip } from 'svelte-materialify';
	export let selected = [];
	export let on_change;
	export let relation_to;

	const NOT_LOADED_TEXT = ['Not loaded'];

	$: options = [NOT_LOADED_TEXT];
	//$: console.log(options);
	const BASE_URI = 'http://127.0.0.1:8000/api';

	async function get_field_options() {
		const resp = await fetch(
			`${BASE_URI}/${
				$schema[relation_to.toLowerCase()].app
			}/autocomplete/${relation_to.toLowerCase()}/`
		);
		const response_json = await resp.json();
		//console.log('response', response_json);
		options = response_json.map((k) => {
			return { label: k.label, value: k.uid };
		});
	}

	async function on_click_first(e) {
		if (options.length === 1 && options[0] === NOT_LOADED_TEXT) {
			await get_field_options();
		}
	}

	onMount(get_field_options);

	function updated_selected(e) {
		selected = e.detail;
		on_change(selected);
	}
</script>

<Select value={selected} items={options} on:select={updated_selected} />
