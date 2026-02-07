import Fastify from "fastify";
import {
    zUpdateInventoryRequest,
    zUpdateInventoryResponse,
} from "@tfm/contracts";

import { UpdateInventoryUseCase } from "../../application/use-cases/update-inventory/update-inventory.usecase";
import { InMemoryInventoryRepository } from "../../infrastructure/persistence/in-memory/in-memory-inventory-repository";
import { PrismaInventoryRepository } from "../../infrastructure/persistence/prisma/prisma-inventory-repository";
import { PrismaRecipeRepository } from "../../infrastructure/persistence/prisma/prisma-recipe-repository";
import { toUpdateInventoryInput, toUpdateInventoryResponse } from "../mappers/update-inventory.mapper";
import { InMemoryRecipeRepository } from "../../infrastructure/persistence/in-memory/in-memory-recipe-repository";
import { GenerateDailySuggestionUseCase } from "../../application/use-cases/generate-daily-suggestion/generate-daily-suggestion.usecase";
import {
    toGenerateDailySuggestionInput,
    toGenerateDailySuggestionResponse,
} from "../mappers/daily-suggestion.mapper";

import {
    zGenerateDailySuggestionRequest,
    zGenerateDailySuggestionResponse,
} from "@tfm/contracts";

import {
    zGenerateShoppingListRequest,
    zGenerateShoppingListResponse,
} from "@tfm/contracts";

import { GenerateShoppingListUseCase } from "../../application/use-cases/generate-shopping-list/generate-shopping-list.usecase";
import {
    toGenerateShoppingListInput,
    toGenerateShoppingListResponse,
} from "../mappers/shopping-list.mapper";
import {
    zGenerateShoppingListFromRecipesRequest,
    zGenerateShoppingListFromRecipesResponse,
} from "@tfm/contracts";

import { GenerateShoppingListFromRecipesUseCase } from "../../application/use-cases/generate-shopping-list-from-recipes/generate-shopping-list-from-recipes.usecase";

import {
    toGenerateShoppingListFromRecipesInput,
    toGenerateShoppingListFromRecipesResponse,
} from "../mappers/shopping-list-from-recipes.mapper";

import {
    zGenerateDailySuggestionPersistedRequest,
    zGenerateDailySuggestionPersistedResponse,
} from "@tfm/contracts";

import { PrismaSuggestionRepository } from "../../infrastructure/persistence/prisma/prisma-suggestion-repository";
import { GenerateAndStoreDailySuggestionUseCase } from "../../application/use-cases/generate-and-store-daily-suggestion/generate-and-store-daily-suggestion.usecase";

import {
    toGenerateDailySuggestionInput as toGenerateDailySuggestionPersistedInput,
    toPersistedSuggestionResponse,
} from "../mappers/daily-suggestion-persisted.mapper";

import { zGetDailySuggestionQuery } from "@tfm/contracts";

import { zAcceptSuggestionRequest, zAcceptSuggestionResponse } from "@tfm/contracts";
import { AcceptSuggestionUseCase } from "../../application/use-cases/accept-suggestion/accept-suggestion.usecase";


const app = Fastify({ logger: true });

// Manual DI (por ahora)
// const inventoryRepo = new InMemoryInventoryRepository(); //Dejamos de momento el inmemory
const inventoryRepo = new PrismaInventoryRepository();
const updateInventoryUC = new UpdateInventoryUseCase(inventoryRepo);

// const recipeRepo = new InMemoryRecipeRepository();
// const generateSuggestionUC = new GenerateDailySuggestionUseCase(inventoryRepo, recipeRepo);
const recipeRepo = new PrismaRecipeRepository();
const generateSuggestionUC = new GenerateDailySuggestionUseCase(inventoryRepo, recipeRepo);

const generateShoppingListUC = new GenerateShoppingListUseCase(inventoryRepo);
const generateShoppingListFromRecipesUC = new GenerateShoppingListFromRecipesUseCase(inventoryRepo, recipeRepo);

const suggestionRepo = new PrismaSuggestionRepository();

const generateAndStoreSuggestionUC = new GenerateAndStoreDailySuggestionUseCase(
    generateSuggestionUC,
    suggestionRepo
);

const acceptSuggestionUC = new AcceptSuggestionUseCase(
    suggestionRepo,
    inventoryRepo,
    recipeRepo
);


app.post("/inventory/update", async (request, reply) => {
    // 1) Validación runtime con contracts
    const parsedReq = zUpdateInventoryRequest.safeParse(request.body);
    if (!parsedReq.success) {
        return reply.status(400).send({
            error: "Invalid request",
            details: parsedReq.error.flatten(),
        });
    }

    // 2) Contract -> UseCase input
    const input = toUpdateInventoryInput(parsedReq.data);

    // 3) Ejecutar caso de uso
    const out = await updateInventoryUC.execute(input);

    // 4) UseCase output -> Contract response
    const response = toUpdateInventoryResponse(out);

    // 5) Validar response shape (extra calidad)
    const parsedRes = zUpdateInventoryResponse.safeParse(response);
    if (!parsedRes.success) {
        request.log.error(parsedRes.error, "Invalid response shape");
        return reply.status(500).send({ error: "Invalid response shape" });
    }

    return reply.status(200).send(parsedRes.data);
});

app.post("/suggestions/generate", async (request, reply) => {
    const parsedReq = zGenerateDailySuggestionPersistedRequest.safeParse(request.body);
    if (!parsedReq.success) {
        return reply.status(400).send({
            error: "Invalid request",
            details: parsedReq.error.flatten(),
        });
    }

    const input = toGenerateDailySuggestionPersistedInput(parsedReq.data);
    const persisted = await generateAndStoreSuggestionUC.execute(input);
    const response = toPersistedSuggestionResponse(persisted);

    const parsedRes = zGenerateDailySuggestionPersistedResponse.safeParse(response);
    if (!parsedRes.success) {
        request.log.error(parsedRes.error, "Invalid response shape");
        return reply.status(500).send({ error: "Invalid response shape" });
    }

    return reply.status(200).send(parsedRes.data);
});


app.post("/shopping-list/generate", async (request, reply) => {
    const parsedReq = zGenerateShoppingListRequest.safeParse(request.body);
    if (!parsedReq.success) {
        return reply.status(400).send({
            error: "Invalid request",
            details: parsedReq.error.flatten(),
        });
    }

    const input = toGenerateShoppingListInput(parsedReq.data);
    const out = await generateShoppingListUC.execute(input);
    const response = toGenerateShoppingListResponse(out);

    const parsedRes = zGenerateShoppingListResponse.safeParse(response);
    if (!parsedRes.success) {
        request.log.error(parsedRes.error, "Invalid response shape");
        return reply.status(500).send({ error: "Invalid response shape" });
    }

    return reply.status(200).send(parsedRes.data);
});

app.post("/shopping-list/from-recipes", async (request, reply) => {
    const parsedReq = zGenerateShoppingListFromRecipesRequest.safeParse(request.body);
    if (!parsedReq.success) {
        return reply.status(400).send({
            error: "Invalid request",
            details: parsedReq.error.flatten(),
        });
    }

    const input = toGenerateShoppingListFromRecipesInput(parsedReq.data);
    const out = await generateShoppingListFromRecipesUC.execute(input);
    const response = toGenerateShoppingListFromRecipesResponse(out);

    const parsedRes = zGenerateShoppingListFromRecipesResponse.safeParse(response);
    if (!parsedRes.success) {
        request.log.error(parsedRes.error, "Invalid response shape");
        return reply.status(500).send({ error: "Invalid response shape" });
    }

    return reply.status(200).send(parsedRes.data);
});

app.get("/suggestions/daily", async (request, reply) => {
    const parsed = zGetDailySuggestionQuery.safeParse(request.query);
    if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid query", details: parsed.error.flatten() });
    }

    const { householdId, date, slot } = parsed.data;

    const found = await suggestionRepo.getDailySuggestion(householdId, date, slot);
    if (!found) return reply.status(404).send({ error: "Suggestion not found" });

    return reply.status(200).send(toPersistedSuggestionResponse(found));
});

app.post("/suggestions/accept", async (request, reply) => {
    const parsedReq = zAcceptSuggestionRequest.safeParse(request.body);
    if (!parsedReq.success) {
        return reply.status(400).send({ error: "Invalid request", details: parsedReq.error.flatten() });
    }

    try {
        const out = await acceptSuggestionUC.execute({ suggestionId: parsedReq.data.suggestionId });
        const parsedRes = zAcceptSuggestionResponse.safeParse(out);
        if (!parsedRes.success) return reply.status(500).send({ error: "Invalid response shape" });
        return reply.status(200).send(parsedRes.data);
    } catch (e: any) {
        // MVP error mapping (improve later)
        if (String(e?.message).includes("not found")) return reply.status(404).send({ error: e.message });
        if (String(e?.message).includes("negative") || String(e?.message).includes("insufficient"))
            return reply.status(409).send({ error: e.message });
        return reply.status(500).send({ error: "Unexpected error" });
    }
});


async function start() {
    await app.listen({ port: 3000, host: "127.0.0.1" });
}

start();
