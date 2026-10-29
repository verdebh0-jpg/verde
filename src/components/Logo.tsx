/* eslint-disable @next/next/no-img-element */
export default function Logo({
  src,
  light = false,
  className = "",
}: {
  src?: string;
  light?: boolean;
  className?: string;
}) {
  if (src) return <img src={src} alt="Verde" className={`h-10 w-auto ${className}`} />;
  return (
    <span
      dir="ltr"
      className={`inline-block text-4xl font-semibold lowercase leading-none tracking-tight ${
        light ? "text-blush" : "text-verde"
      } ${className}`}
      style={{ fontFamily: "Jost, sans-serif" }}
    >
      verde
    </span>
  );
}
