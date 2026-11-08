import "server-only";
import type { AssistantConfig as PrismaAssistantConfig } from "@prisma/client";
import type {
  AssistantConfig as AssistantConfigDto,
  AssistantConfigInput,
} from "@/lib/contracts/admin";
import { DEFAULT_ASSISTANT_CONFIG, DEFAULT_ASSISTANT_CONFIG_ID } from "@/server/ai/defaults";
import { prisma } from "@/server/db/prisma";

function toAssistantConfigDto(config: PrismaAssistantConfig): AssistantConfigDto {
  return {
    id: config.id,
    name: config.name,
    systemPrompt: config.systemPrompt,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    updatedAt: config.updatedAt.toISOString(),
    updatedById: config.updatedById,
  };
}

async function ensureAssistantConfig(): Promise<PrismaAssistantConfig> {
  return prisma.assistantConfig.upsert({
    where: { id: DEFAULT_ASSISTANT_CONFIG_ID },
    update: {},
    create: {
      id: DEFAULT_ASSISTANT_CONFIG_ID,
      ...DEFAULT_ASSISTANT_CONFIG,
      updatedById: null,
    },
  });
}

export async function getAssistantConfig(): Promise<AssistantConfigDto> {
  const config = await ensureAssistantConfig();
  return toAssistantConfigDto(config);
}

export async function updateAssistantConfig(
  input: AssistantConfigInput,
  actorId: string,
): Promise<AssistantConfigDto> {
  const config = await prisma.assistantConfig.upsert({
    where: { id: DEFAULT_ASSISTANT_CONFIG_ID },
    update: {
      ...input,
      updatedById: actorId,
    },
    create: {
      id: DEFAULT_ASSISTANT_CONFIG_ID,
      ...input,
      updatedById: actorId,
    },
  });

  return toAssistantConfigDto(config);
}
