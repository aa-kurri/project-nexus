import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import {
  UserStorySchema,
  SYSTEM_ARCHITECT,
  GHERKIN_USER_TEMPLATE,
} from "@nexus/shared-logic";

const StoriesSchema = z.object({ stories: z.array(UserStorySchema) });

export async function generateGherkinStories(epic: unknown) {
  const { object } = await generateObject({
    model: anthropic("claude-opus-4-6", { cacheControl: true }),
    schema: StoriesSchema,
    system: SYSTEM_ARCHITECT,
    prompt: GHERKIN_USER_TEMPLATE(JSON.stringify(epic)),
    temperature: 0.4,
  });
  return object.stories;
}
