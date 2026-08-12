const palettes = [
  {
    container:
      "bg-primary-fixed border-l-primary-fixed-dim dark:bg-primary-container dark:border-l-primary-fixed-dim",
    title: "text-on-primary-fixed dark:text-on-primary",
    sub: "text-on-primary-fixed-variant dark:text-on-primary-container",
  },
  {
    container:
      "bg-secondary-fixed border-l-secondary-fixed-dim dark:bg-secondary-container dark:border-l-secondary-fixed-dim",
    title: "text-on-secondary-fixed dark:text-white",
    sub: "text-on-secondary-fixed-variant dark:text-on-primary-container",
  },
  {
    container:
      "bg-tertiary-fixed border-l-tertiary-fixed-dim dark:bg-tertiary-container dark:border-l-tertiary-fixed-dim",
    title: "text-on-tertiary-fixed dark:text-on-tertiary",
    sub: "text-on-tertiary-fixed-variant dark:text-on-primary-container",
  },
  {
    container:
      "bg-error-container border-l-error dark:bg-error-container dark:border-l-error",
    title: "text-on-error-container dark:text-on-error-container",
    sub: "text-on-error-container dark:text-on-error-container",
  },
];

export function getSlotPalette(courseCode) {
  if (!courseCode) return palettes[0];

  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = (hash * 31 + courseCode.charCodeAt(i)) % 997;
  }

  return palettes[hash % palettes.length];
}

/** Legacy helper used by the mobile list cells — returns the full class string. */
export function getCourseStyle(courseCode) {
  const p = getSlotPalette(courseCode);
  return `${p.container} ${p.title}`;
}

export default getCourseStyle;
