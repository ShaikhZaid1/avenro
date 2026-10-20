export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** paise -> "₹1,799" */
export const inr = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN");
