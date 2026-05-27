# Deploy no Railway — MetroRecife Simulator

## Visão Geral

```
[Railway]
  ├── PostgreSQL  (plugin nativo)
  ├── Backend NestJS  (porta 3001)
  └── Frontend Next.js  (porta 3000)
```

---

## Pré-requisitos

- Conta no [Railway](https://railway.app) (pode entrar com GitHub)
- Repositório no GitHub com o projeto

---

## Passo 1 — Criar o projeto no Railway

1. Acesse [railway.app](https://railway.app) e clique em **New Project**
2. Escolha **Deploy from GitHub repo**
3. Selecione o repositório `metro-recife-simulator`

---

## Passo 2 — Adicionar o banco PostgreSQL

1. Dentro do projeto, clique em **+ New** → **Database** → **Add PostgreSQL**
2. O Railway cria automaticamente e disponibiliza a variável `DATABASE_URL`
3. Clique no serviço PostgreSQL → aba **Variables** → copie o valor de `DATABASE_URL`

---

## Passo 3 — Configurar o Backend

1. Clique em **+ New** → **GitHub Repo** → selecione o mesmo repositório
2. Em **Settings** → **Root Directory** → coloque: `backend`
3. O Railway vai detectar o `Dockerfile` automaticamente

### Variáveis de ambiente do Backend

Vá em **Variables** e adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | (cole o valor copiado do PostgreSQL) |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://SEU-FRONTEND.up.railway.app` (preencher depois) |
| `SIMULATION_TICK_MS` | `1000` |
| `DOOR_SENSOR_PROBABILITY` | `0.1` |
| `MAX_DOOR_ATTEMPTS` | `3` |
| `DOOR_BLOCK_TIMEOUT` | `30` |

> ⚠️ `FRONTEND_URL` pode ser `*` inicialmente e atualizado depois que o frontend subir.

4. Em **Settings** → **Networking** → clique em **Generate Domain**
5. Anote a URL gerada (ex: `https://metro-backend.up.railway.app`)

---

## Passo 4 — Configurar o Frontend

1. Clique em **+ New** → **GitHub Repo** → selecione o mesmo repositório
2. Em **Settings** → **Root Directory** → coloque: `frontend`
3. O Railway vai detectar o `Dockerfile` automaticamente

### Variáveis de ambiente do Frontend

Vá em **Variables** e adicione:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_WS_URL` | `https://metro-backend.up.railway.app` |
| `NEXT_PUBLIC_API_URL` | `https://metro-backend.up.railway.app` |
| `PORT` | `3000` |

> ⚠️ As variáveis `NEXT_PUBLIC_*` são embutidas no build. Se mudar a URL do backend, precisa fazer redeploy do frontend.

4. Em **Settings** → **Networking** → clique em **Generate Domain**
5. Anote a URL do frontend (ex: `https://metro-frontend.up.railway.app`)

---

## Passo 5 — Atualizar CORS do Backend

Volte no serviço do **Backend** → **Variables** e atualize:

```
FRONTEND_URL=https://metro-frontend.up.railway.app
```

O Railway vai fazer redeploy automaticamente.

---

## Passo 6 — Verificar o deploy

1. Acesse a URL do frontend no navegador
2. O badge no header deve mostrar **"Conectado"** (verde)
3. Os trens devem aparecer se movendo no mapa

---

## Variáveis de ambiente — Resumo Final

### Backend
```env
DATABASE_URL=postgresql://...  # gerado pelo Railway
PORT=3001
FRONTEND_URL=https://SEU-FRONTEND.up.railway.app
SIMULATION_TICK_MS=1000
DOOR_SENSOR_PROBABILITY=0.1
MAX_DOOR_ATTEMPTS=3
DOOR_BLOCK_TIMEOUT=30
```

### Frontend
```env
NEXT_PUBLIC_WS_URL=https://SEU-BACKEND.up.railway.app
NEXT_PUBLIC_API_URL=https://SEU-BACKEND.up.railway.app
PORT=3000
```

---

## Troubleshooting

**Frontend mostra "Offline"**
- Verifique se `NEXT_PUBLIC_WS_URL` aponta para a URL correta do backend
- Confirme que o backend está rodando (logs no Railway)
- Verifique se `FRONTEND_URL` no backend inclui a URL do frontend

**Backend não conecta no banco**
- Confirme que `DATABASE_URL` está correta
- O PostgreSQL precisa estar healthy antes do backend subir

**Build do frontend falha**
- O Dockerfile usa `output: standalone` — confirme que `next.config.mjs` tem essa opção
- Verifique os logs de build no Railway

---

## Custo estimado no Railway

- Plano **Hobby** ($5/mês): suficiente para os 3 serviços
- Plano **Free** tem 500h/mês de execução (pode dormir após inatividade)
