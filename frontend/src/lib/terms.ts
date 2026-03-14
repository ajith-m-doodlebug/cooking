/**
 * Shared parsing for Terms & Conditions content so numbered clauses (1. ... 2. ...)
 * render as a list on both login and /terms pages.
 */

export interface TermsSection {
  number: number;
  title: string;
  body: string;
}

/** Split plain-text numbered sections (1. ... 2. ...) into list items. */
export function parseTermsSections(content: string): TermsSection[] {
  const trimmed = content.trim().replace(/\r\n/g, "\n");
  if (!trimmed) return [];
  const sections: TermsSection[] = [];
  const segments = trimmed.split(/(?=\d+\.\s+)/).map((s) => s.trim()).filter(Boolean);
  for (const segment of segments) {
    const leadMatch = segment.match(/^(\d+)\.\s+(.*)/s);
    if (!leadMatch) continue;
    const num = parseInt(leadMatch[1], 10);
    const afterNumber = (leadMatch[2] ?? "").trim();
    let title: string;
    let body: string;
    const firstNewline = afterNumber.indexOf("\n");
    if (firstNewline >= 0) {
      title = afterNumber.slice(0, firstNewline).trim();
      body = afterNumber.slice(firstNewline).replace(/^\n+|\n+$/g, "").trim();
    } else {
      const words = afterNumber.split(/\s+/).filter(Boolean);
      const take = words.length >= 3 && words[2] === "and" ? 4 : 3;
      title = words.slice(0, Math.min(take, words.length)).join(" ");
      body = words.length > take ? words.slice(take).join(" ").trim() : "";
    }
    if (!title) title = `Section ${num}`;
    sections.push({ number: num, title, body });
  }
  if (sections.length > 0) return sections;
  const fallback = trimmed.split(/\n\s*\n/).filter(Boolean);
  return fallback.map((block, i) => {
    const firstLine = block.indexOf("\n") >= 0 ? block.slice(0, block.indexOf("\n")) : block;
    const rest = block.slice(firstLine.length).trim();
    return { number: i + 1, title: firstLine.replace(/^\d+\.\s*/, ""), body: rest };
  });
}

export function isHtml(content: string): boolean {
  return /<\s*[a-z]/i.test(content);
}

export function hasNumberedSections(content: string): boolean {
  return /\d+\.\s+\S/.test(content);
}

export function getTermsSections(content: string): TermsSection[] {
  if (isHtml(content) || !hasNumberedSections(content)) return [];
  return parseTermsSections(content);
}
