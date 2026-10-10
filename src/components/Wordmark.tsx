/**
 * The brand signature. The slash is the one place the accent colour appears in
 * the header, so it carries the mark rather than a logo file.
 */
export default function Wordmark({
  className = '',
  slashClassName = 'text-ember',
  atelier = false,
  atelierClassName = '',
}: {
  className?: string;
  slashClassName?: string;
  atelier?: boolean;
  atelierClassName?: string;
}) {
  const mark = (
    <span className={className}>
      BE<span className={slashClassName}>/</span>OND
    </span>
  );

  if (!atelier) return mark;

  return (
    <span className="flex flex-col items-center">
      {mark}
      <span className={`block lowercase ${atelierClassName}`}>atelier</span>
    </span>
  );
}
