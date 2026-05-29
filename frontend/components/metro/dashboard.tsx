"use client";

import { useCallback } from "react";
import {
  useSimulationStore,
  setSimulationSpeed,
} from "@/lib/metro/simulation-store";
import { emitCommand } from "@/lib/metro/socket-client";
import { linhaCentroStations, linhaSulStations } from "@/lib/metro/stations";
import { Line } from "@/lib/metro/types";
import { useSocket } from "@/hooks/use-socket"; // NOVO HOOK DE WEBSOCKET

import { TrainMap } from "./train-map";
import { TrainCard } from "./train-card";
import { EventLog } from "./event-log";
import { OperatorPanel } from "./operator-panel";
import { SpeedControl } from "./speed-control";
import { DoorSensor } from "./door-sensor";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Train as TrainIcon, Radio, Wifi, Activity } from "lucide-react";

export function Dashboard() {
  const { trains, events, alerts, speed, isConnected, clearAlert, isRunning } =
    useSimulationStore();

  // 🔌 CONECTANDO O DASHBOARD AO BACKEND VIA WEBSOCKET
  // Ao chamar esse hook, a conexão Socket.io é iniciada e a store do Zustand
  // passa a ser alimentada automaticamente com os eventos que vêm da rede.
  useSocket();

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSimulationSpeed(newSpeed);
  }, []);

  const handleToggleRunning = useCallback(() => {
    // A simulação é autônoma no backend; pausa global pode ser Fase 4
    // O botão chama onToggleRunning() e aqui emitimos via socket.
    emitCommand("simulation:toggle-pause", {});
  }, []);

  const handleClearAlert = useCallback(
    (trainId: string) => {
      clearAlert(trainId);
    },
    [clearAlert],
  );

  const centroTrains = trains.filter((t) => t.line === Line.CENTRO);
  const sulTrains = trains.filter((t) => t.line === Line.SUL);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-4">
          {/* Linha 1: Logo + Badges de status */}
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <TrainIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-none">MetroRecife</h1>
                <p className="text-[10px] text-muted-foreground">Simulator</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Radio
                  className={
                    isConnected
                      ? "h-3 w-3 text-[var(--metro-success)]"
                      : "h-3 w-3 text-destructive"
                  }
                />
                <span className="hidden sm:inline">{isConnected ? "Conectado" : "Offline"}</span>
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Activity className="h-3 w-3" />
                {trains.length} trens
              </Badge>
            </div>
          </div>

          {/* Linha 2: Controle de velocidade (largura total em mobile) */}
          <div className="pb-3">
            <SpeedControl
              speed={speed}
              isRunning={isRunning}
              onSpeedChange={handleSpeedChange}
              onToggleRunning={handleToggleRunning}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-3 sm:p-4">
        <div className="grid gap-4 sm:gap-6">
          {/* Mapas das Linhas */}
          <section className="grid gap-3 sm:gap-4">
            <TrainMap
              stations={linhaCentroStations}
              trains={trains}
              line={Line.CENTRO}
              title="Linha Centro (Vermelha) - Camaragibe ↔ Recife"
            />
            <TrainMap
              stations={linhaSulStations}
              trains={trains}
              line={Line.SUL}
              title="Linha Sul (Azul) - Jaboatão ↔ Recife"
            />
          </section>

          {/* Grid de conteúdo */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Coluna 1: Tabs de Trens e Sensores */}
            <section className="space-y-4 lg:col-span-2">
              <Tabs defaultValue="trains" className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="trains" className="gap-2 text-xs">
                    <TrainIcon className="h-3 w-3" />
                    Status dos Trens
                  </TabsTrigger>
                  <TabsTrigger value="sensors" className="gap-2 text-xs">
                    <Wifi className="h-3 w-3" />
                    Sensores de Porta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trains" className="mt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Linha Centro */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-[var(--metro-centro)]" />
                        Linha Centro
                      </h3>
                      {centroTrains.map((train) => (
                        <TrainCard key={train.id} train={train} />
                      ))}
                    </div>

                    {/* Linha Sul */}
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-[var(--metro-sul)]" />
                        Linha Sul
                      </h3>
                      {sulTrains.map((train) => (
                        <TrainCard key={train.id} train={train} />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sensors" className="mt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {trains.map((train) => (
                      <DoorSensor key={train.id} train={train} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* Coluna 2: Alertas e Log */}
            <section className="space-y-4">
              <OperatorPanel alerts={alerts} onClearAlert={handleClearAlert} />
              <EventLog events={events} />
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-border py-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
            <div>
              <span className="font-medium">CBTU</span> — Metrô do Recife
              Simulator
            </div>
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-4">
              <span>Desenvolvido por Jonas Ferreira Silva</span>
              <a
                href="https://github.com/jonasferreira-silva1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                github.com/jonasferreira-silva1
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
