import { syncAllShops, isSyncRunning } from "../services/shopee.service";
import { closeDay, hasClosedDay } from "../services/dashboard.service";
import { startOfDay } from "../utils/dateRange";

// Todo dia à 00:00 (horário de Brasília): sincroniza os pedidos e fecha o resultado do dia anterior
const MINUTE = 60 * 1000;
const SYNC_RETRIES = 6;

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function msUntilNextMidnight() {
  const next = startOfDay(new Date());
  next.setDate(next.getDate() + 1);
  // alguns segundos de folga para o pedido das 23:59 já constar na Shopee
  return next.getTime() - Date.now() + 30 * 1000;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runDailyClose() {
  const day = yesterday();

  // Se um sync manual estiver rodando, espera ele terminar em vez de rodar outro junto
  for (let attempt = 1; attempt <= SYNC_RETRIES; attempt++) {
    if (isSyncRunning()) {
      await wait(5 * MINUTE);
      continue;
    }
    try {
      await syncAllShops();
      break;
    } catch (err) {
      // Mesmo sem sync (ex.: Shopee fora do ar) o dia é fechado com o que já foi importado
      console.error("Sync automático da 00:00 falhou:", err);
      break;
    }
  }

  await closeDay(day);
  console.log(`Fechamento do dia ${day.toLocaleDateString("pt-BR")} concluído`);
}

function scheduleNext() {
  setTimeout(async () => {
    try {
      await runDailyClose();
    } catch (err) {
      console.error("Fechamento diário falhou:", err);
    }
    scheduleNext();
  }, msUntilNextMidnight());
}

export function startDailyCloseJob() {
  scheduleNext();

  // Servidor reiniciado depois da 00:00 (ex.: deploy) não perde o fechamento de ontem
  setTimeout(async () => {
    try {
      if (!(await hasClosedDay(yesterday()))) await runDailyClose();
    } catch (err) {
      console.error("Fechamento diário (recuperação) falhou:", err);
    }
  }, MINUTE);
}
