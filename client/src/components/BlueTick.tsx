interface BlueTickProps {
  size?: number;
  className?: string;
}

export default function BlueTick({ size = 16, className = "" }: BlueTickProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-label="Verified"
    >
      <title>Verified student</title>
      <circle cx="12" cy="12" r="12" fill="#1d9bf0" />
      <path
        d="M6.5 12.5L10 16L17.5 8.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
