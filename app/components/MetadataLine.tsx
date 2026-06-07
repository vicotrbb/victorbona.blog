type MetadataLineProps = {
  items: Array<string | number | undefined | null | false>;
  className?: string;
};

export function MetadataLine({ items, className = "" }: MetadataLineProps) {
  const visibleItems = items.filter(
    (item) =>
      item !== undefined && item !== null && item !== false && item !== ""
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <p
      className={`metadata-type flex flex-wrap gap-x-2 gap-y-1 text-[var(--color-muted-foreground)] ${className}`}
    >
      {visibleItems.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">/</span>}
          <span>{item}</span>
        </span>
      ))}
    </p>
  );
}
