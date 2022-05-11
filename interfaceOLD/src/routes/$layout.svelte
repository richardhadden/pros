<script>
	import {
		AppBar,
		Button,
		Icon,
		Menu,
		ListItem,
		MaterialApp,
	} from "svelte-materialify";
	import { mdiMenu, mdiDotsVertical } from "@mdi/js";
	import { NavigationDrawer, List } from "svelte-materialify";
	import { mdiViewDashboard, mdiAccountBox, mdiGavel } from "@mdi/js";

	let theme = "light";

	function toggleTheme() {
		if (theme === "light") theme = "dark";
		else theme = "light";
	}
</script>

<MaterialApp>
	<AppBar style="margin-bottom: 0em;">
		<div slot="icon">
			<Button fab depressed>
				<Icon path={mdiMenu} />
			</Button>
		</div>
		<span slot="title">ProsT</span>
		<div style="flex-grow:1" />
		<Button>Item</Button>
		<Menu right>
			<div slot="activator">
				<Button fab depressed>
					<Icon path={mdiDotsVertical} />
				</Button>
			</div>
			<ListItem>Item 1</ListItem>
			<ListItem>Item 2</ListItem>
			<ListItem>Item 3</ListItem>
		</Menu>
	</AppBar>
	<div class="d-flex flex-row align-self-stretch" height="100%">
		<NavigationDrawer
			class=" d-flex primary-color theme--dark align-self-stretch"
		>
			<List>
				<ListItem>
					<span slot="prepend">
						<Icon path={mdiViewDashboard} />
					</span>
					Dashboard
				</ListItem>
				<ListItem>
					<span slot="prepend">
						<Icon path={mdiAccountBox} />
					</span>
					Account
				</ListItem>
				<ListItem>
					<span slot="prepend">
						<Icon path={mdiGavel} />
					</span>
					Admin
				</ListItem>
			</List>
			<span slot="append" class="pa-2">
				<Button block>Logout</Button>
			</span>
		</NavigationDrawer>

		<div><slot /></div>
	</div>
</MaterialApp>
