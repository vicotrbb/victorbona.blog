"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid/dist/mermaid.esm.mjs";

type MermaidDiagramProps = {
  code: string;
};

let mermaidInitialized = false;

function initializeMermaid() {
  if (mermaidInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: {
      darkMode: false,
      background: "transparent",
      mainBkg: "#f8fafc",
      secondBkg: "#f1f5f9",
      primaryColor: "#f8fafc",
      primaryTextColor: "#111827",
      primaryBorderColor: "#475569",
      secondaryColor: "#f1f5f9",
      secondaryTextColor: "#111827",
      secondaryBorderColor: "#64748b",
      tertiaryColor: "#e0f2fe",
      tertiaryTextColor: "#111827",
      tertiaryBorderColor: "#64748b",
      lineColor: "#334155",
      textColor: "#111827",
      labelTextColor: "#111827",
      nodeTextColor: "#111827",
      noteTextColor: "#111827",
      actorBkg: "#f8fafc",
      actorBorder: "#475569",
      actorTextColor: "#111827",
      actorLineColor: "#475569",
      signalColor: "#111827",
      signalTextColor: "#111827",
      edgeLabelBackground: "#f8fafc",
      fontFamily: "inherit",
    },
  });

  mermaidInitialized = true;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const reactId = useId();
  const renderCountRef = useRef(0);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const stableDiagramPrefix = `compendium-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    let isMounted = true;

    async function renderDiagram() {
      renderCountRef.current += 1;
      const diagramId = `${stableDiagramPrefix}-${renderCountRef.current}`;

      setIsLoading(true);
      setError(null);
      setSvg("");

      try {
        initializeMermaid();
        const result = await mermaid.render(diagramId, code);

        if (!isMounted) return;
        setSvg(result.svg);
      } catch (caught) {
        if (!isMounted) return;

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to render Mermaid diagram."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code, stableDiagramPrefix]);

  if (error) {
    return (
      <figure className="compendium-mermaid compendium-mermaid--fallback">
        <figcaption>Diagram failed to render: {error}</figcaption>
        <pre>
          <code>{code}</code>
        </pre>
      </figure>
    );
  }

  return (
    <figure
      className="compendium-mermaid"
      aria-busy={isLoading}
      data-loading={isLoading ? "true" : "false"}
    >
      {isLoading && (
        <div className="compendium-mermaid__loading">Rendering diagram...</div>
      )}
      {svg && (
        <div
          className="compendium-mermaid__viewport"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </figure>
  );
}
