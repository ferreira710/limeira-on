"use client";

import { ArrowLeft, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Chamado } from "@/types/chamado";
import { createClient } from "@/utils/supabase/client";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

type Status = "aberto" | "em_andamento" | "concluido";

const statusMap: Record<Status, { label: string; variant: BadgeVariant }> = {
  aberto: { label: "Aberto", variant: "destructive" },
  em_andamento: { label: "Em andamento", variant: "warning" },
  concluido: { label: "Concluído", variant: "success" },
};

export default function MeusChamadosPage() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Status | "todos">("todos");
  const [busca, setBusca] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchChamados = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setChamados([]);
          return;
        }

        const { data, error } = await supabase
          .from("chamados")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar chamados:", error);
          return;
        }

        setChamados(data || []);
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChamados();
  }, [supabase]);

  const chamadosFiltrados = chamados.filter((chamado) => {
    const matchStatus = filtro === "todos" || chamado.status === filtro;
    const matchBusca =
      chamado.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      chamado.endereco.toLowerCase().includes(busca.toLowerCase());
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
            Meus Chamados
          </h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por título ou endereço..."
            className="pl-9 bg-white"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-gray-200">
          {["todos", "aberto", "em_andamento", "concluido"].map((status) => (
            <Button
              key={status}
              variant={filtro === status ? "green" : "outline"}
              size="sm"
              className="rounded-full px-4 text-sm capitalize"
              onClick={() => setFiltro(status as Status | "todos")}
            >
              {status === "todos"
                ? "Todos"
                : statusMap[status as Status]?.label || status}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-500">Carregando...</span>
          </div>
        ) : chamadosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum chamado encontrado</p>
            <p className="text-xs text-gray-400 mt-1">
              {busca || filtro !== "todos"
                ? "Tente ajustar os filtros ou a busca"
                : "Você ainda não abriu nenhum chamado"}
            </p>
            {!busca && filtro === "todos" && (
              <Link href="/novo-chamado">
                <Button variant="green" className="mt-4">
                  Abrir meu primeiro chamado
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {chamadosFiltrados.map((chamado) => (
              <Link href={`/chamado/${chamado.id}`} key={chamado.id}>
                <Card
                  key={chamado.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 text-sm sm:text-base truncate">
                          {chamado.titulo}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                          {chamado.endereco}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant={statusMap[chamado.status]?.variant}>
                            {statusMap[chamado.status]?.label}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatarData(chamado.created_at)}
                          </span>
                          {chamado.foto_url && (
                            <span className="text-xs text-blue-500">📷</span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-50 self-start shrink-0"
                      >
                        #{chamado.id.slice(0, 8)}
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
