import http from "http";

// CONFIG DO REDIS UPSTASH
const REDIS_URL = "SUA_REST_URL_AQUI"; 
const REDIS_TOKEN = "SEU_TOKEN_AQUI";

// Função para adicionar cliente no Redis
async function addCliente(cliente) {
    const res = await fetch(`${REDIS_URL}/rpush/clientes`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${REDIS_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify([JSON.stringify(cliente)])
    });

    return await res.json();
}

// Função para buscar clientes no Redis
async function getClientes() {
    const res = await fetch(`${REDIS_URL}/lrange/clientes/0/-1`, {
        headers: {
            "Authorization": `Bearer ${REDIS_TOKEN}`
        }
    });

    const dados = await res.json();

    if (!dados.result) return [];

    return dados.result.map(c => JSON.parse(c));
}



// ----------------------------
// SERVIDOR HTTP PURO
// ----------------------------
const server = http.createServer(async (req, res) => {
    // Permite JSON e CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // ------------------------
    // GET /clientes
    // ------------------------
    if (req.url === "/clientes" && req.method === "GET") {
        const clientes = await getClientes();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(clientes));
        return;
    }

    // ------------------------
    // POST /clientes
    // ------------------------
    if (req.url === "/clientes" && req.method === "POST") {
        let body = "";

        req.on("data", chunk => body += chunk);

        req.on("end", async () => {
            try {
                const json = JSON.parse(body);

                if (!json.nome || !json.telefone) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ erro: "nome e telefone são obrigatórios" }));
                    return;
                }

                const resultado = await addCliente(json);

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    status: "sucesso",
                    resultado
                }));

            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ erro: "JSON inválido" }));
            }
        });

        return;
    }

    // Rota não encontrada
    res.writeHead(404);
    res.end("Rota não encontrada");
});


// Porta
const PORT = 3000;
server.listen(PORT, () => {
    console.log("API rodando na porta " + PORT);
});
