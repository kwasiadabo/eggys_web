// A soft field-like wave used to transition between sections.
export default function SectionWave({ className = '', flip = false }) {
  return (
    <svg
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`w-full h-10 sm:h-14 block ${flip ? 'rotate-180' : ''} ${className}`}
    >
      <path
        d="M0 24 C 240 54 480 0 720 20 C 960 40 1200 4 1440 26 L1440 60 L0 60 Z"
        fill="currentColor"
      />
    </svg>
  );
}
