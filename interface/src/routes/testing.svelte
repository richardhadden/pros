<script>
	import { onMount } from 'svelte';
	import { Container, Textarea, Row, Col } from 'svelte-materialify';
	import * as Diff from 'diff/dist/diff';
	import { xlink_attr } from 'svelte/internal';
	$: text = '';

	let top_container;
	let bottom_container = null;

	$: annotations = [
		//{ start: 0, end: 2, color: 'blue' },
		//{ start: 5, end: 14, color: 'red' },
		//{ start: 11, end: 20, color: 'blue' }
	];

	// NO, USE AN ARRAY NOT AN OBJECT, y'eejit.
	let underline_slots = [];

	function get_underline_slot(id) {
		const index = underline_slots.indexOf(id);
		if (index >= 0) {
			return index;
		}
		for (let si = 0; si < underline_slots.length; si++) {
			if (underline_slots[si] === null) {
				underline_slots[si] = id;
				return si;
			}
		}
		const new_slot_index = underline_slots.length;
		underline_slots[new_slot_index] = id;
		return new_slot_index;
	}

	function remove_from_underline_slots(id) {
		underline_slots[underline_slots.indexOf(id)] = null;
	}

	function node_content_to_frag(nodeList, char_count) {
		const frag = document.createDocumentFragment();
		for (const node of nodeList) {
			if (node.nodeName === '#text') {
				const node_text = node.textContent;

				for (const [i, char] of Array.from(node_text).entries()) {
					const span = document.createElement('span');
					span.textContent = char;
					span.style = 'position: relative';

					for (const ann of annotations) {
						// Clean up annotations that have already ended
						if (char_count == ann.end) {
							remove_from_underline_slots(ann.id);
						}

						if ((char_count >= ann.start) & (char_count + 1 <= ann.end)) {
							const underline_slot = get_underline_slot(ann.id);

							const underline_offset = 1 - underline_slot * 3;

							const inner_span = document.createElement('span');

							inner_span.style = `border-sizing: border-box; position: absolute; display: inline; height:100%; width: 100%; left: 0; border-bottom: 2px solid ${
								ann.color
							};  bottom: ${underline_offset}px; opacity: 0.3; background-color: ${
								ann.id === hovered_annotation_id ? ann.color : 'none'
							};`;

							span.appendChild(inner_span);
						}
					}
					frag.appendChild(span);
					if (char !== '\t' && char !== '\n') {
						char_count += 1;
					}
				}
			} else {
				const elem = document.createElement(node.nodeName);
				const [f, cc] = node_content_to_frag(node.childNodes, char_count);
				elem.appendChild(f);
				frag.appendChild(elem);
				char_count = cc;
			}
		}
		return [frag, char_count];
	}

	function getCaretCharacterOffsetWithin(element) {
		var caretOffset = 0;
		var doc = element.ownerDocument || element.document;
		var win = doc.defaultView || doc.parentWindow;
		var sel;
		if (typeof win.getSelection != 'undefined') {
			sel = win.getSelection();
			if (sel.rangeCount > 0) {
				var range = win.getSelection().getRangeAt(0);
				var preCaretRange = range.cloneRange();
				preCaretRange.selectNodeContents(element);
				preCaretRange.setEnd(range.endContainer, range.endOffset);
				caretOffset = preCaretRange.toString().length;
			}
		} else if ((sel = doc.selection) && sel.type != 'Control') {
			var textRange = sel.createRange();
			var preCaretTextRange = doc.body.createTextRange();
			preCaretTextRange.moveToElementText(element);
			preCaretTextRange.setEndPoint('EndToEnd', textRange);
			caretOffset = preCaretTextRange.text.length;
		}
		return caretOffset;
	}

	function getSelectionOffsetRelativeTo(parentElement, currentNode, selection) {
		var currentSelection,
			currentRange,
			offset = 0,
			prevSibling,
			nodeContent;

		if (!currentNode) {
			currentSelection = selection;
			currentRange = currentSelection.getRangeAt(0);
			currentNode = currentRange.startContainer;
			offset += currentNode.textContent
				.substring(0, currentRange.startOffset)
				.replaceAll('\t', '')
				.replaceAll('\n', '').length;
		}

		if (currentNode === parentElement) {
			return offset;
		}

		try {
			if (!parentElement.contains(currentNode)) {
				return null;
			}
		} catch (TypeError) {
			return 0;
		}
		while ((prevSibling = (prevSibling || currentNode).previousSibling)) {
			nodeContent = prevSibling.innerText || prevSibling.nodeValue || '';
			offset += nodeContent.replaceAll('\n', '').replace('\t', '').length;
		}

		return offset + getSelectionOffsetRelativeTo(parentElement, currentNode.parentNode);
	}

	function getSelectionFocusOffsetRelativeTo(parentElement, currentNode, selection) {
		var currentSelection,
			currentRange,
			offset = 0,
			prevSibling,
			nodeContent;

		if (!currentNode) {
			currentSelection = selection;
			currentRange = currentSelection.getRangeAt(0);
			currentNode = currentRange.endContainer;
			offset += currentNode.textContent
				.substring(0, currentRange.endOffset)
				.replaceAll('\t', '')
				.replaceAll('\n', '').length;
		}

		if (currentNode === parentElement) {
			return offset;
		}

		try {
			if (!parentElement.contains(currentNode)) {
				return null;
			}
		} catch (TypeError) {
			return 0;
		}
		while ((prevSibling = (prevSibling || currentNode).previousSibling)) {
			nodeContent = prevSibling.innerText || prevSibling.nodeValue || '';
			offset += nodeContent.length;
		}

		return offset + getSelectionOffsetRelativeTo(parentElement, currentNode.parentNode);
	}

	let previous_text_content = '';

	function update_annotation_indexes() {
		const edit_spans = Diff.diffChars(previous_text_content, top_container.textContent);
		let current_index = 0;
		for (const edit_span of edit_spans) {
			if (edit_span.added) {
				for (const ann of annotations) {
					if (current_index <= ann.start) {
						ann.start += edit_span.count;
					}
					if (current_index + 1 <= ann.end) {
						ann.end += edit_span.count;
					}
				}
				current_index += edit_span.count;
			} else if (edit_span.removed) {
				for (const ann of annotations) {
					if (current_index < ann.start) {
						ann.start -= edit_span.count;
					}
					if (current_index + 1 <= ann.end) {
						ann.end -= edit_span.count;
					}
				}
			} else {
				current_index += edit_span.count;
			}
		}
	}

	function render_annotations(nodeList, e) {
		if (e) {
			update_annotation_indexes();
		}

		annotations = annotations.filter((ann) => ann.end > ann.start);
		bottom_container.innerHTML = '';

		const [frag, cc] = node_content_to_frag(nodeList, 0);
		bottom_container.append(frag);
		previous_text_content = top_container.textContent;
	}

	let current_selection = null;
	$: selected_annotations = [];

	function add_annotation(color) {
		annotations = [...annotations, { ...current_selection, id: crypto.randomUUID(), color: color }]
			.slice()
			.sort((a, b) => {
				return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
			});
		render_annotations(top_container.childNodes, 0);
	}

	function delete_annotation(id) {
		annotations = annotations.filter((ann) => ann.id !== id);
		render_annotations(top_container.childNodes, 0);
	}

	$: console.log(annotations);

	onMount(() => {
		document.addEventListener('selectionchange', () => {
			const selection = document.getSelection();

			try {
				if (
					selection.anchorNode === top_container ||
					top_container.contains(selection.anchorNode)
				) {
					const start = getSelectionOffsetRelativeTo(top_container, null, selection);
					const end = getSelectionFocusOffsetRelativeTo(top_container, null, selection);

					if (start) {
						selected_annotations = annotations
							.filter((ann) => start >= ann.start && end + 1 <= ann.end)
							.map((ann) => ann.id);
					}

					current_selection = { start: start, end: end, text: selection.toString() };
				}
			} catch (TypeError) {}
		});

		render_annotations(top_container.childNodes, 0);
	});

	$: hovered_annotation_id = null;

	function set_hovered_annotation_id(id) {
		console.log('hovered', id);
		hovered_annotation_id = id;
		render_annotations(top_container.childNodes, 0);
	}
</script>

<h1>Testbed ff</h1>
<div style="position: relative">
	<button on:click={() => add_annotation('green')} value="add ann">Green</button>
	<button on:click={() => add_annotation('red')} value="add ann">Red</button>
	<button on:click={() => add_annotation('blue')} value="add ann">Blue</button>
	<button on:click={() => document.execCommand('bold')}>BOLD</button>
</div>
<Container>
	<Row style="position: relative;">
		<Col>
			<div
				class="top"
				contenteditable="true"
				bind:this={top_container}
				on:input={(e) => render_annotations(top_container.childNodes, e)}
			>
				<h1>hello</h1>
				<p>One two three four five six</p>
				<h2>one two three</h2>
			</div>

			<div id="bottom" class="bottom" bind:this={bottom_container} />
		</Col>
		<Col style="position: absolute; left: 810px;">
			Annotations
			{#each annotations as ann}
				<p
					on:mouseenter={() => set_hovered_annotation_id(ann.id)}
					on:mouseleave={() => set_hovered_annotation_id(null)}
					style="color: {selected_annotations.includes(ann.id) ? 'blue' : 'black'}"
				>
					{ann.text} <button on:click={() => delete_annotation(ann.id)}>X</button>
				</p>
			{/each}
		</Col>
	</Row>
</Container>

<style>
	.top,
	.bottom {
		height: 600px;
		width: 800px;
		position: absolute;
		line-height: 3em;
		border-radius: 10px;
		padding: 1em;
	}

	.top:focus,
	.bottom:focus {
		outline: none;
	}

	.top {
		border: thin solid gray;
		z-index: 10;
		color: rgba(200, 0, 0, 0.2);
		caret-color: black;
	}
	.bottom {
		z-index: 0;
	}
</style>
