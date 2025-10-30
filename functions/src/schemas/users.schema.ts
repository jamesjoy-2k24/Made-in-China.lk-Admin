import { z } from "zod";

export const UserDto = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  isVerified: z.boolean().default(false),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});
export type UserDtoT = z.infer<typeof UserDto>;
