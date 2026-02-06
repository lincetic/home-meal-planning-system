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
    const parsedReq = zGenerateDailySuggestionRequest.safeParse(request.body);
    if (!parsedReq.success) {
        return reply.status(400).send({
            error: "Invalid request",
            details: parsedReq.error.flatten(),
        });
    }

    const input = toGenerateDailySuggestionInput(parsedReq.data);
    const out = await generateSuggestionUC.execute(input);
    const response = toGenerateDailySuggestionResponse(out);

    const parsedRes = zGenerateDailySuggestionResponse.safeParse(response);
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


async function start() {
    await app.listen({ port: 3000, host: "127.0.0.1" });
}

start();
