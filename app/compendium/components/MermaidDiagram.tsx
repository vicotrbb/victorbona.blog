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
      darkMode: true,
      background: "#08110c",
      mainBkg: "#08110c",
      secondBkg: "#08110c",
      primaryColor: "#08110c",
      primaryTextColor: "#d8e8de",
      primaryBorderColor: "#1f5c3a",
      secondaryColor: "#08110c",
      secondaryTextColor: "#d8e8de",
      secondaryBorderColor: "#1f5c3a",
      tertiaryColor: "#020604",
      tertiaryTextColor: "#d8e8de",
      tertiaryBorderColor: "#1f5c3a",
      lineColor: "#6f8f7c",
      textColor: "#d8e8de",
      labelTextColor: "#d8e8de",
      nodeTextColor: "#d8e8de",
      noteBkgColor: "#08110c",
      noteTextColor: "#d8e8de",
      noteBorderColor: "#6f8f7c",
      actorBkg: "#08110c",
      actorBorder: "#1f5c3a",
      actorTextColor: "#d8e8de",
      actorLineColor: "#6f8f7c",
      signalColor: "#d8e8de",
      signalTextColor: "#d8e8de",
      edgeLabelBackground: "#08110c",
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
