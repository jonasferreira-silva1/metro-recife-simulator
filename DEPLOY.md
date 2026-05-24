# Guia de Deploy — MetroRecife Simulator 🚇

Este guia explica como hospedar o **MetroRecife Simulator** na nuvem gratuitamente, dividindo a aplicação em duas frentes:
1. **Backend (NestJS + WebSockets) & Banco de Dados (PostgreSQL)** no **Render**.
2. **Frontend (Next.js)** na **Vercel**.

---

## 🛠️ Passo 1: Deploy do Banco de Dados e Backend no Render

O Render é ideal para hospedar o backend por possuir suporte nativo a WebSockets e Docker. Nós fornecemos um blueprint (`render.yaml`) que automatiza a criação do banco de dados e do serviço do backend em um clique.

### Opção A: Usando o Blueprint Automático (Recomendado)

1. Crie uma conta em [render.com](https://render.com).
2. Conecte seu repositório do GitHub ao Render.
3. No painel do Render, clique em **New** (Novo) ➔ **Blueprint**.
4. Selecione o repositório do `metro-recife-simulator`.
5. O Render lerá o arquivo `render.yaml` automaticamente.
6. Preencha os parâmetros:
   - **Service Name**: `metro-recife-backend`
   - **Database Name**: `metro-recife-db`
   - **FRONTEND_URL**: Insira a URL que você receberá da Vercel no **Passo 2** (você pode colocar um valor provisório, como `https://localhost:3000`, e atualizar depois).
7. Clique em **Apply** (Aplicar) e aguarde o build do Docker finalizar.
8. Uma vez concluído, copie a URL do serviço gerada pelo Render (exemplo: `https://metro-recife-backend.onrender.com`).

> 💡 **Nota Importante:** No plano gratuito do Render, o banco de dados PostgreSQL expira após 90 dias. Se você quiser um banco de dados persistente que não expira, veja a **Opção B (Neon)** abaixo.

---

### Opção B: Banco de Dados Permanente com Neon.tech (Alternativa)

Se preferir usar o **Neon** para o banco de dados (que possui um plano gratuito permanente de PostgreSQL):

1. Crie uma conta gratuita em [neon.tech](https://neon.tech) e crie um novo projeto/banco chamado `metro-recife`.
2. Copie a **Connection String** (URL de conexão) do banco de dados gerada pelo Neon.
3. No Render, em vez de criar um Blueprint, crie apenas um **Web Service** manual:
   - Escolha o repositório `metro-recife-simulator`.
   - Configure o **Build Command** e **Runtime** para usar **Docker**.
   - Defina o caminho do Dockerfile como `backend/Dockerfile` e o contexto de build como `backend/`.
   - Adicione as seguintes **Environment Variables** nas configurações do Web Service:
     - `DATABASE_URL`: Insira a Connection String que copiou do Neon.
     - `PORT`: `3001`
     - `FRONTEND_URL`: A URL do frontend na Vercel.
     - `SIMULATION_TICK_MS`: `1000`
     - `DOOR_SENSOR_PROBABILITY`: `0.1`
     - `MAX_DOOR_ATTEMPTS`: `3`
     - `DOOR_BLOCK_TIMEOUT`: `30`

---

## 🚀 Passo 2: Deploy do Frontend na Vercel

O Next.js é desenvolvido pelos criadores da Vercel, o que torna a hospedagem lá extremamente simples, rápida e gratuita.

1. Crie uma conta em [vercel.com](https://vercel.com).
2. Clique em **Add New...** ➔ **Project** e importe o seu repositório `metro-recife-simulator`.
3. Nas configurações do projeto Vercel:
   - **Framework Preset**: Selecione `Next.js`.
   - **Root Directory**: Mude para `frontend` (importante!).
4. Expanda a seção **Environment Variables** (Variáveis de Ambiente) e adicione as seguintes chaves usando a URL do backend obtida no **Passo 1**:
   - `NEXT_PUBLIC_WS_URL`: A URL do seu backend no Render (ex: `https://metro-recife-backend.onrender.com`).
   - `NEXT_PUBLIC_API_URL`: A mesma URL do backend no Render (ex: `https://metro-recife-backend.onrender.com`).
5. Clique em **Deploy**.
6. Uma vez implantado, copie a URL do seu site da Vercel (ex: `https://metro-recife-simulator.vercel.app`).

---

## 🔗 Passo 3: Vinculando o Backend ao Frontend (CORS)

Após obter a URL oficial da Vercel (ex: `https://metro-recife-simulator.vercel.app`):
1. Vá para o painel do seu **Web Service** no **Render** (o backend).
2. Acesse a aba **Environment** (Ambiente).
3. Atualize a variável `FRONTEND_URL` com a URL do seu app na Vercel (remova a barra `/` final).
4. Salve as alterações. O Render fará o deploy automático da nova configuração.

Pronto! Agora seu simulador está rodando 100% online na nuvem, com o backend transmitindo os estados dos trens em tempo real para os usuários acessarem diretamente pelo navegador! 🚇✨
