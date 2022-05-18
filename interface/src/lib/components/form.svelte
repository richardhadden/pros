<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { schema } from '$lib/stores.js';
	import RelationField from './relation_field.svelte';
	import { prevent_default } from 'svelte/internal';
	import { isEmpty, isNil } from 'ramda';
	import { Avatar, Chip, Icon } from 'svelte-materialify';
	import { mdiContentSaveEdit } from '@mdi/js';
	import { mdiArrowRightThin } from '@mdi/js';
	export let form_data;
	export let submit_form;
	export let entity;

	import { Row, Col, TextField, Button, AppBar, Container } from 'svelte-materialify';

	function update_field(field_name, value) {
		form_data = { ...form_data, [field_name]: value };
	}

	function check_and_submit(form) {
		submit_form(form);
	}
</script>

<form on:submit|preventDefault={check_and_submit}>
	{#each Object.entries($schema[entity].fields) as [field_name, field]}
		<Row style="border-bottom: thin solid #eee">
			{#if field.type === 'relation'}
				<Col cols={4} class="text-overline ">
					<div>{field_name.replaceAll('_', ' ')}</div>
					<div>
						<Chip size="x-small" class="pl-0"
							><Avatar style="position: relative; left: 0.8em;">⇨</Avatar><span
								style="position: relative; top: 0.1em">{field.relation_to}</span
							></Chip
						>
					</div>
				</Col>
			{:else}
				<Col cols={4} class="text-overline d-flex flex-col align-center">
					<div>{field_name}</div>
				</Col>
			{/if}

			<Col class="d-flex flex-column justify-left">
				{#if field.type === 'property'}
					{#if field.property_type === 'StringProperty'}
						<TextField
							class="mt-3"
							value={form_data[field_name]}
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
					<RelationField
						selected={form_data[field_name]}
						on_change={(values) => update_field(field_name, values)}
						relation_to={field.relation_to}
					/>
				{/if}
			</Col>
		</Row>
	{/each}
	<Row>
		<Col cols={12} class="d-flex justify-center">
			<!--<Button
				fab
				type="submit"
				value="submit"
				class="mt-3 red darken-2 white-text text-darken-2 ml-2"
				><Icon path={mdiContentSaveEdit} class="ml-1" /></Button
			>--></Col
		>
	</Row>

	<!--<input type="submit" value="Submit" class="border hover:bg-slate-100 p-3 rounded-md" />-->
</form>
