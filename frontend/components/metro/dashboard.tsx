"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/lib/metro/simulation-store";
import { linhaCentroStations, linhaSulStations } from "@/lib/metro/stations";
import { Line } from "@/lib/metro/types";
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
  const {
    trains,
    events,
    alerts,
    speed,
    isRunning,
    isConnected,
    initialize,
    tick,
    setSpeed,
    setIsRunning,
    clearAlert,
  } = useSimulationStore();

  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inicializa a simulação
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Loop de simulação
  useEffect(() => {
    if (isRunning) {
      tickIntervalRef.current = setInterval(() => {
        tick();
      }, 1000 / speed);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [isRunning, speed, tick]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, [setSpeed]);

  const handleToggleRunning = useCallback(() => {
    setIsRunning(!isRunning);
  }, [isRunning, setIsRunning]);

  const handleClearAlert = useCallback((trainId: string) => {
    clearAlert(trainId);
  }, [clearAlert]);

  const centroTrains = trains.filter((t) => t.line === Line.CENTRO);
  const sulTrains = trains.filter((t) => t.line === Line.SUL);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrainIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">MetroRecife</h1>
              <p className="text-[10px] text-muted-foreground">Simulator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SpeedControl
              speed={speed}
              isRunning={isRunning}
              onSpeedChange={handleSpeedChange}
              onToggleRunning={handleToggleRunning}
            />

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Radio className={isConnected ? "h-3 w-3 text-[var(--metro-success)]" : "h-3 w-3 text-destructive"} />
                {isConnected ? "Conectado" : "Offline"}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Activity className="h-3 w-3" />
                {trains.length} trens
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4">
        <div className="grid gap-6">
          {/* Mapas das Linhas */}
          <section className="grid gap-4">
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
          <div className="grid gap-6 lg:grid-cols-3">
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
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
            <div>
              <span className="font-medium">CBTU</span> — Metrô do Recife Simulator
            </div>
            <div className="flex items-center gap-4">
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
