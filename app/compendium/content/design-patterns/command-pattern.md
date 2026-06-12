---
title: "Command Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Command Pattern.md"
order: 5
---
**Command** turns a request or operation into a stand-alone object that can be stored, passed around, and invoked later. In essence, it encapsulates an action as an object. This decouples the object that invokes the operation from the one that knows how to execute it. Command is useful for implementing **undo/redo**, queuing operations, logging, or callbacks.

* **Intent:** *“Encapsulate a request as an object, thereby allowing for the parameterization of clients with different requests, and the queuing or logging of requests. It also allows for the support of undoable operations.”*
* **Use Cases:**

  * GUI buttons and menu items: the command to execute on click is encapsulated in a command object (e.g., an “OpenDocumentCommand”).
  * **Undo/Redo**: keep a stack of command objects that have `execute()` and an added `unexecute()` (undo) method, so you can call undo by reversing the command.
  * Task scheduling or job queues: you can queue command objects for later execution (possibly on worker threads).
  * Macro recording: user actions can be recorded as command objects and replayed.

**Example:** A simple text editor where commands implement undo/redo:

```typescript
// Command Interface
interface Command {
  execute(): void;
  undo(): void;
}

// Receiver class – the actual editor that knows how to perform operations
class TextEditor {
  text: string = "";
  append(txt: string) { this.text += txt; }
  deleteLast(n: number) { this.text = this.text.slice(0, -n); }
}

// Concrete Command: AppendTextCommand
class AppendTextCommand implements Command {
  private backupLength: number = 0;
  constructor(private editor: TextEditor, private textToAppend: string) {}
  execute(): void {
    // backup current length for undo
    this.backupLength = this.textToAppend.length;
    this.editor.append(this.textToAppend);
  }
  undo(): void {
    this.editor.deleteLast(this.backupLength);
  }
}

// Invoker: could be a button or menu in UI that triggers commands
class EditorInvoker {
  private history: Command[] = [];
  executeCommand(cmd: Command) {
    cmd.execute();
    this.history.push(cmd);
  }
  undoLast() {
    const cmd = this.history.pop();
    if (cmd) cmd.undo();
  }
}

// Usage:
const editor = new TextEditor();
const invoker = new EditorInvoker();

invoker.executeCommand(new AppendTextCommand(editor, "Hello "));
invoker.executeCommand(new AppendTextCommand(editor, "World!"));
console.log(editor.text);  // "Hello World!"
invoker.undoLast();
console.log(editor.text);  // "Hello " (after undoing last append)
```

Here, `AppendTextCommand` encapsulates the action of adding text to the editor. The `EditorInvoker` keeps a history of executed commands and can undo them by calling their `undo()` method. This decouples the UI or client code from the editor’s implementation of append/delete. If we had other commands (delete selection, format text, etc.), they would implement the same `Command` interface, making them interchangeable in the invoker/historic queue.

This example highlights two key features of Command:

1. We can treat **operations as first-class objects**, enabling easy extensibility (add new command classes without changing existing code) and flexible combinations (macros or conditional sequences).
2. Support for **undo/redo** is straightforward by storing state within the command (here we stored the `backupLength` to know what to undo).

The Command pattern is also commonly seen in frameworks where actions need to be queued or performed later (e.g., background tasks, or in game development where you might queue commands to networking or rendering subsystems).
