<script>
	import { onMount } from 'svelte';
	import { Textarea } from 'svelte-materialify';
	import * as Diff from 'diff/dist/diff';
	$: text = '';

	let selection = ``;
	/*
	onMount(() => {
		// Once the component is mounted, we can access the document:
		document.addEventListener(`selectionchange`, () => {
			selection = document.getSelection();
			console.log(selection);
		});
	});*/

	console.log(Diff.diffChars('abcde', 'abde'));

	let top_container;
	let bottom_container = null;
	let mounted = false;

	let rendered_html = '';

	let annotations = [
		//{ start: 0, end: 2, color: 'blue' },
		//{ start: 5, end: 14, color: 'red' },
		//{ start: 11, end: 20, color: 'blue' }
	];

	function node_content_to_frag(nodeList, char_count) {
		const frag = document.createDocumentFragment();
		for (const node of nodeList) {
			//console.log(node);
			if (node.nodeName === '#text') {
				const node_text = node.textContent; //.replaceAll('\n', '').replaceAll('\t', '');
				//console.log(`|${node_text}|`);
				for (const [i, char] of Array.from(node_text).entries()) {
					//console.log(char_count, char);

					const span = document.createElement('span');
					span.textContent = char;
					span.style = 'position: relative';

					for (const ann of annotations) {
						//console.log(char, char_count, ann.start);
						if ((char_count >= ann.start) & (char_count + 1 <= ann.end)) {
							//console.log(char, char_count);
							const inner_span = document.createElement('span');
							inner_span.style = `position: absolute; display: inline; height:100%; width: 100%; left: 0; border-bottom: 2px solid ${ann.color};  bottom: 0; opacity: 0.3;`;

							span.appendChild(inner_span);
						}
					}
					frag.appendChild(span);
					if (char !== '\t' && char !== '\n') {
						char_count += 1;
					}
					//char_count += 1;
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

			console.log(currentNode.textContent.substring(0, currentRange.startOffset));

			console.log('o', offset);
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
			console.log('offset', offset);
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
			//console.log(current_index);
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
						//console.log('remove', current_index);
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
			//console.log(Diff.diffChars(previous_text_content, top_container.textContent));
			update_annotation_indexes();
		}

		annotations = annotations.filter((ann) => ann.end > ann.start);
		bottom_container.innerHTML = '';

		const [frag, cc] = node_content_to_frag(nodeList, 0);
		bottom_container.append(frag);
		previous_text_content = top_container.textContent;
		console.log(annotations);
	}

	let current_selection = null;

	function add_annotation() {
		annotations = [...annotations, { ...current_selection, color: 'green' }];
		render_annotations(top_container.childNodes, 0);
	}

	onMount(() => {
		document.addEventListener('selectionchange', () => {
			const selection = document.getSelection();
			//console.log(selection);
			try {
				if (
					selection.anchorNode === top_container ||
					top_container.contains(selection.anchorNode)
				) {
					const start = getSelectionOffsetRelativeTo(top_container, null, selection);
					const end = getSelectionFocusOffsetRelativeTo(top_container, null, selection);

					//console.log(start, start + selection.toString().length, selection.toString());
					current_selection = { start: start, end: end, text: selection.toString() };
				}
			} catch (TypeError) {}
		});

		render_annotations(top_container.childNodes, 0);
	});
</script>

<h1>Testbed ff</h1>
<div style="position: relative">
	<button on:click={add_annotation} value="add ann">Add Annotation</button>
</div>
<div style="position: relative">
	<div
		class="top"
		contenteditable="true"
		bind:this={top_container}
		on:input={(e) => render_annotations(top_container.childNodes, e)}
	>
		<h1>hello</h1>
		One two three four five six
	</div>

	<div id="bottom" class="bottom" bind:this={bottom_container} />
</div>

<style>
	.top,
	.bottom {
		height: 600px;
		width: 800px;
		position: absolute;
	}

	.top {
		border: thin solid red;
		z-index: 10;
		color: rgba(200, 0, 0, 0);
		caret-color: black;
	}
	.bottom {
		border: thin solid blue;
		z-index: 0;
	}
</style>
