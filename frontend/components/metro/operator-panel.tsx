"use client";

import { cn } from "@/lib/utils";
import { OperatorAlert } from "@/lib/metro/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { releaseTrain } from "@/lib/metro/simulation-store";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OperatorPanelProps {
  alerts: OperatorAlert[];
  onClearAlert: (trainId: string) => void;
}

export function OperatorPanel({ alerts, onClearAlert }: OperatorPanelProps) {
  const handleResolve = (trainId: string) => {
    releaseTrain(trainId);
    onClearAlert(trainId);
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="mb-2 h-8 w-8 text-[var(--metro-success)]" />
          <p className="text-sm text-muted-foreground">
            Nenhum alerta ativo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm font-semibold text-destructive">
              Alertas do Operador
            </CardTitle>
          </div>
          <Badge variant="destructive" className="text-[10px]">
            {alerts.length} alerta{alerts.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {alerts.map((alert, index) => (
          <div
            key={`${alert.trainId}-${index}`}
            className="flex items-start justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{alert.trainName}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-destructive/50 text-destructive"
                >
                  {alert.alertType === "max_attempts"
                    ? "Tentativas Excedidas"
                    : alert.alertType === "door_timeout"
                    ? "Timeout"
                    : "Emergência"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{alert.message}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{alert.station.name}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(alert.timestamp), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleResolve(alert.trainId)}
              >
                Resolver
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onClearAlert(alert.trainId)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
