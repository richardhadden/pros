<script>
	import Select from '$lib/components/custom_svelte_select/Select.svelte';

	const complexItems = [
		{ value: 'chocolate', label: 'Chocolate', group: 'Sweet' },
		{ value: 'pizza', label: 'Pizza', group: 'Savory' },
		{ value: 'cake', label: 'Cake', group: 'Sweet', selectable: false },
		{ value: 'chips', label: 'Chips', group: 'Savory' },
		{ value: 'ice-cream', label: 'Ice Cream', group: 'Sweet' }
	];

	let value = [];
	$: console.log('>>V', value);
	function update_value(e) {
		value = e.detail;
	}
</script>

<h1>Testbed</h1>

<Select
	items={complexItems}
	isMulti={true}
	showClearItem={false}
	{value}
	on:select={update_value}
/>
