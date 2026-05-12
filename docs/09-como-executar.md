# 09 — Como Executar o Projeto

## Pré-requisitos

- Docker Desktop >= 24.x
- Node.js >= 20.x (para desenvolvimento local fora do Docker)
- Git

---

## Execução Completa (recomendado)

Um único comando sobe backend, frontend e banco de dados:

```bash
git clone https://github.com/jonasferreira-silva1/metro-recife-simulator
cd metro-recife-simulator
cp .env.example .env
docker compose up --build
```

Acesse em: **http://localhost:3000**

---

## Desenvolvimento Local

### Backend

```bash
cd backend
npm install
cp .env.example .env   # ajuste DATABASE_URL para localhost
npm run start:dev
```

Backend disponível em: `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em: `http://localhost:3000`

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://metro:metro@db:5432/metro_recife` | URL de conexão com o PostgreSQL |
| `PORT` | `3001` | Porta do backend |
| `FRONTEND_URL` | `http://localhost:3000` | URL do frontend (CORS) |
| `SIMULATION_TICK_MS` | `1000` | Intervalo do timer principal em ms |
| `DOOR_SENSOR_PROBABILITY` | `0.1` | Chance de bloqueio automático (0.0 a 1.0) |
| `MAX_DOOR_ATTEMPTS` | `3` | Tentativas antes do alerta ao operador |
| `DOOR_BLOCK_TIMEOUT` | `30` | Segundos até escalonamento manual |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | URL do WebSocket para o frontend |

---

## Testes

```bash
# Testes unitários da FSM
cd backend
npm run test

# Com cobertura
npm run test:cov
```
