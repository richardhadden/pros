<script>
	import { onMount } from "svelte";
	import { afterNavigate } from "$app/navigation";

	import { page } from "$app/stores";
	import { schema } from "$lib/stores.js";
	import { prevent_default } from "svelte/internal";

	import Form from "$lib/components/form.svelte";

	const BASE_URI = "http://127.0.0.1:8000/api";
	import { blur, fade } from "svelte/transition";

	$: entity = $page.params.entity;
	$: id = $page.params.id;

	$: form_data = {};
	//$: console.log('FORM DATA', form_data);

	let data_loaded = false;

	async function set_form_data_from_endpoint() {
		const resp = await fetch(
			`${BASE_URI}/${$schema[entity].app}/${entity}/${id}`
		);
		const response_json = await resp.json();
		console.log("response_data", response_json);
		form_data = Object.assign(
			{},
			...Object.entries($schema[entity].fields).map(([k, v]) => ({
				[k]:
					$schema[entity].fields[k].type === "relation"
						? response_json[k].map((a) => ({
								id: a.uid,
								label: a.label,
						  }))
						: response_json[k],
			}))
		);
		data_loaded = true;
	}

	// Need to set form data to the defaults from the schema
	// when we mount component or navigate pages
	onMount(set_form_data_from_endpoint);
	afterNavigate(set_form_data_from_endpoint);

	$: console.log("form_data_new", form_data);
	let status = "editing (unsaved)";

	const submit_form = async () => {
		console.log("submut", form_data);

		const resp = await fetch(
			`${BASE_URI}/${$schema[entity].app}/${entity}/${id}`,
			{
				method: "PUT", // *GET, POST, PUT, DELETE, etc.
				mode: "cors", // no-cors, *cors, same-origin
				cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
				credentials: "same-origin", // include, *same-origin, omit
				headers: {
					"Content-Type": "application/json",
					// 'Content-Type': 'application/x-www-form-urlencoded',
				},

				body: JSON.stringify(form_data),
			}
		);
		const json = await resp.json();
		console.log(json);
		status = json.saved ? "saved" : "save error";
	};
</script>

<h1 class="text-lg mb-5">Edit: <b>{form_data["label"]}</b></h1>
<h6>{status}</h6>

{#if data_loaded}
	<div transition:fade={{ amount: 0.2 }}>
		<Form {submit_form} bind:form_data {entity} />
	</div>
{:else}
	loading...
{/if}
