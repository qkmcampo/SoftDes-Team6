function BrandLogo({
  className = "h-14 w-14",
  primary = "#050725",
  accent = "#F9B672",
  title = "Financial Tracker",
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <path
        d="M93 22C83 13.5 70.8 9 57.8 9C27.9 9 9 31 9 60C9 89 27.9 111 57.8 111C71.1 111 83.6 106.2 93.7 97.2"
        stroke={primary}
        strokeWidth="10"
        strokeLinecap="round"
      />

      <path
        d="M99 60H75"
        stroke={primary}
        strokeWidth="8"
        strokeLinecap="round"
      />

      <path
        d="M89 32C81.9 25.1 72.2 21 61.6 21C40.9 21 26 38.1 26 60C26 81.9 40.9 99 61.6 99C72 99 81.5 94.9 88.6 88.1"
        stroke={primary}
        strokeWidth="8"
        strokeLinecap="round"
      />

      <path
        d="M51 30V111"
        stroke={primary}
        strokeWidth="10"
        strokeLinecap="round"
      />

      <path
        d="M51 38H67C78.3 38 85 44.1 85 53.5C85 63.1 78.3 69 67 69H51"
        stroke={primary}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M37 52H65"
        stroke={primary}
        strokeWidth="8"
        strokeLinecap="round"
      />

      <path
        d="M37 62H65"
        stroke={primary}
        strokeWidth="8"
        strokeLinecap="round"
      />

      <path
        d="M58 92C69.6 92 80.8 88.5 90 82"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default BrandLogo;
