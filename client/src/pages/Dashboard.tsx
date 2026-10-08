import { Banknote, CalendarCheck, ShoppingBag, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { useDashboardSummary, useRevenueTrend } from "@/hooks/useDashboard";
import { formatCurrency, toInputDate } from "@/lib/format";

export default function Dashboard() {
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: trend, isLoading: loadingTrend } = useRevenueTrend(30);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toInputDate(yesterday);

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Faturamento e lucro lado a lado (dia em cima, mês embaixo); pedidos do dia e lucro de ontem na 3ª coluna no desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Faturamento do dia"
          value={isLoading ? "—" : formatCurrency(summary!.faturamentoDia)}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Lucro do dia"
          value={isLoading ? "—" : formatCurrency(summary!.lucroDia)}
          tone={!isLoading && summary!.lucroDia < 0 ? "destructive" : "success"}
          icon={<TrendingUp className="h-4 w-4" />}
          to="/lucro-do-dia"
        />
        <StatCard
          label="Faturamento do mês"
          value={isLoading ? "—" : formatCurrency(summary!.faturamentoMes)}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Lucro do mês"
          value={isLoading ? "—" : formatCurrency(summary!.lucroMes)}
          tone={!isLoading && summary!.lucroMes < 0 ? "destructive" : "success"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Pedidos do dia"
          value={isLoading ? "—" : String(summary!.pedidosDia)}
          icon={<ShoppingBag className="h-4 w-4" />}
          className="lg:col-start-3 lg:row-start-1"
        />
        <StatCard
          label="Lucro de ontem"
          value={isLoading ? "—" : formatCurrency(summary!.lucroOntem)}
          tone={!isLoading && summary!.lucroOntem < 0 ? "destructive" : "success"}
          icon={<CalendarCheck className="h-4 w-4" />}
          hint={isLoading ? undefined : summary!.lucroOntemFechado ? "Fechado à 00:00" : "Parcial — fecha à 00:00"}
          className="lg:col-start-3 lg:row-start-2"
          to={`/lucro-do-dia?data=${yesterdayKey}`}
        />
      </div>

      <RevenueChart data={trend} loading={loadingTrend} />
    </div>
  );
}
