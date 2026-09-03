import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// This deployment is shared. Every table owned by cutly starts with cutly_.
export default defineSchema({
  cutly_projects: defineTable({ ownerKey: v.string(), title: v.string(), createdAt: v.number(), updatedAt: v.number(), settings: v.object({ speed: v.number(), captions: v.string(), captionsEnabled: v.boolean(), musicVolume: v.number() }) }).index("by_owner_updated", ["ownerKey", "updatedAt"]),
});
