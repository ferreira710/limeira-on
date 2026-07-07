"use client";

import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

type Sugestao = {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  status: "pendente" | "em_analise" | "implementado" | "recusado";
  created_at: string;
  user_id: string;
};

const statusMap = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise: { label: "Em análise", variant: "warning" },
  implementado: { label: "Implementado", variant: "success" },
  recusado: { label: "Recusado", variant: "destructive" },
} as const;

export default function SugestaoDetalhesPage() {
  const params = useParams();
  const supabase = createClient();
  const [sugestao, setSugestao] = useState<Sugestao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSugestao = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("sugestoes")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setSugestao(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Erro ao carregar sugestão");
      } finally {
        setLoading(false);
      }
    };

    fetchSugestao();
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
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        <span className="ml-2 text-gray-500">Carregando...</span>
      </main>
    );
  }

  if (error || !sugestao) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-500">{error || "Sugestão não encontrada"}</p>
            <Link href="/minhas-sugestoes">
              <Button variant="outline" className="mt-4">
                Voltar para minhas sugestões
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
          <Link href="/minhas-sugestoes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
            {sugestao.titulo}
          </h1>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge
                variant={statusMap[sugestao.status]?.variant}
                className="text-sm"
              >
                {statusMap[sugestao.status]?.label}
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                {formatarData(sugestao.created_at)}
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">
                Categoria
              </span>
              <p className="text-gray-800 capitalize">
                {sugestao.categoria.replace("-", " ")}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">
                Descrição
              </span>
              <p className="text-gray-700 whitespace-pre-wrap">
                {sugestao.descricao}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
              Protocolo #{sugestao.id.slice(0, 8)}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4">
          <Link href="/minhas-sugestoes">
            <Button variant="outline" className="w-full">
              Voltar para minhas sugestões
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
