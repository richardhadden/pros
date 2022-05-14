<script>
	import { onMount } from 'svelte';
	import Select from '$lib/components/custom_svelte_select/Select.svelte';
	import { schema } from '$lib/stores.js';
	import { Chip, Dialog, AppBar, Button, Icon } from 'svelte-materialify';
	import { mdiCloseCircle, mdiContentSaveEdit } from '@mdi/js';
	export let selected = [];
	export let on_change;
	export let relation_to;

	import Form from '$lib/components/form.svelte';

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

	let dialog_open = false;
	function open_dialog(e) {
		e.preventDefault();
		e.stopPropagation();
		dialog_open = true;
	}
	function close_dialog(e) {
		dialog_open = false;
		modal_form_data = {};
	}

	$: modal_form_data = {};

	const submit_modal_form = async () => {
		const submission_data = Object.entries(modal_form_data).reduce((obj, [k, v]) => {
			obj[k] =
				$schema[relation_to.toLowerCase()].fields[k].type === 'relation'
					? v.map((r) => ({ uid: r.value, label: r.label }))
					: v;
			return obj;
		}, {});
		const resp = await fetch(
			BASE_URI +
				'/' +
				$schema[relation_to.toLowerCase()].app +
				'/' +
				relation_to.toLowerCase() +
				'/new/',
			{
				method: 'POST', // *GET, POST, PUT, DELETE, etc.
				mode: 'cors', // no-cors, *cors, same-origin
				cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
				credentials: 'same-origin', // include, *same-origin, omit
				headers: {
					'Content-Type': 'application/json'
					// 'Content-Type': 'application/x-www-form-urlencoded',
				},

				body: JSON.stringify(submission_data)
			}
		);
		const json = await resp.json();

		if (json.saved) {
			selected = [...selected, { value: json.uid, label: json.label }];
			close_dialog();
			await get_field_options();
		}
	};
</script>

<Select
	value={selected}
	items={options}
	on:select={updated_selected}
	{open_dialog}
	isMulti={true}
/>

<Dialog bind:active={dialog_open} persistent>
	<div class="">
		<AppBar class="pl-2 pr-2 mb-5 elevation-2">
			<span slot="icon"
				><span class="text-overline mr-2" style="font-size: 0.5em; padding-top: 0.3em"
					>{relation_to.toLowerCase()}</span
				></span
			>
			<span slot="title">{modal_form_data?.label ?? `New ${relation_to}`}</span>
			<div style="flex-grow:1" />

			<Button
				icon
				size="small"
				outline
				type="submit"
				value="submit"
				on:click={submit_modal_form}
				class="red-text text-darken-2 ml-2"><Icon path={mdiContentSaveEdit} /></Button
			>
			<Button icon size="small" on:click={close_dialog} class="ml-2">
				<Icon path={mdiCloseCircle} />
			</Button>
		</AppBar>
		<div class="pa-4">
			<Form
				submit_form={submit_modal_form}
				bind:form_data={modal_form_data}
				entity={relation_to.toLowerCase()}
			/>
		</div>
	</div></Dialog
>
