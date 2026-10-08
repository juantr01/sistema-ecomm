import "./config/timezone";
import { app } from "./app";
import { env } from "./config/env";
import { startDailyCloseJob } from "./jobs/dailyClose";

app.listen(env.port, () => {
  console.log(`Servidor rodando em http://localhost:${env.port}`);
  startDailyCloseJob();
});
