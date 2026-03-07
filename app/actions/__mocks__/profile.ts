import { fn } from "storybook/test";

export const submitProfileForm = fn()
  .mockName("submitProfileForm")
  .mockResolvedValue(undefined);

export const upsertProfile = fn().mockName("upsertProfile");
