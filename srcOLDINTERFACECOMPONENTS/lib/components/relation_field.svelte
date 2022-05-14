<script>
	import { onMount } from 'svelte';
	import MultiSelect from 'svelte-multiselect';
	import { schema } from '$lib/stores.js';
	export let selected;
	export let on_change;
	export let relation_to;

	$: options = ['NONE'];
	//$: console.log(options);
	const BASE_URI = 'http://127.0.0.1:8000/api';

	async function get_field_options() {
		const resp = await fetch(
			`${BASE_URI}/${$schema[relation_to.toLowerCase()].app}/${relation_to.toLowerCase()}/`
		);
		const response_json = await resp.json();
		//console.log('response', response_json);
		options = response_json.map((k) => {
			return { label: k.label, id: k.uid };
		});
	}

	onMount(get_field_options);

	function do_change() {
		on_change(selected);
	}
</script>

<MultiSelect bind:selected on:change={do_change} {options} />
