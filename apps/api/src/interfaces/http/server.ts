import Fastify from "fastify";
import {
    zUpdateInventoryRequest,
    zUpdateInventoryResponse,
} from "@tfm/contracts";

import { UpdateInventoryUseCase } from "../../application/use-cases/update-inventory/update-inventory.usecase";
import { InMemoryInventoryRepository } from "../../infrastructure/persistence/in-memory/in-memory-inventory-repository";
import { toUpdateInventoryInput, toUpdateInventoryResponse } from "../mappers/update-inventory.mapper";

const app = Fastify({ logger: true });

// Manual DI (por ahora)
const inventoryRepo = new InMemoryInventoryRepository();
const updateInventoryUC = new UpdateInventoryUseCase(inventoryRepo);

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

async function start() {
    await app.listen({ port: 3000, host: "127.0.0.1" });
}

start();
