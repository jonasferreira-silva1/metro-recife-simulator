import { Line, Station } from "./types";
import { v4 as uuidv4 } from "uuid";

// Linha Centro (Vermelha) - Camaragibe → Recife
export const linhaCentroStations: Station[] = [
  { id: uuidv4(), name: "Camaragibe", line: Line.CENTRO, orderIndex: 0, isTerminal: true, isTransfer: false, dwellTime: 45 },
  { id: uuidv4(), name: "Cosme e Damião", line: Line.CENTRO, orderIndex: 1, isTerminal: false, isTransfer: true, dwellTime: 30 },
  { id: uuidv4(), name: "Rodoviária", line: Line.CENTRO, orderIndex: 2, isTerminal: false, isTransfer: true, dwellTime: 35 },
  { id: uuidv4(), name: "Curado", line: Line.CENTRO, orderIndex: 3, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Alto do Céu", line: Line.CENTRO, orderIndex: 4, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Coqueiral", line: Line.CENTRO, orderIndex: 5, isTerminal: false, isTransfer: true, dwellTime: 30 },
  { id: uuidv4(), name: "Tejipió", line: Line.CENTRO, orderIndex: 6, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Barro", line: Line.CENTRO, orderIndex: 7, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Werneck", line: Line.CENTRO, orderIndex: 8, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Santa Luzia", line: Line.CENTRO, orderIndex: 9, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Mangueira", line: Line.CENTRO, orderIndex: 10, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Ipiranga", line: Line.CENTRO, orderIndex: 11, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Afogados", line: Line.CENTRO, orderIndex: 12, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Joana Bezerra", line: Line.CENTRO, orderIndex: 13, isTerminal: false, isTransfer: true, dwellTime: 35 },
  { id: uuidv4(), name: "Recife", line: Line.CENTRO, orderIndex: 14, isTerminal: true, isTransfer: true, dwellTime: 60 },
];

// Linha Sul (Azul) - Jaboatão → Recife
export const linhaSulStations: Station[] = [
  { id: uuidv4(), name: "Jaboatão", line: Line.SUL, orderIndex: 0, isTerminal: true, isTransfer: false, dwellTime: 45 },
  { id: uuidv4(), name: "Engenho Velho", line: Line.SUL, orderIndex: 1, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Floriano", line: Line.SUL, orderIndex: 2, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Cavaleiro", line: Line.SUL, orderIndex: 3, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Cajueiro Seco", line: Line.SUL, orderIndex: 4, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Prazeres", line: Line.SUL, orderIndex: 5, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Monte dos Guararapes", line: Line.SUL, orderIndex: 6, isTerminal: false, isTransfer: true, dwellTime: 35 },
  { id: uuidv4(), name: "Porta Larga", line: Line.SUL, orderIndex: 7, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Aeroporto", line: Line.SUL, orderIndex: 8, isTerminal: false, isTransfer: true, dwellTime: 40 },
  { id: uuidv4(), name: "Tancredo Neves", line: Line.SUL, orderIndex: 9, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Shopping", line: Line.SUL, orderIndex: 10, isTerminal: false, isTransfer: false, dwellTime: 35 },
  { id: uuidv4(), name: "Antônio Falcão", line: Line.SUL, orderIndex: 11, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Imbiribeira", line: Line.SUL, orderIndex: 12, isTerminal: false, isTransfer: false, dwellTime: 30 },
  { id: uuidv4(), name: "Largo da Paz", line: Line.SUL, orderIndex: 13, isTerminal: false, isTransfer: true, dwellTime: 35 },
  { id: uuidv4(), name: "Recife", line: Line.SUL, orderIndex: 14, isTerminal: true, isTransfer: true, dwellTime: 60 },
];

// Todas as estações
export const allStations: Station[] = [...linhaCentroStations, ...linhaSulStations];

// Funções auxiliares
export function getStationsByLine(line: Line): Station[] {
  return line === Line.CENTRO ? linhaCentroStations : linhaSulStations;
}

export function getNextStation(station: Station, direction: "forward" | "return"): Station | null {
  const stations = getStationsByLine(station.line);
  const currentIndex = station.orderIndex;
  
  if (direction === "forward") {
    if (currentIndex >= stations.length - 1) return null;
    return stations[currentIndex + 1];
  } else {
    if (currentIndex <= 0) return null;
    return stations[currentIndex - 1];
  }
}

export function getTerminalStation(line: Line, position: "start" | "end"): Station {
  const stations = getStationsByLine(line);
  return position === "start" ? stations[0] : stations[stations.length - 1];
}
