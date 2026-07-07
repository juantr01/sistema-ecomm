import { Link } from "react-router-dom";
import { AlertTriangle, Banknote, Boxes, PackageCheck, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { useDashboardSummary, useRevenueTrend } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/format";

export default function Dashboard() {
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: trend, isLoading: loadingTrend } = useRevenueTrend(30);

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {!isLoading && summary && summary.estoqueBaixo > 0 && (
        <Link
          to="/estoque"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/15"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {summary.estoqueBaixo} produto(s) com estoque baixo. Clique para ver detalhes.
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Faturamento do dia"
          value={isLoading ? "—" : formatCurrency(summary!.faturamentoDia)}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Faturamento do mês"
          value={isLoading ? "—" : formatCurrency(summary!.faturamentoMes)}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Lucro do dia"
          value={isLoading ? "—" : formatCurrency(summary!.lucroDia)}
          tone={!isLoading && summary!.lucroDia < 0 ? "destructive" : "success"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Lucro do mês"
          value={isLoading ? "—" : formatCurrency(summary!.lucroMes)}
          tone={!isLoading && summary!.lucroMes < 0 ? "destructive" : "success"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Total gasto no mês"
          value={isLoading ? "—" : formatCurrency(summary!.totalGastoMes)}
          tone="warning"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <StatCard
          label="Saldo"
          value={isLoading ? "—" : formatCurrency(summary!.saldo)}
          tone={!isLoading && summary!.saldo < 0 ? "destructive" : "success"}
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <StatCard
          label="Produtos ativos"
          value={isLoading ? "—" : String(summary!.quantidadeProdutos)}
          icon={<PackageCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Estoque baixo"
          value={isLoading ? "—" : String(summary!.estoqueBaixo)}
          tone={!isLoading && summary!.estoqueBaixo > 0 ? "destructive" : "default"}
          icon={<Boxes className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={trend} loading={loadingTrend} />
        <TopProductsChart data={summary?.produtosMaisVendidos} loading={isLoading} />
      </div>
    </div>
  );
}
