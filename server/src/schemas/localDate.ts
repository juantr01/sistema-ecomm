import { z } from "zod";
import { parseLocalDate } from "../utils/dateRange";

// Datas "YYYY-MM-DD" dos formulários viram meia-noite no horário do Brasil, não em UTC
export const localDate = () => z.preprocess((v) => (typeof v === "string" ? parseLocalDate(v) : v), z.coerce.date());
