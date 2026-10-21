import Link from "next/link";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React, { Children, isValidElement, type ReactNode } from "react";
import { MermaidDiagram } from "app/compendium/components/MermaidDiagram";

function Table({ data }) {
  let headers = data.headers.map((header, index) => (
    <th key={index}>{header}</th>
  ));
  let rows = data.rows.map((row, index) => (
    <tr key={index}>
      {row.map((cell, cellIndex) => (
        <td key={cellIndex}>{cell}</td>
      ))}
    </tr>
  ));

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function CustomLink(props) {
  let href = props.href;

  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props) {
  return <Image alt={props.alt} className="rounded-lg" {...props} />;
}

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }

  return "";
}

function Code({ children, className, ...props }) {
  if (className?.includes("language-mermaid")) {
    return <code className={className}>{children}</code>;
  }

  let codeHTML = highlight(getTextContent(children));
  return (
    <code
      className={className}
      dangerouslySetInnerHTML={{ __html: codeHTML }}
      {...props}
    />
  );
}

function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  if (Children.count(children) !== 1) {
    return <pre {...props}>{children}</pre>;
  }

  const child = Children.only(children);

  if (
    isValidElement<{ className?: string; children?: ReactNode }>(child) &&
    child.props.className?.includes("language-mermaid")
  ) {
    return <MermaidDiagram code={getTextContent(child.props.children)} />;
  }

  return <pre {...props}>{children}</pre>;
}

// Same slug rules as app/compendium so heading ids and TOC links agree.
function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createHeading(level: number, counts: Map<string, number>) {
  const Heading = ({ children }: { children?: ReactNode }) => {
    const text = getTextContent(children);
    const baseId = slugifyHeading(text);
    const count = counts.get(baseId) ?? 0;
    counts.set(baseId, count + 1);
    const slug = count === 0 ? baseId : `${baseId}-${count}`;

    return React.createElement(
      `h${level}`,
      { id: slug },
      [
        React.createElement("a", {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: "anchor",
          "aria-label": `Link to ${text}`,
        }),
      ],
      children
    );
  };

  Heading.displayName = `Heading${level}`;

  return Heading;
}

let components = {
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  pre: Pre,
  Table,
};

// Fresh counts per render so duplicate headings get stable -1, -2 suffixes.
function headings() {
  const counts = new Map<string, number>();
  return Object.fromEntries([1, 2, 3, 4, 5, 6].map((level) => [`h${level}`, createHeading(level, counts)]));
}

export function CustomMDX(props) {
  return (
    <MDXRemote
      {...props}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [rehypeKatex],
        },
      }}
      components={{ ...components, ...headings(), ...(props.components || {}) }}
    />
  );
}
