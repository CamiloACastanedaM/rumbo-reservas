// Rumbo isotype: three contour lines of a hill and a compass needle pointing the way.
export default function Isotype({ className, title }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true} aria-label={title}>
      <rect width="64" height="64" rx="14" fill="#F6F8F2" />
      <g fill="none" stroke="#17402F" strokeWidth="3" strokeLinejoin="round">
        <path d="M9 40C9 23 22 12 35 13.5C49 15 56 26 54.5 38C53 49 42 55 30 54C18 53 9 49 9 40Z" />
        <path d="M17.5 38.5C17.5 28 26 21 35 22.5C43.5 24 47.5 31 46 38.5C44.5 45.5 37 48.5 29.5 47.5C22 46.5 17.5 44 17.5 38.5Z" />
        <path d="M26.5 37C26.5 32.5 30.5 30 34.5 30.8C38.5 31.6 39.5 35 38.5 38C37.5 40.8 34 41.8 31 41.2C28 40.6 26.5 39.4 26.5 37Z" />
      </g>
      <path d="M52 12L40.9 34.7L28 46L34.3 30.1Z" fill="#C0185E" />
      <circle cx="37.6" cy="32.4" r="1.7" fill="#F6F8F2" />
    </svg>
  )
}
