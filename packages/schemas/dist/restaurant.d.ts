import { z } from 'zod';
export declare const createRestaurantSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    price_range: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    descriptors: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    menu_items: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateRestaurantSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    price_range: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    descriptors: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    menu_items: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
//# sourceMappingURL=restaurant.d.ts.map