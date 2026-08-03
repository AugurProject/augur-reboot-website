import { defineCollection, z } from "astro:content";
import {
	LEARN_CONTENT_TYPES,
	LEARN_PRESENTATIONS,
	LEARN_STATUSES,
} from "../lib/learn";

const learnCollection = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		topic: z.string().min(1),
		order: z.number().int().nonnegative(),
		contentType: z.enum(LEARN_CONTENT_TYPES),
		label: z.string().min(1),
		historical: z.boolean(),
		status: z.enum(LEARN_STATUSES),
		presentation: z.enum(LEARN_PRESENTATIONS),
	}),
});

const blogCollection = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		author: z.string(),
		publishDate: z.date(),
		updatedDate: z.date().optional(),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = {
	learn: learnCollection,
	blog: blogCollection,
};
