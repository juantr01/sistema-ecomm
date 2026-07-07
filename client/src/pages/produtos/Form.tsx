import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ImageOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/shared/Combobox";
import { useProduct, useCreateProduct, useUpdateProduct, useUploadProductImage } from "@/hooks/useProducts";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Informe o nome"),
  sku: z.string().min(1, "Informe o SKU"),
  categoryId: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  costPrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  trackStock: z.boolean(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProdutoForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data: product } = useProduct(id);
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createCategory = useCreateCategory();
  const uploadImage = useUploadProductImage();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      stockQuantity: 0,
      minStock: 0,
      costPrice: 0,
      salePrice: 0,
      trackStock: false,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId ?? undefined,
        color: product.color ?? "",
        size: product.size ?? "",
        stockQuantity: product.stockQuantity,
        minStock: product.minStock,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        trackStock: product.trackStock,
        notes: product.notes ?? "",
      });
      setPreview(product.imageUrl);
    }
  }, [product, reset]);

  async function handleCreateCategory(name: string) {
    const category = await createCategory.mutateAsync(name);
    return category;
  }

  async function onSubmit(values: FormValues) {
    try {
      let productId = id;
      if (isEditing) {
        await updateProduct.mutateAsync({ id: id!, data: values });
      } else {
        const created = await createProduct.mutateAsync(values);
        productId = created.id;
      }

      if (file && productId) {
        await uploadImage.mutateAsync({ id: productId, file });
      }

      toast({ title: isEditing ? "Produto atualizado" : "Produto criado", variant: "success" });
      navigate("/produtos");
    } catch (err) {
      toast({
        title: "Não foi possível salvar o produto",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/produtos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">{isEditing ? "Editar produto" : "Novo produto"}</h1>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted text-muted-foreground hover:bg-accent"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-6 w-6" />
                )}
              </button>
              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Enviar foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-1 space-y-1.5 sm:col-span-2">
                <Label>Nome</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input {...register("sku")} />
                {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione a categoria"
                      options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                      onCreate={async (name) => {
                        const created = await handleCreateCategory(name);
                        field.onChange(created.id);
                      }}
                      createLabel="Criar categoria"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Cor</Label>
                <Input {...register("color")} />
              </div>

              <div className="space-y-1.5">
                <Label>Tamanho</Label>
                <Input {...register("size")} />
              </div>

              <div className="col-span-1 flex items-center justify-between gap-3 rounded-md border p-3 sm:col-span-2">
                <div className="space-y-0.5">
                  <Label>Controlar estoque deste produto</Label>
                  <p className="text-xs text-muted-foreground">
                    Ative só se você mantém estoque físico deste item. Produtos de dropshipping devem ficar desativados
                    e não aparecem na aba Estoque.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="trackStock"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Estoque atual</Label>
                <Input type="number" min={0} step={1} {...register("stockQuantity")} />
              </div>

              <div className="space-y-1.5">
                <Label>Estoque mínimo</Label>
                <Input type="number" min={0} step={1} {...register("minStock")} />
              </div>

              <div className="space-y-1.5">
                <Label>Custo unitário (R$)</Label>
                <Input type="number" min={0} step="0.01" {...register("costPrice")} />
              </div>

              <div className="space-y-1.5">
                <Label>Preço de venda (R$)</Label>
                <Input type="number" min={0} step="0.01" {...register("salePrice")} />
              </div>

              <div className="col-span-1 space-y-1.5 sm:col-span-2">
                <Label>Observações</Label>
                <Textarea rows={3} {...register("notes")} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/produtos")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {createProduct.isPending || updateProduct.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
