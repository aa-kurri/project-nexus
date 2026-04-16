import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const WEBAUTHN_CHALLENGE_PREFIX = "webauthn:challenge:";

export async function storeChallenge(staffId: string, challenge: string) {
  await redis.set(`${WEBAUTHN_CHALLENGE_PREFIX}${staffId}`, challenge, "EX", 120);
}

export async function getAndClearChallenge(staffId: string): Promise<string | null> {
  const challenge = await redis.get(`${WEBAUTHN_CHALLENGE_PREFIX}${staffId}`);
  if (challenge) {
    await redis.del(`${WEBAUTHN_CHALLENGE_PREFIX}${staffId}`);
  }
  return challenge;
}
