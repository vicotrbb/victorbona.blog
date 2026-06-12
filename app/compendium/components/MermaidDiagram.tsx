"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

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
      background: "transparent",
      primaryColor: "transparent",
      primaryTextColor: "currentColor",
      primaryBorderColor: "currentColor",
      lineColor: "currentColor",
      secondaryColor: "transparent",
      tertiaryColor: "transparent",
      fontFamily: "inherit",
    },
  });

  mermaidInitialized = true;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const diagramId = `compendium-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    async function renderDiagram() {
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
  }, [code, reactId]);

  if (error) {
    return (
      <figure className="compendium-mermaid compendium-mermaid--fallback">
        <figcaption>Diagram failed to render. Showing source.</figcaption>
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
