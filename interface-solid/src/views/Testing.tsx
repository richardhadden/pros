import { Component, createSignal, onMount, For, createEffect } from "solid-js";
import * as Diff from "diff/dist/diff";

// Credit to Liam (Stack Overflow)
// https://stackoverflow.com/a/41034697/3480193
class Cursor {
  static getCurrentCursorPosition(parentElement) {
    var selection = window.getSelection(),
      charCount = -1,
      node;

    if (selection.focusNode) {
      if (Cursor._isChildOf(selection.focusNode, parentElement)) {
        node = selection.focusNode;
        charCount = selection.focusOffset;

        while (node) {
          if (node === parentElement) {
            break;
          }

          if (node.previousSibling) {
            node = node.previousSibling;
            charCount += node.textContent.length;
          } else {
            node = node.parentNode;
            if (node === null) {
              break;
            }
          }
        }
      }
    }

    return charCount;
  }

  static setCurrentCursorPosition(chars, element) {
    if (chars >= 0) {
      var selection = window.getSelection();

      let range = Cursor._createRange(element, { count: chars });

      if (range) {
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  static _createRange(node, chars, range) {
    if (!range) {
      range = document.createRange();
      range.selectNode(node);
      range.setStart(node, 0);
    }

    if (chars.count === 0) {
      range.setEnd(node, chars.count);
    } else if (node && chars.count > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.length < chars.count) {
          chars.count -= node.textContent.length;
        } else {
          range.setEnd(node, chars.count);
          chars.count = 0;
        }
      } else {
        for (var lp = 0; lp < node.childNodes.length; lp++) {
          range = Cursor._createRange(node.childNodes[lp], chars, range);

          if (chars.count === 0) {
            break;
          }
        }
      }
    }

    return range;
  }

  static _isChildOf(node, parentElement) {
    while (node !== null) {
      if (node === parentElement) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }
}

const Testing: Component = (props) => {
  let Editor: HTMLDivElement;

  const [annotations, setAnnotations] = createSignal<
    { start: number; end: number }[]
  >([]);
  const [previousTextContent, setPreviousTextContent] = createSignal("");
  const [editorContent, setEditorContent] = createSignal("");
  const [underlineSlots, setUnderlineSlots] = createSignal([]);
  const [currentSelection, setCurrentSelection] = createSignal({});
  const [selectedAnnotations, setSelectedAnnotations] = createSignal([]);
  const [hoveredAnnotationId, setHoveredAnnotationId] = createSignal(null);

  function update_annotation_indexes() {
    const edit_spans = Diff.diffChars(
      previousTextContent(),
      Editor.textContent
    );
    let current_index = 0;
    for (const edit_span of edit_spans) {
      if (edit_span.added) {
        for (const ann of annotations()) {
          if (current_index <= ann.start) {
            ann.start += edit_span.count;
          }
          if (current_index + 1 <= ann.end) {
            ann.end += edit_span.count;
          }
        }
        current_index += edit_span.count;
      } else if (edit_span.removed) {
        for (const ann of annotations()) {
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

  function get_underline_slot(id: string) {
    const index = underlineSlots().indexOf(id);
    if (index >= 0) {
      return index;
    }
    for (let si = 0; si < underlineSlots().length; si++) {
      if (underlineSlots()[si] === null) {
        const uls = underlineSlots();
        uls[si] = id;
        setUnderlineSlots(uls);
        return si;
      }
    }
    const new_slot_index = underlineSlots().length;
    const uls = underlineSlots();
    uls[new_slot_index] = id;
    setUnderlineSlots(uls);
    return new_slot_index;
  }

  function remove_from_underline_slots(id) {
    const uls = underlineSlots();
    uls[uls.indexOf(id)] = null;
    setUnderlineSlots(uls);
  }

  function node_content_to_frag(nodeList, char_count) {
    const frag = document.createDocumentFragment();

    for (const node of nodeList) {
      if (node.nodeName === "#text") {
        const node_text = node.textContent;

        for (const [i, char] of Array.from(node_text).entries()) {
          const span = document.createElement("span");
          span.textContent = char;
          span.style = "position: relative";

          for (const ann of annotations()) {
            // Clean up annotations that have already ended
            if (char_count == ann.end) {
              remove_from_underline_slots(ann.id);
            }

            if ((char_count >= ann.start) & (char_count + 1 <= ann.end)) {
              const underline_slot = get_underline_slot(ann.id);

              const underline_offset = 1 - underline_slot * 3;

              const inner_span = document.createElement("span");

              inner_span.style = `height: ${
                20 * underline_slot * 8
              }px); border-sizing: border-box; position: absolute; display: inline; height:100%; width: 100%; left: 0; border-bottom: 2px solid ${
                ann.color
              };  bottom: ${
                ann.id === hoveredAnnotationId() ? 0 : underline_offset
              }px; opacity: 0.3; background-color: ${
                ann.id === hoveredAnnotationId() ? ann.color : "none"
              };`;

              span.appendChild(inner_span);
            }
          }
          frag.appendChild(span);
          if (char !== "\t" && char !== "\n") {
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

  function render_annotations(nodeList, e) {
    if (e) {
      update_annotation_indexes();
    }

    setAnnotations(annotations().filter((ann) => ann.end > ann.start));

    const [frag, cc] = node_content_to_frag(nodeList, 0);

    Editor.innerHTML = "";

    Editor.append(frag);
    setPreviousTextContent(Editor.textContent);
  }

  function getCaretCharacterOffsetWithin(element) {
    var caretOffset = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    if (typeof win.getSelection != "undefined") {
      sel = win.getSelection();
      if (sel.rangeCount > 0) {
        var range = win.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      }
    } else if ((sel = doc.selection) && sel.type != "Control") {
      var textRange = sel.createRange();
      var preCaretTextRange = doc.body.createTextRange();
      preCaretTextRange.moveToElementText(element);
      preCaretTextRange.setEndPoint("EndToEnd", textRange);
      caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
  }

  function doSetEditorContent(e) {
    let offset = getCaretCharacterOffsetWithin(Editor);
    if (e.inputType === "insertParagraph") {
      return;
    }

    e.preventDefault();
    //console.log(Editor.childNodes);
    render_annotations(Editor.childNodes, e);
    Cursor.setCurrentCursorPosition(offset, Editor);
    Editor.focus();
  }

  function add_annotation(color) {
    setAnnotations(
      [
        ...annotations(),
        { ...currentSelection(), id: crypto.randomUUID(), color: color },
      ]
        .slice()
        .sort((a, b) => {
          return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
        })
    );
    render_annotations(Editor.childNodes, 0);
  }

  function delete_annotation(id) {
    setAnnotations(annotations().filter((ann) => ann.id !== id));
    render_annotations(Editor.childNodes, 0);
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
        .replaceAll("\t", "")
        .replaceAll("\n", "").length;
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
      nodeContent = prevSibling.innerText || prevSibling.nodeValue || "";
      offset += nodeContent.replaceAll("\n", "").replace("\t", "").length;
    }

    return (
      offset +
      getSelectionOffsetRelativeTo(parentElement, currentNode.parentNode)
    );
  }

  function getSelectionFocusOffsetRelativeTo(
    parentElement,
    currentNode,
    selection
  ) {
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
        .replaceAll("\t", "")
        .replaceAll("\n", "").length;
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
      nodeContent = prevSibling.innerText || prevSibling.nodeValue || "";
      offset += nodeContent.length;
    }

    return (
      offset +
      getSelectionOffsetRelativeTo(parentElement, currentNode.parentNode)
    );
  }
  onMount(() => {
    document.addEventListener("selectionchange", () => {
      const selection = document.getSelection();
      //console.log(selection?.toString());
      try {
        if (
          selection.anchorNode === Editor ||
          Editor.contains(selection.anchorNode)
        ) {
          const start = getSelectionOffsetRelativeTo(Editor, null, selection);
          const end = getSelectionFocusOffsetRelativeTo(
            Editor,
            null,
            selection
          );

          if (start) {
            setSelectedAnnotations(
              annotations()
                .filter((ann) => start >= ann.start && end + 1 <= ann.end)
                .map((ann) => ann.id)
            );
          }

          setCurrentSelection({
            start: start,
            end: end,
            text: selection.toString(),
          });
        }
      } catch (TypeError) {}
    });

    render_annotations(Editor.childNodes, 0);
  });

  function doSetHoveredAnnotationId(id) {
    //console.log("hovered", id);
    setHoveredAnnotationId(id);
    render_annotations(Editor.childNodes, 0);
  }

  return (
    <div>
      <div style="position: relative">
        <button
          class="btn"
          onClick={() => add_annotation("green")}
          value="add ann"
        >
          Green
        </button>
        <button
          class="btn"
          onClick={() => add_annotation("red")}
          value="add ann"
        >
          Red
        </button>
        <button
          class="btn"
          onClick={() => add_annotation("blue")}
          value="add ann"
        >
          Blue
        </button>
      </div>
      <div
        ref={Editor}
        contentEditable={true}
        class="h-96 w-full border font-mono"
        onInput={doSetEditorContent}
      ></div>
      <For each={annotations()}>
        {(ann) => (
          <p
            onMouseEnter={() => doSetHoveredAnnotationId(ann.id)}
            onMouseLeave={() => doSetHoveredAnnotationId(null)}
            style={`color: ${
              selectedAnnotations().includes(ann.id) ? ann.color : "black"
            }`}
          >
            {ann.text}{" "}
            <button onClick={() => delete_annotation(ann.id)}>X</button>
          </p>
        )}
      </For>
    </div>
  );
};

export default Testing;
