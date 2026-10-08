import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatDateTime } from "@/lib/format";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { useChangePassword } from "@/hooks/useAuth";
import { useShopeeStatus, useConnectShopee, useDisconnectShopee, ShopeeShopStatus } from "@/hooks/useShopee";
import { ShopeeSyncButton } from "@/components/shopee/ShopeeSyncButton";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export default function Configuracoes() {
  const [newCategory, setNewCategory] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [disconnectShop, setDisconnectShop] = useState<ShopeeShopStatus | null>(null);

  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const changePassword = useChangePassword();
  const { data: shopeeStatus } = useShopeeStatus();
  const connectShopee = useConnectShopee();
  const disconnectShopee = useDisconnectShopee();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    try {
      await createCategory.mutateAsync(newCategory.trim());
      setNewCategory("");
      toast({ title: "Categoria criada", variant: "success" });
    } catch (err) {
      toast({
        title: "Não foi possível criar a categoria",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteCategory() {
    if (!deleteId) return;
    try {
      await deleteCategory.mutateAsync(deleteId);
      toast({ title: "Categoria excluída", variant: "success" });
    } catch (err) {
      toast({
        title: "Não foi possível excluir a categoria",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  }

  async function handleDisconnectShopee() {
    try {
      if (!disconnectShop) return;
      await disconnectShopee.mutateAsync(disconnectShop.shopId);
      toast({ title: "Loja Shopee desconectada", variant: "success" });
    } catch (err) {
      toast({
        title: "Não foi possível desconectar a Shopee",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDisconnectShop(null);
    }
  }

  async function onSubmitPassword(values: PasswordValues) {
    try {
      await changePassword.mutateAsync(values);
      toast({ title: "Senha alterada com sucesso", variant: "success" });
      reset();
    } catch (err) {
      toast({
        title: "Não foi possível alterar a senha",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
      <h1 className="text-xl font-semibold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Integração Shopee</CardTitle>
          <CardDescription>
            {shopeeStatus?.connected
              ? "Sincronize produtos e vendas das suas lojas Shopee com o sistema."
              : "Conecte sua loja Shopee para sincronizar produtos e vendas automaticamente."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {shopeeStatus?.connected ? (
            <>
              <div className="divide-y rounded-md border">
                {shopeeStatus.shops.map((shop) => (
                  <div key={shop.shopId} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="space-y-0.5 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{shop.shopName ?? shop.shopId}</p>
                      <p>
                        Produtos: {shop.lastProductSyncAt ? formatDateTime(shop.lastProductSyncAt) : "nunca"} · Vendas:{" "}
                        {shop.lastOrderSyncAt ? formatDateTime(shop.lastOrderSyncAt) : "nunca"}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDisconnectShop(shop)}>
                      Desconectar
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <ShopeeSyncButton />
                <Button type="button" variant="outline" onClick={() => connectShopee.mutate()} disabled={connectShopee.isPending}>
                  {connectShopee.isPending ? "Conectando..." : "Conectar outra loja"}
                </Button>
              </div>
            </>
          ) : (
            <Button type="button" onClick={() => connectShopee.mutate()} disabled={connectShopee.isPending}>
              {connectShopee.isPending ? "Conectando..." : "Conectar com Shopee"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorias de produtos</CardTitle>
          <CardDescription>Gerencie as categorias usadas nos cadastros de produtos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nova categoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button type="button" onClick={handleAddCategory} disabled={createCategory.isPending}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories?.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1.5 rounded-full border bg-accent px-3 py-1 text-sm text-accent-foreground"
              >
                {c.name}
                <button onClick={() => setDeleteId(c.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Senha atual</Label>
              <Input type="password" {...register("currentPassword")} />
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input type="password" {...register("newPassword")} />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar nova senha</Label>
              <Input type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Salvando..." : "Alterar senha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir categoria?"
        description="Só é possível excluir categorias sem produtos vinculados."
        onConfirm={handleDeleteCategory}
        loading={deleteCategory.isPending}
      />

      <ConfirmDialog
        open={!!disconnectShop}
        onOpenChange={(open) => !open && setDisconnectShop(null)}
        title={`Desconectar ${disconnectShop?.shopName ?? "loja Shopee"}?`}
        description="Produtos e vendas já sincronizados continuam no sistema. Você pode conectar a loja de novo depois."
        confirmLabel="Desconectar"
        onConfirm={handleDisconnectShopee}
        loading={disconnectShopee.isPending}
      />
    </div>
  );
}
