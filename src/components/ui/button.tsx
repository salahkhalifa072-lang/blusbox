import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

// One rule from §6: --blusrood is the primary action and appears once
// per screen. Only one primary button per view.
const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-6 py-3 text-sm font-medium transition-colors duration-150";

const variants: Record<Variant, string> = {
  primary: "bg-blusrood text-kastwit hover:bg-[#b81e1b]",
  secondary:
    "border border-antraciet text-antraciet hover:bg-antraciet hover:text-kastwit",
  ghost: "text-antraciet underline underline-offset-4 hover:text-staal-tekst",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant }) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { variant?: Variant }) {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
