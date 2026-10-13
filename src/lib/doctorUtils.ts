/**
 * Helper utility to format physician designation consistently.
 * Defaults to "Dr. B" and respects customized callsigns seamlessly.
 */
export const formatDoctorName = (name?: string): string => {
  const clean = (name || "B").trim();
  if (!clean) return "Dr. B";
  if (clean.toLowerCase().startsWith("dr.") || clean.toLowerCase().startsWith("dr ")) {
    return clean;
  }
  return `Dr. ${clean}`;
};

/**
 * Returns initials or monogram letter for map pins and beacons (e.g. "B" or "A")
 */
export const getDoctorMonogram = (name?: string): string => {
  const clean = (name || "B").trim();
  const stripped = clean.replace(/^dr\.?\s*/i, "").trim();
  return (stripped.charAt(0) || "B").toUpperCase();
};
