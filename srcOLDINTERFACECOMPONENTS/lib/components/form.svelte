<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import RelationField from './relation_field.svelte';
	import { prevent_default } from 'svelte/internal';
	import { isEmpty, isNil } from 'ramda';

	export let form_data;
	export let submit_form;
	export let entity;

	function update_field(field_name, value) {
		console.log('UPDATEFIELD', field_name, value);
		//console.log(field_name, value);
		form_data = { ...form_data, [field_name]: value };
	}

	$: console.log(form_data);

	function check_and_submit(form) {
		submit_form(form);
	}
</script>

<form on:submit|preventDefault={check_and_submit}>
	{#each Object.entries($schema[entity].fields) as [field_name, field]}
		<div class="mb-4 border rounded-md p-5">
			<label for={field_name} class="min-w-full">{field_name}</label>
			{#if field.type === 'property'}
				{#if field.property_type === 'StringProperty'}
					<input
						class="border rounded-md focus:outline-none"
						type="text"
						value={form_data[field_name]}
						for={field_name}
						on:input={(e) => update_field(field_name, e.target.value)}
						required={field.required}
					/>
				{:else if field.property_type === 'DateProperty'}
					<input
						type="date"
						class="border rounded-sm"
						value={form_data[field_name]}
						for={field_name}
						on:input={(e) => update_field(field_name, e.target.value)}
						required={field.required}
					/>
				{:else if field.property_type === 'IntegerProperty'}
					<input
						type="number"
						value={form_data[field_name]}
						for={field_name}
						on:input={(e) => update_field(field_name, e.target.value)}
						required={field.required}
					/>
				{/if}
			{/if}
			{#if field.type === 'relation'}
				<b>{field.relation_type}->{field.relation_to}</b>
				<RelationField
					selected={form_data[field_name]}
					on_change={(values) => update_field(field_name, values)}
					relation_to={field.relation_to}
				/>
			{/if}
		</div>
	{/each}
	<input type="submit" value="Submit" class="border hover:bg-slate-100 p-3 rounded-md" />
</form>
