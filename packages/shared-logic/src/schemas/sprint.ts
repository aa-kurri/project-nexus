import { z } from "zod";

export const FibonacciPoints = [1, 2, 3, 5, 8, 13, 21] as const;
export const StoryPointSchema = z.enum(["1","2","3","5","8","13","21"]).transform(Number);

export const TaskSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  storyPoints: z.number().refine(n => (FibonacciPoints as readonly number[]).includes(n)),
  requirementSlug: z.string(),
});

export const SprintSchema = z.object({
  number: z.number().int().positive(),
  goal: z.string(),
  startsOn: z.string(),
  endsOn: z.string(),
  capacityPts: z.number().default(30),
  tasks: z.array(TaskSchema),
});
export type Sprint = z.infer<typeof SprintSchema>;

export const RoadmapSchema = z.object({
  mermaid: z.string(),
  sprints: z.array(SprintSchema),
});
