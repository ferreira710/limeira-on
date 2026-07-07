"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Camera, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const chamadoSchema = z.object({
  titulo: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z
    .string()
    .min(10, "Descreva o problema com pelo menos 10 caracteres"),
  endereco: z.string().min(3, "Informe o endereço"),
});

type ChamadoFormData = z.infer<typeof chamadoSchema>;

export default function NovoChamadoPage() {
  const router = useRouter();
  const [foto, setFoto] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const supabase = createClient();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ChamadoFormData>({
    resolver: zodResolver(chamadoSchema),
    defaultValues: {
      titulo: "",
      categoria: "",
      descricao: "",
      endereco: "",
    },
  });

  const uploadFoto = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `chamados/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("Imagens")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("Imagens")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Função para obter a localização atual e preencher o endereço
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning("Seu navegador não suporta geolocalização.");
      return;
    }

    setIsLoadingAddress(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Usa a API Nominatim (OpenStreetMap) para geocodificação reversa
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pt`
          );
          const data = await response.json();

          if (data?.display_name) {
            setValue("endereco", data.display_name);
            toast.success("Endereço obtido com sucesso!");
          } else {
            toast.error("Não foi possível obter o endereço.");
          }
        } catch (error) {
          console.error("Erro na geocodificação:", error);
          toast.error("Erro ao buscar endereço. Tente novamente.");
        } finally {
          setIsLoadingAddress(false);
        }
      },
      (error) => {
        console.error("Erro de geolocalização:", error);
        toast.error("Não foi possível obter sua localização. Verifique as permissões.");
        setIsLoadingAddress(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const onSubmit = async (data: ChamadoFormData) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Você precisa estar logado para abrir um chamado.");
        return;
      }

      let fotoUrl: string | null = null;
      if (foto) {
        fotoUrl = await uploadFoto(foto);
      }

      const { error: insertError } = await supabase.from("chamados").insert({
        user_id: user.id,
        titulo: data.titulo,
        categoria: data.categoria,
        descricao: data.descricao,
        endereco: data.endereco,
        foto_url: fotoUrl,
        status: "aberto",
      });

      if (insertError) {
        console.error("Erro ao inserir:", insertError);
        toast.error("Erro ao salvar o chamado. Tente novamente.");
        return;
      }

      toast.success("Chamado registrado com sucesso!");
      reset();
      setFoto(null);
      router.push("/meus-chamados");
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar o chamado.");
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFoto(e.target.files[0]);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      }
    };
    checkUser();
  }, [supabase, router]);

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Novo Chamado
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Grid: 2 colunas no Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Título */}
            <div>
              <Label htmlFor="titulo">Título do problema</Label>
              <Input
                id="titulo"
                placeholder="Ex: Buraco na rua"
                {...control.register("titulo")}
              />
              {errors.titulo && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.titulo.message}
                </p>
              )}
            </div>

            {/* Categoria com Controller */}
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

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição detalhada</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o problema com detalhes..."
              rows={4}
              {...control.register("descricao")}
            />
            {errors.descricao && (
              <p className="text-sm text-red-500 mt-1">
                {errors.descricao.message}
              </p>
            )}
          </div>

          {/* Grid: 2 colunas no Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-end">
            {/* Endereço com botão de localização */}
            <div>
              <Label htmlFor="endereco">
                Endereço (ou ponto de referência)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="endereco"
                  placeholder="Ex: Rua XV de Novembro, 123"
                  className="flex-1"
                  {...control.register("endereco")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={getCurrentLocation}
                  disabled={isLoadingAddress}
                  className="flex-shrink-0"
                  title="Usar localização atual"
                >
                  {isLoadingAddress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.endereco && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.endereco.message}
                </p>
              )}
            </div>

            {/* Upload de foto */}
            <div>
              <Label htmlFor="foto">Foto do problema (opcional)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById("foto-input")?.click()}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4" />
                  {isUploading
                    ? "Enviando..."
                    : foto
                      ? "Trocar foto"
                      : "Adicionar foto"}
                </Button>
                <input
                  id="foto-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFotoChange}
                />
                {foto && (
                  <span className="text-sm text-gray-600 truncate max-w-[150px] sm:max-w-[200px]">
                    {foto.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botão enviar */}
          <Button
            type="submit"
            variant="green"
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl mt-4"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              "ENVIAR CHAMADO"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
