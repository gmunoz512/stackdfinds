import { z } from "zod";

// Common validators
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be less than 72 characters");

export const phoneSchema = z
  .string()
  .max(20, "Phone must be less than 20 characters")
  .regex(/^[\d\s\-\+\(\)]*$/, "Please enter a valid phone number")
  .optional()
  .or(z.literal(""));

export const nameSchema = z
  .string()
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s\-']*$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
  .optional()
  .or(z.literal(""));

export const citySchema = z
  .string()
  .max(100, "City must be less than 100 characters")
  .regex(/^[a-zA-Z\s\-']*$/, "City can only contain letters, spaces, hyphens, and apostrophes")
  .optional()
  .or(z.literal(""));

export const zipCodeSchema = z
  .string()
  .max(10, "Zip code must be less than 10 characters")
  .regex(/^[\d\-\s]*$/, "Please enter a valid zip code")
  .optional()
  .or(z.literal(""));

// Auth form schema
export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type AuthFormData = z.infer<typeof authSchema>;

// Profile form schema
export const profileSchema = z.object({
  full_name: nameSchema,
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema,
  city: citySchema,
  zip_code: zipCodeSchema,
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Vendor form schema
export const vendorSchema = z.object({
  vendorName: z
    .string()
    .min(1, "Vendor name is required")
    .max(100, "Vendor name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-'&.]*$/, "Vendor name contains invalid characters"),
  vendorEmail: emailSchema,
  category: z
    .string()
    .min(1, "Please select a category"),
  commission: z
    .string()
    .min(1, "Commission is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Commission must be between 0 and 100"),
  recommendation: z
    .string()
    .min(10, "Please provide at least 10 characters")
    .max(1000, "Recommendation must be less than 1000 characters"),
});

export type VendorFormData = z.infer<typeof vendorSchema>;
