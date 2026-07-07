"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lightbulb, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";

const sugestaoSchema = z.object({
  titulo: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z
    .string()
    .min(10, "Descreva sua sugestão com pelo menos 10 caracteres"),
});

type SugestaoFormData = z.infer<typeof sugestaoSchema>;

export default function NovaSugestaoPage() {
  const router = useRouter();
  const supabase = createClient();
  const {
    register,
    formState: { errors, isSubmitting },
    reset,
    handleSubmit,
    control,
  } = useForm<SugestaoFormData>({
    resolver: zodResolver(sugestaoSchema),
  });

  const onSubmit = async (data: SugestaoFormData) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Você precisa estar logado para enviar uma sugestão.");
        router.push("/login");
        return;
      }

      const { error: insertError } = await supabase.from("sugestoes").insert({
        user_id: user.id,
        titulo: data.titulo,
        categoria: data.categoria,
        descricao: data.descricao,
        status: "pendente",
      });

      if (insertError) {
        console.error(insertError);
        toast.error("Erro ao enviar sugestão. Tente novamente.");
        return;
      }

      toast.success("Sugestão enviada com sucesso!");
      reset();
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Erro inesperado.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Enviar Sugestão
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <Label htmlFor="titulo">Título da sugestão</Label>
              <Input
                id="titulo"
                placeholder="Ex: Melhorar iluminação na praça"
                {...register("titulo")}
              />
              {errors.titulo && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.titulo.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infraestrutura">
                        Infraestrutura (buracos, calçadas)
                      </SelectItem>
                      <SelectItem value="iluminacao">
                        Iluminação pública
                      </SelectItem>
                      <SelectItem value="lixo">
                        Coleta de lixo / entulho
                      </SelectItem>
                      <SelectItem value="area-verde">
                        Áreas verdes (podas, jardinagem)
                      </SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoria && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.categoria.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição detalhada</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva sua sugestão com o máximo de detalhes..."
              rows={4}
              {...register("descricao")}
            />
            {errors.descricao && (
              <p className="text-sm text-red-500 mt-1">
                {errors.descricao.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="green"
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-5 w-5" />
                ENVIAR SUGESTÃO
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
