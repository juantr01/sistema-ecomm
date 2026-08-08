import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Toaster } from "@/components/shared/Toaster";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ProdutosLista from "@/pages/produtos/Lista";
import ProdutoForm from "@/pages/produtos/Form";
import Estoque from "@/pages/estoque/Estoque";
import ComprasLista from "@/pages/compras/Lista";
import CompraForm from "@/pages/compras/Form";
import FornecedoresLista from "@/pages/fornecedores/Lista";
import FornecedorForm from "@/pages/fornecedores/Form";
import FornecedorDetalhe from "@/pages/fornecedores/Detalhe";
import VendasLista from "@/pages/vendas/Lista";
import VendaForm from "@/pages/vendas/Form";
import Despesas from "@/pages/despesas/Despesas";
import Relatorios from "@/pages/relatorios/Relatorios";
import Configuracoes from "@/pages/configuracoes/Configuracoes";
import ShopeeCallback from "@/pages/shopee/Callback";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />

            <Route path="produtos" element={<ProdutosLista />} />
            <Route path="produtos/novo" element={<ProdutoForm />} />
            <Route path="produtos/:id" element={<ProdutoForm />} />

            <Route path="estoque" element={<Estoque />} />

            <Route path="compras" element={<ComprasLista />} />
            <Route path="compras/novo" element={<CompraForm />} />

            <Route path="fornecedores" element={<FornecedoresLista />} />
            <Route path="fornecedores/novo" element={<FornecedorForm />} />
            <Route path="fornecedores/:id" element={<FornecedorDetalhe />} />
            <Route path="fornecedores/:id/editar" element={<FornecedorForm />} />

            <Route path="vendas" element={<VendasLista />} />
            <Route path="vendas/novo" element={<VendaForm />} />

            <Route path="despesas" element={<Despesas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="shopee/callback" element={<ShopeeCallback />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
