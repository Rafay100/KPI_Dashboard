/**
 * Auth.js API Route Handler
 * Handles all authentication requests (/api/auth/*)
 */

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;
