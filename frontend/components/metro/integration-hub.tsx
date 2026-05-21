"use client";

import { ArrowLeftRight } from "lucide-react";

export function IntegrationHub() {
  return (
    <motion.div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <motion.div className="flex flex-wrap items-center gap-3">
        <motion.div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
        </motion.div>
        <motion.div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground">
            Hub de integracao — Estacao Recife
          </h4>
          <p className="text-xs text-muted-foreground">
            Linha Centro e Linha Sul compartilham o terminal Recife.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
