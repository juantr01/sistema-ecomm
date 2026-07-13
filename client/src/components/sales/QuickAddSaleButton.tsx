import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
});

type FormValues = z.infer<typeof schema>;

export function QuickAddSaleButton() {
  const [open, setOpen] = useState(false);
  const { data: products } = useProducts({ active: true });
  const createSale = useCreateSale();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { unitCost: 0 } });

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
      reset({ productId: "", quantity: undefined, unitCost: 0, totalAmount: undefined } as any);
      setOpen(false);
    } catch (err) {
      toast({
        title: "Não foi possível registrar a venda",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Nova venda</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar venda</DialogTitle>
        </DialogHeader>
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
                  options={(products ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                />
              )}
            />
            {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSale.isPending}>
              {createSale.isPending ? "Salvando..." : "Registrar venda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
