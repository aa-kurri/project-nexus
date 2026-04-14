import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { FIBONACCI_ESTIMATOR, type UserStory } from "@nexus/shared-logic";

const Out = z.object({ points: z.enum(["1","2","3","5","8","13","21"]) });

export async function estimateFibonacci(story: UserStory): Promise<number> {
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: Out,
    system: FIBONACCI_ESTIMATOR,
    prompt: `Story:\n${JSON.stringify(story, null, 2)}\nReturn only the points.`,
    temperature: 0,
  });
  return Number(object.points);
}
