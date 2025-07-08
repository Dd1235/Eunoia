Study Session App (Work in Progress)

My first React project (I have learnt React long back last year, but never worked on a proper project before) + first time using typescript. So excuse the design! I am passionate about the app I am making so hopefully these will be fixed.

## Known Issues and Solutions

### Todo List Editing Cursor Issue

**Problem:**
When editing a todo item in the Todo List, the cursor within the `textarea` (used for editing) would only appear at the end of the text, and clicking in the middle of the text area would not reposition the cursor. This made editing difficult.

**Root Cause:**
The `@dnd-kit` library, used for drag-and-drop functionality, was intercepting `onPointerDown` events on the `textarea` and `span` elements, preventing the browser's native cursor placement behavior.

**Solution:**
To resolve this, `onPointerDown={(e) => e.stopPropagation()}` was added to both the `textarea` (when in editing mode) and the `span` (when displaying the todo content). This explicitly stops the event propagation to `@dnd-kit`'s listeners, allowing the browser to handle cursor placement correctly.