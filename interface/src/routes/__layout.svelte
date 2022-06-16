<script>
	import {
		NavigationDrawer,
		List,
		ListItem,
		Button,
		Icon,
		MaterialApp,
		Divider
	} from 'svelte-materialify';
	import { mdiViewDashboard, mdiAccountBox, mdiGavel } from '@mdi/js';
	import SideBarEntityMenu from '$lib/components/side_bar_entity_menu.svelte';

	const BASE_URI = 'http://127.0.0.1:8000/api';
	import { schema, get_schema } from '$lib/stores';
	let schema_loaded = get_schema();
</script>

<MaterialApp>
	<div class="d-flex justify-left" style="height: 100vh">
		<NavigationDrawer class="primary-color theme--dark align-self-stretch" style="width:25em">
			<ListItem
				><!--
				<span slot="prepend" class="ml-n2" />
				<span class="text-h3">P</span><span class="text-h4"><i>r</i>os</span><span class="text-h3"
					>T</span
				>-->experiment
			</ListItem>
			<Divider />
			<List>
				{#await schema_loaded then}
					<SideBarEntityMenu schema_data={$schema} top={true} />
				{/await}
			</List>

			<!--
			<span slot="append" class="pa-2">
				<Button block>Logout</Button>
			</span>-->
		</NavigationDrawer>
		<main class="pa-3">
			{#await schema_loaded}
				loading
			{:then}
				<div class="mt-5 ml-10 mr-10">
					<slot />
				</div>
			{/await}
		</main>
	</div>
</MaterialApp>
