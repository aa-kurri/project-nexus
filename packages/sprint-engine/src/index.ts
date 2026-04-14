import { addDays, format } from "date-fns";
import type { Sprint } from "@nexus/shared-logic";

export interface EstimatedStory {
  slug: string;
  title: string;
  description: string;
  storyPoints: number;
  requirementSlug: string;
  priority?: "p0" | "p1" | "p2" | "p3";
}

export interface PackOptions {
  startDate: Date;
  capacityPts?: number;
  sprintLengthDays?: number;
}

/** Bin-pack stories into sprints, respecting priority order and capacity. */
export function packSprints(stories: EstimatedStory[], opts: PackOptions): Sprint[] {
  const { startDate, capacityPts = 30, sprintLengthDays = 14 } = opts;

  const sorted = [...stories].sort((a, b) => {
    const pa = priorityWeight(a.priority);
    const pb = priorityWeight(b.priority);
    return pa !== pb ? pa - pb : b.storyPoints - a.storyPoints;
  });

  const sprints: Sprint[] = [];
  let current: Sprint | null = null;
  let cursor = startDate;

  for (const s of sorted) {
    if (!current || current.tasks.reduce((n, t) => n + t.storyPoints, 0) + s.storyPoints > capacityPts) {
      if (current) sprints.push(current);
      const ends = addDays(cursor, sprintLengthDays - 1);
      current = {
        number: sprints.length + 1,
        goal: `Deliver ${s.title}`,
        startsOn: format(cursor, "yyyy-MM-dd"),
        endsOn: format(ends, "yyyy-MM-dd"),
        capacityPts,
        tasks: [],
      };
      cursor = addDays(ends, 1);
    }
    current.tasks.push({
      slug: s.slug,
      title: s.title,
      description: s.description,
      storyPoints: s.storyPoints,
      requirementSlug: s.requirementSlug,
    });
  }
  if (current) sprints.push(current);
  return sprints;
}

/** Produce a Mermaid gantt roadmap. */
export function renderRoadmap(sprints: Sprint[], projectTitle = "Roadmap"): string {
  const lines: string[] = [
    "gantt",
    `  title ${projectTitle}`,
    "  dateFormat YYYY-MM-DD",
    "  axisFormat %b %d",
  ];
  for (const sp of sprints) {
    lines.push(`  section Sprint ${sp.number}`);
    for (const t of sp.tasks) {
      const safe = t.title.replace(/:/g, "—").slice(0, 60);
      lines.push(`    ${safe} :${sp.startsOn}, ${sp.endsOn}`);
    }
  }
  return lines.join("\n");
}

function priorityWeight(p?: "p0"|"p1"|"p2"|"p3") {
  return { p0: 0, p1: 1, p2: 2, p3: 3 }[p ?? "p2"];
}
