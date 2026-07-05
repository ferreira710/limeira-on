/** biome-ignore-all lint/performance/noImgElement: <auto explain> */
"use client";

import { ArrowLeft, Calendar, Camera, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

type Chamado = {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  endereco: string;
  status: "aberto" | "em_andamento" | "concluido";
  foto_url: string | null;
  created_at: string;
  user_id: string;
};

const statusMap = {
  aberto: { label: "Aberto", variant: "destructive" },
  em_andamento: { label: "Em andamento", variant: "warning" },
  concluido: { label: "Concluído", variant: "success" },
} as const;

export default function ChamadoDetalhesPage() {
  const params = useParams();
  const supabase = createClient();
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChamado = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("chamados")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setChamado(data);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar chamado");
      } finally {
        setLoading(false);
      }
    };

    fetchChamado();
  }, [params.id, supabase]);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-500">Carregando...</span>
      </main>
    );
  }

  if (error || !chamado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-500">{error || "Chamado não encontrado"}</p>
            <Link href="/">
              <Button variant="outline" className="mt-4">
                Voltar para Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl lg:max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/meus-chamados">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
            {chamado.titulo}
          </h1>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {/* Status e Data */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge
                variant={statusMap[chamado.status]?.variant as any}
                className="text-sm"
              >
                {statusMap[chamado.status]?.label}
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                {formatarData(chamado.created_at)}
              </div>
            </div>

            {/* Categoria */}
            <div>
              <span className="text-sm font-medium text-gray-500">
                Categoria
              </span>
              <p className="text-gray-800 capitalize">
                {chamado.categoria.replace("-", " ")}
              </p>
            </div>

            {/* Endereço */}
            <div>
              <span className="text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> Endereço
              </span>
              <p className="text-gray-800">{chamado.endereco}</p>
            </div>

            {/* Descrição */}
            <div>
              <span className="text-sm font-medium text-gray-500">
                Descrição
              </span>
              <p className="text-gray-700 whitespace-pre-wrap">
                {chamado.descricao}
              </p>
            </div>

            {/* Foto */}
            {chamado.foto_url && (
              <div>
                <span className="text-sm font-medium text-gray-500 flex items-center">
                  <Camera className="w-4 h-4 mr-1" /> Foto
                </span>
                <img
                  src={chamado.foto_url}
                  alt="Foto do problema"
                  className="mt-2 rounded-lg max-h-96 w-full object-contain border border-gray-200"
                />
              </div>
            )}

            {/* Número do protocolo */}
            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
              Protocolo #{chamado.id.slice(0, 8)}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4">
          <Link href="/meus-chamados">
            <Button variant="outline" className="w-full">
              Voltar para meus chamados
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
