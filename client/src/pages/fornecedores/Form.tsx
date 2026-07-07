import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useSupplier, useCreateSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Informe o nome"),
  whatsapp: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function FornecedorForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: supplier } = useSupplier(id);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        whatsapp: supplier.whatsapp ?? "",
        city: supplier.city ?? "",
        notes: supplier.notes ?? "",
      });
    }
  }, [supplier, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (isEditing) {
        await updateSupplier.mutateAsync({ id: id!, data: values });
      } else {
        await createSupplier.mutateAsync(values);
      }
      toast({ title: isEditing ? "Fornecedor atualizado" : "Fornecedor criado", variant: "success" });
      navigate("/fornecedores");
    } catch (err) {
      toast({
        title: "Não foi possível salvar o fornecedor",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">{isEditing ? "Editar fornecedor" : "Novo fornecedor"}</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input placeholder="(11) 99999-9999" {...register("whatsapp")} />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input {...register("city")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={3} {...register("notes")} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/fornecedores")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>
                {createSupplier.isPending || updateSupplier.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
