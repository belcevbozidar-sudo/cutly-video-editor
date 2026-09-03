import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({ args: { ownerKey: v.string() }, handler: async (ctx, { ownerKey }) => ctx.db.query("cutly_projects").withIndex("by_owner_updated", (q) => q.eq("ownerKey", ownerKey)).order("desc").take(30) });
export const upsert = mutation({ args: { ownerKey: v.string(), title: v.string(), settings: v.object({ speed: v.number(), captions: v.string(), captionsEnabled: v.boolean(), musicVolume: v.number() }) }, handler: async (ctx, args) => { const existing = await ctx.db.query("cutly_projects").withIndex("by_owner_updated", (q) => q.eq("ownerKey", args.ownerKey)).first(); const now = Date.now(); if (existing) { await ctx.db.patch(existing._id, { title: args.title, settings: args.settings, updatedAt: now }); return existing._id; } return ctx.db.insert("cutly_projects", { ...args, createdAt: now, updatedAt: now }); } });
