import { z } from 'zod';

export const createRestaurantSchema = z.object({
  name: z.string().min(1).max(127),
  address: z.string().max(127).nullish(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rating: z.number().int().min(1).max(10).nullish(),
  price_range: z.number().int().min(1).max(5).nullish(),
  descriptors: z.array(z.string().max(100)).max(20).nullish(),
  menu_items: z.array(z.string().max(200)).max(100).nullish(),
  notes: z.string().max(5000).nullish(),
});

export const updateRestaurantSchema = z
  .object({
    name: z.string().min(1).max(127).optional(),
    address: z.string().max(127).nullish(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    rating: z.number().int().min(1).max(10).nullish(),
    price_range: z.number().int().min(1).max(5).nullish(),
    descriptors: z.array(z.string().max(100)).max(20).nullish(),
    menu_items: z.array(z.string().max(200)).max(100).nullish(),
    notes: z.string().max(5000).nullish(),
  })
  .refine(
    (data) => (data.latitude === undefined) === (data.longitude === undefined),
    { message: 'latitude and longitude must be provided together' }
  );

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
