import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { highlight } from "sugar-high";
import React, { Children, isValidElement, type ReactNode } from "react";
import { MermaidDiagram } from "./MermaidDiagram";

type CompendiumMdxProps = {
  source: string;
  options?: any;
  components?: Record<string, React.ComponentType<any>>;
};

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

function slugifyHeading(value: string) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getUniqueHeadingId(heading: string, counts: Map<string, number>) {
  const baseId = slugifyHeading(heading);
  const count = counts.get(baseId) ?? 0;
  counts.set(baseId, count + 1);

  return count === 0 ? baseId : `${baseId}-${count}`;
}

function createHeading(
  level: number,
  counts: Map<string, number>,
  useTocDuplicateIds: boolean
) {
  const Heading = ({ children }: { children?: ReactNode }) => {
    const text = getTextContent(children);
    const slug = useTocDuplicateIds
      ? getUniqueHeadingId(text, counts)
      : slugifyHeading(text);

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

  Heading.displayName = `CompendiumHeading${level}`;

  return Heading;
}

function CustomLink({
  href = "",
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function Code({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const code = getTextContent(children);

  if (className?.includes("language-mermaid")) {
    return <code className={className}>{children}</code>;
  }

  const codeHTML = highlight(code);

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

function createComponents() {
  const tocHeadingCounts = new Map<string, number>();

  return {
    h1: createHeading(1, tocHeadingCounts, false),
    h2: createHeading(2, tocHeadingCounts, true),
    h3: createHeading(3, tocHeadingCounts, true),
    h4: createHeading(4, tocHeadingCounts, false),
    h5: createHeading(5, tocHeadingCounts, false),
    h6: createHeading(6, tocHeadingCounts, false),
    a: CustomLink,
    code: Code,
    pre: Pre,
  };
}

export function CompendiumMdx({ components, ...props }: CompendiumMdxProps) {
  return (
    <MDXRemote
      {...props}
      options={{
        ...props.options,
        mdxOptions: {
          ...props.options?.mdxOptions,
          remarkPlugins: [
            remarkGfm,
            remarkMath,
            ...(props.options?.mdxOptions?.remarkPlugins || []),
          ],
          rehypePlugins: [
            rehypeKatex,
            ...(props.options?.mdxOptions?.rehypePlugins || []),
          ],
        },
      }}
      components={{ ...createComponents(), ...(components || {}) }}
    />
  );
}
