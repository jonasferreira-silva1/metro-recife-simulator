import { NextResponse } from "next/server";

// Esta rota serve como fallback/health check
// O WebSocket real é gerenciado pelo servidor customizado
export async function GET() {
  return NextResponse.json({ 
    status: "WebSocket endpoint",
    message: "Connect via socket.io client"
  });
}
