"use client";

import { ArrowLeft, Lightbulb, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

type Sugestao = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: "pendente" | "em_analise" | "implementado" | "recusado";
  created_at: string;
};

const statusMap = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise: { label: "Em análise", variant: "warning" },
  implementado: { label: "Implementado", variant: "success" },
  recusado: { label: "Recusado", variant: "destructive" },
} as const;

type Status = keyof typeof statusMap;

export default function MinhasSugestoesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Status | "todos">("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchSugestoes = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("sugestoes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSugestoes(data || []);
      } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
        toast.error("Erro ao carregar suas sugestões.");
      } finally {
        setLoading(false);
      }
    };

    fetchSugestoes();
  }, [supabase, router]);

  const sugestoesFiltradas = sugestoes.filter((s) => {
    const matchStatus = filtro === "todos" || s.status === filtro;
    const matchBusca =
      s.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      s.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
            Minhas Sugestões
          </h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por título ou descrição..."
            className="pl-9 bg-white"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-gray-200">
          {["todos", "pendente", "em_analise", "implementado", "recusado"].map(
            (status) => (
              <Button
                key={status}
                variant={filtro === status ? "blue" : "outline"}
                size="sm"
                className="rounded-full px-4 text-sm capitalize"
                onClick={() => setFiltro(status as Status | "todos")}
              >
                {status === "todos"
                  ? "Todos"
                  : statusMap[status as Status]?.label || status}
              </Button>
            )
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            <span className="ml-2 text-gray-500">Carregando...</span>
          </div>
        ) : sugestoesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma sugestão encontrada</p>
            <p className="text-xs text-gray-400 mt-1">
              {busca || filtro !== "todos"
                ? "Tente ajustar os filtros ou a busca"
                : "Você ainda não enviou nenhuma sugestão"}
            </p>
            {!busca && filtro === "todos" && (
              <Link href="/sugestoes">
                <Button variant="blue" className="mt-4">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Enviar minha primeira sugestão
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {sugestoesFiltradas.map((sugestao) => (
              <Link href={`/sugestao/${sugestao.id}`} key={sugestao.id}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 text-sm sm:text-base truncate">
                          {sugestao.titulo}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">
                          {sugestao.descricao}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant={statusMap[sugestao.status]?.variant}>
                            {statusMap[sugestao.status]?.label}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatarData(sugestao.created_at)}
                          </span>
                          <span className="text-xs text-gray-400 capitalize">
                            • {sugestao.categoria.replace("-", " ")}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-gray-50 self-start shrink-0">
                        #{sugestao.id.slice(0, 8)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
