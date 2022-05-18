<script>
	import { Textarea } from 'svelte-materialify';

	$: text = '';
</script>

<h1>Testbed</h1>

<div style="position: relative; border: thin solid black; height: 200px; width: 200px;">
	<div
		class="bottom"
		contenteditable="true"
		bind:innerHTML={text}
		style="position: absolute; height: 200px; border: thin solid red; width: 200px;"
	/>
	<div
		class="top"
		contenteditable="true"
		bind:innerHTML={text}
		style="color: rgba(0,0,0,0); position: absolute; height:200px width: 200px;"
	/>
</div>
