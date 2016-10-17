export function kebab(name: string): string {
  return name.replace(/([A-Z])/g, (match, p1) => "-" + p1.toLowerCase()).replace(/^-/, "");
}
