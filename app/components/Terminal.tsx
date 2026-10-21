"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { runCommand } from "app/lib/terminal";
import { loadIndex } from "app/lib/load-index";

type Line = { text: string; input?: boolean };

const greeting: Line[] = [{ text: "type help for commands · esc to close" }];

function typingInField(el: Element | null) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

export function Terminal() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [lines, setLines] = useState<Line[]>(greeting);
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1); // -1 = editing a fresh line

  const open = () => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    input.current?.focus();
    void loadIndex();
  };
  const close = () => dialog.current?.close();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
      } else if (e.key === ":" && !e.metaKey && !e.ctrlKey && !e.altKey && !dialog.current?.open && !typingInField(document.activeElement)) {
        e.preventDefault();
        open();
      }
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-terminal-open]")) open();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
  }, [lines]);

  const submit = async () => {
    const cmd = value;
    const result = runCommand(cmd, await loadIndex());
    const echo: Line = { text: cmd, input: true };
    if (cmd.trim()) setHistory((h) => [...h, cmd]);
    setCursor(-1);
    setValue("");
    if (result.kind === "print") {
      setLines((l) => [...l, echo, ...result.lines.map((text) => ({ text }))]);
    } else if (result.kind === "navigate") {
      setLines((l) => [...l, echo, { text: result.echo }]);
      router.push(result.href);
      close();
    } else {
      setLines((l) => [...l, echo, { text: `→ ${result.href}` }]);
      window.location.href = result.href;
    }
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setValue(history[next]);
    } else if (e.key === "ArrowDown" && cursor !== -1) {
      e.preventDefault();
      const next = cursor + 1;
      setCursor(next < history.length ? next : -1);
      setValue(next < history.length ? history[next] : "");
    }
  };

  // Keep Tab inside the panel: the input and the close button are its only stops.
  const onDialogKey = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const stops = dialog.current?.querySelectorAll<HTMLElement>("input, button");
    if (!stops?.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-label="Command terminal"
      onKeyDown={onDialogKey}
      onClick={(e) => e.target === dialog.current && close()}
      className="terminal m-0 mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-0 font-mono text-sm text-[var(--text)] shadow-[0_24px_64px_-12px_rgb(0_0_0/0.8)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2 text-xs text-[var(--dim)]">
        <span>victor-bona · terminal</span>
        <button
          type="button"
          onClick={close}
          className="-mr-2 min-h-8 px-2 text-[var(--dim)] transition-colors duration-150 hover:text-[var(--text)]"
        >
          esc<span className="sr-only"> close terminal</span>
        </button>
      </div>
      <div
        ref={scroll}
        role="log"
        aria-live="polite"
        className="max-h-[50vh] overflow-y-auto px-4 pt-3 [scrollbar-color:var(--line-strong)_var(--panel)]"
      >
        {lines.map((line, i) => (
          <p key={i} className={`whitespace-pre-wrap break-words leading-6 ${line.input ? "text-[var(--text)]" : "text-[var(--dim)]"}`}>
            {line.input && <span aria-hidden="true" className="terminal-glow mr-2 text-[var(--lit)]">$</span>}
            {line.text}
          </p>
        ))}
      </div>
      <form
        className="flex items-center gap-2 px-4 pb-4 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <span aria-hidden="true" className="terminal-glow font-bold text-[var(--lit)]">$</span>
        <input
          ref={input}
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setCursor(-1);
          }}
          onKeyDown={onInputKey}
          aria-label="Command"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="cd papers"
          className="min-h-8 flex-1 bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--dim)]"
        />
      </form>
    </dialog>
  );
}
