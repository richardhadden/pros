<script>
	import { goto } from '$app/navigation';
	import { AppBar, Button, Container, Icon } from 'svelte-materialify';
	import { mdiPlusBox } from '@mdi/js';
	export let entity;
</script>

<AppBar class="pl-2 pr-2 elevation-1">
	<span slot="icon"
		><span class="text-overline mr-2" style="font-size: 0.5em; padding-top: 0.3em">{entity}</span
		></span
	>
	<span slot="title"><slot name="header_title" /></span>
	<div style="flex-grow:1" />

	<slot name="buttons" />
</AppBar>

<div class="mt-3">
	<Container style="width: 60em;"><slot /></Container>
</div>
