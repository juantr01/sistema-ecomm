import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/shared/Combobox";
import { useProducts } from "@/hooks/useProducts";
import { useCreateSale } from "@/hooks/useSales";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

const schema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.coerce.number().int().positive("Informe uma quantidade válida"),
  unitCost: z.coerce.number().min(0, "Informe o custo do produto"),
  totalAmount: z.coerce.number().positive("Informe um valor válido"),
  saleDate: z.string().min(1, "Informe a data"),
});

type FormValues = z.infer<typeof schema>;

export default function VendaForm() {
  const navigate = useNavigate();
  const { data: products } = useProducts({ active: true });
  const createSale = useCreateSale();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { saleDate: new Date().toISOString().slice(0, 10), unitCost: 0, quantity: 1 },
  });

  const selectedProductId = watch("productId");
  const quantity = watch("quantity");

  useEffect(() => {
    if (!selectedProductId || dirtyFields.unitCost) return;
    const product = products?.find((p) => p.id === selectedProductId);
    if (product) setValue("unitCost", product.costPrice);
  }, [selectedProductId, products, dirtyFields.unitCost, setValue]);

  useEffect(() => {
    if (!selectedProductId || dirtyFields.totalAmount) return;
    const product = products?.find((p) => p.id === selectedProductId);
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;
    if (product) setValue("totalAmount", Number((product.netReceivedPrice * qty).toFixed(2)));
  }, [selectedProductId, quantity, products, dirtyFields.totalAmount, setValue]);

  async function onSubmit(values: FormValues) {
    try {
      await createSale.mutateAsync(values);
      toast({ title: "Venda registrada", variant: "success" });
      navigate("/vendas");
    } catch (err) {
      toast({
        title: "Não foi possível registrar a venda",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Nova venda</h1>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Produto</Label>
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione o produto"
                    options={(products ?? []).map((p) => ({
                      value: p.id,
                      label:
                        p.sourceType === "OWN_STOCK"
                          ? `${p.name} (${p.sku}) — estoque: ${p.stockQuantity}`
                          : `${p.name} (${p.sku}) — Drop`,
                    }))}
                  />
                )}
              />
              {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" min={1} step={1} {...register("quantity")} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Custo do produto (R$)</Label>
                <Input type="number" min={0} step="0.01" {...register("unitCost")} />
                {errors.unitCost && <p className="text-xs text-destructive">{errors.unitCost.message}</p>}
              </div>
              <div className="col-span-1 space-y-1.5 sm:col-span-2">
                <Label>Valor recebido da plataforma (R$)</Label>
                <Input type="number" min={0} step="0.01" {...register("totalAmount")} />
                {errors.totalAmount && <p className="text-xs text-destructive">{errors.totalAmount.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Data da venda</Label>
              <Input type="date" {...register("saleDate")} />
              {errors.saleDate && <p className="text-xs text-destructive">{errors.saleDate.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/vendas")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSale.isPending}>
                {createSale.isPending ? "Salvando..." : "Registrar venda"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
