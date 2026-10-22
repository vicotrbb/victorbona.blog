import { profile } from "app/lib/profile";

const variants = {
  hero: "border border-[var(--lit)] px-5 py-3 text-lg font-semibold [text-shadow:0_0_14px_rgb(77_255_143/0.55)] hover:bg-[var(--lit)] hover:text-black hover:[text-shadow:none]",
  inline: "font-semibold hover:underline decoration-1 underline-offset-4",
};

export function ContactCommand({ variant }: { variant: "hero" | "inline" }) {
  return (
    <a
      href={`mailto:${profile.email}`}
      className={`inline-flex max-w-full flex-wrap items-baseline gap-x-2 font-mono text-[var(--lit)] transition-colors duration-150 ${variants[variant]}`}
    >
      <span aria-hidden="true">$</span>
      <span>contact</span>
      <span className={variant === "inline" ? "font-normal text-[var(--dim)]" : "sr-only"}>{profile.email}</span>
    </a>
  );
}
