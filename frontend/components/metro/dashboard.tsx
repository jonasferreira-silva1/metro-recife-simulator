'use client';

import { useCallback } from 'react';
import { useSimulationStore, setSimulationSpeed } from '@/lib/metro/simulation-store';
import { emitCommand } from '@/lib/metro/socket-client';
import { linhaCentroStations, linhaSulStations } from '@/lib/metro/stations';
import { Line } from '@/lib/metro/types';
import { useSocket } from '@/hooks/use-socket';

import { TrainMap } from './train-map';
import { TrainCard } from './train-card';
import { EventLog } from './event-log';
import { OperatorPanel } from './operator-panel';
import { SpeedControl } from './speed-control';
import { DoorSensor } from './door-sensor';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Train as TrainIcon, Radio, Activity, Wifi } from 'lucide-react';

export function Dashboard() {
  const { trains, events, alerts, speed, isConnected, clearAlert, isRunning } =
    useSimulationStore();

  useSocket();

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSimulationSpeed(newSpeed);
  }, []);

  const handleToggleRunning = useCallback(() => {
    emitCommand('simulation:toggle-pause', {});
  }, []);

  const handleClearAlert = useCallback(
    (trainId: string) => clearAlert(trainId),
    [clearAlert],
  );

  const centroTrains = trains.filter((t) => t.line === Line.CENTRO);
  const sulTrains = trains.filter((t) => t.line === Line.SUL);

  return (
    <div className="w-full min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="w-full max-w-7xl mx-auto px-3">

          {/* Linha 1: logo + badges */}
          <div className="flex h-12 items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                <TrainIcon className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="leading-none">
                <p className="text-sm font-bold">MetroRecife</p>
                <p className="text-[10px] text-muted-foreground">Simulator</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.5">
                <Radio
                  className={isConnected ? 'h-2.5 w-2.5 text-[var(--metro-success)]' : 'h-2.5 w-2.5 text-destructive'}
                />
                <span className="hidden xs:inline">{isConnected ? 'Online' : 'Offline'}</span>
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.5">
                <Activity className="h-2.5 w-2.5" />
                {trains.length}
              </Badge>
            </div>
          </div>

          {/* Linha 2: controles de velocidade — largura total */}
          <div className="pb-2.5">
            <SpeedControl
              speed={speed}
              isRunning={isRunning}
              onSpeedChange={handleSpeedChange}
              onToggleRunning={handleToggleRunning}
            />
          </div>
        </div>
      </header>

      {/* ── Conteúdo principal ── */}
      <main className="w-full max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-4">

          {/* Mapas das linhas */}
          <TrainMap
            stations={linhaCentroStations}
            trains={trains}
            line={Line.CENTRO}
            title="Linha Centro — Camaragibe ↔ Recife"
          />
          <TrainMap
            stations={linhaSulStations}
            trains={trains}
            line={Line.SUL}
            title="Linha Sul — Jaboatão ↔ Recife"
          />

          {/* Tabs: status dos trens e sensores */}
          <Tabs defaultValue="trains" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="trains" className="gap-1.5 text-xs">
                <TrainIcon className="h-3 w-3" />
                Status dos Trens
              </TabsTrigger>
              <TabsTrigger value="sensors" className="gap-1.5 text-xs">
                <Wifi className="h-3 w-3" />
                Sensores de Porta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trains" className="mt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-[var(--metro-centro)]" />
                    Linha Centro
                  </h3>
                  {centroTrains.map((train) => (
                    <TrainCard key={train.id} train={train} />
                  ))}
                </div>
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
              <div className="grid gap-3 sm:grid-cols-2">
                {trains.map((train) => (
                  <DoorSensor key={train.id} train={train} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Alertas e log — empilhados no mobile, lado a lado no desktop */}
          <div className="grid gap-4 lg:grid-cols-2">
            <OperatorPanel alerts={alerts} onClearAlert={handleClearAlert} />
            <EventLog events={events} />
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-border py-4 mt-4">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
            <span><span className="font-medium">CBTU</span> — Metrô do Recife Simulator</span>
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
      </footer>
    </div>
  );
}
