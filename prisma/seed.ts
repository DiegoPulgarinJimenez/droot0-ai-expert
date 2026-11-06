import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient, Role } from "@prisma/client";
import { DEFAULT_ASSISTANT_CONFIG, DEFAULT_ASSISTANT_CONFIG_ID } from "../src/server/ai/defaults";

const prisma = new PrismaClient(
  process.env.DIRECT_URL
    ? {
        datasources: {
          db: {
            url: process.env.DIRECT_URL,
          },
        },
      }
    : undefined,
);

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function findAuthUserByEmail(supabase: SupabaseClient, email: string) {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function main() {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const email = requiredEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requiredEnv("SEED_ADMIN_PASSWORD");
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrator";

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must contain at least 8 characters.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  let authUserId: string;

  if (createError) {
    if (!/already/i.test(createError.message)) {
      throw createError;
    }

    const existingUser = await findAuthUserByEmail(supabase, email);

    if (!existingUser) {
      throw new Error(`Could not find the existing Supabase Auth user for ${email}.`);
    }

    authUserId = existingUser.id;
  } else {
    if (!created.user) {
      throw new Error("Supabase did not return the created user.");
    }

    authUserId = created.user.id;
  }

  const admin = await prisma.user.upsert({
    where: { id: authUserId },
    update: {
      email,
      name,
      role: Role.ADMIN,
    },
    create: {
      id: authUserId,
      email,
      name,
      role: Role.ADMIN,
    },
  });

  await prisma.assistantConfig.upsert({
    where: { id: DEFAULT_ASSISTANT_CONFIG_ID },
    update: {},
    create: {
      id: DEFAULT_ASSISTANT_CONFIG_ID,
      ...DEFAULT_ASSISTANT_CONFIG,
      updatedById: admin.id,
    },
  });

  console.log(`Seeded ADMIN user: ${admin.email} (${admin.id})`);
  console.log(`Seeded assistant configuration: ${DEFAULT_ASSISTANT_CONFIG_ID}`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
