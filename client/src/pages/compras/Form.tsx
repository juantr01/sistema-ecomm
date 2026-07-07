import { useNavigate } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/shared/Combobox";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { useCreatePurchase } from "@/hooks/usePurchases";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

const itemSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantity: z.coerce.number().int().positive("Informe uma quantidade válida"),
  unitCost: z.coerce.number().min(0, "Informe um valor válido"),
});

const schema = z.object({
  supplierId: z.string().min(1, "Selecione um fornecedor"),
  purchaseDate: z.string().min(1, "Informe a data"),
  freight: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Adicione ao menos um item"),
});

type FormValues = z.infer<typeof schema>;

export default function CompraForm() {
  const navigate = useNavigate();
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts({ active: true });
  const createPurchase = useCreatePurchase();

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      purchaseDate: new Date().toISOString().slice(0, 10),
      freight: 0,
      items: [{ productId: "", quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const freight = watch("freight") || 0;
  const itemsTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0), 0);

  async function onSubmit(values: FormValues) {
    try {
      await createPurchase.mutateAsync(values);
      toast({ title: "Compra registrada", variant: "success" });
      navigate("/compras");
    } catch (err) {
      toast({
        title: "Não foi possível registrar a compra",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  const productOptions = (products ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/compras")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Nova compra</h1>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Fornecedor</Label>
                <Controller
                  control={control}
                  name="supplierId"
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione o fornecedor"
                      options={(suppliers ?? []).map((s) => ({ value: s.id, label: s.name }))}
                    />
                  )}
                />
                {errors.supplierId && <p className="text-xs text-destructive">{errors.supplierId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Data da compra</Label>
                <Input type="date" {...register("purchaseDate")} />
                {errors.purchaseDate && <p className="text-xs text-destructive">{errors.purchaseDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens da compra</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}
                >
                  <Plus className="h-4 w-4" /> Adicionar item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-start"
                  >
                    <div className="space-y-1.5 sm:flex-1">
                      <Label className="text-xs text-muted-foreground">Produto</Label>
                      <Controller
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <Combobox value={field.value} onChange={field.onChange} options={productOptions} placeholder="Produto" />
                        )}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1.5 sm:w-24 sm:flex-none">
                        <Label className="text-xs text-muted-foreground">Qtd.</Label>
                        <Input type="number" min={1} step={1} {...register(`items.${index}.quantity`)} />
                      </div>
                      <div className="flex-1 space-y-1.5 sm:w-32 sm:flex-none">
                        <Label className="text-xs text-muted-foreground">Custo unit. (R$)</Label>
                        <Input type="number" min={0} step="0.01" {...register(`items.${index}.unitCost`)} />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 sm:mt-6"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {errors.items?.message && <p className="text-xs text-destructive">{errors.items.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Frete (R$)</Label>
                <Input type="number" min={0} step="0.01" {...register("freight")} />
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea rows={1} {...register("notes")} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Total (produtos + frete)</span>
              <span className="font-semibold">{formatCurrency(itemsTotal + Number(freight))}</span>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/compras")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPurchase.isPending}>
                {createPurchase.isPending ? "Salvando..." : "Registrar compra"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
