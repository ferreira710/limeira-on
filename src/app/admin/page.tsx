"use client";

import { ExternalLink, Loader2, LogOut, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";

type Chamado = {
  id: string;
  titulo: string;
  endereco: string;
  status: "aberto" | "em_andamento" | "concluido";
  created_at: string;
  user_id: string;
  usuarios?: { email: string };
};

type Sugestao = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: "pendente" | "em_analise" | "implementado" | "recusado";
  created_at: string;
  user_id: string;
  usuarios?: { email: string };
};

const statusChamadoMap = {
  aberto: { label: "Aberto", variant: "destructive" },
  em_andamento: { label: "Em andamento", variant: "warning" },
  concluido: { label: "Concluído", variant: "success" },
} as const;

const statusSugestaoMap = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise: { label: "Em análise", variant: "warning" },
  implementado: { label: "Implementado", variant: "success" },
  recusado: { label: "Recusado", variant: "destructive" },
} as const;

type ChamadoStatus = keyof typeof statusChamadoMap;
type SugestaoStatus = keyof typeof statusSugestaoMap;

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterChamadoStatus, setFilterChamadoStatus] = useState<
    ChamadoStatus | "todos"
  >("todos");
  const [filterSugestaoStatus, setFilterSugestaoStatus] = useState<
    SugestaoStatus | "todos"
  >("todos");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: chamadosData, error: chamadosError } = await supabase
        .from("chamados")
        .select("*, usuarios(email)")
        .order("created_at", { ascending: false });

      if (chamadosError) throw chamadosError;
      setChamados(chamadosData || []);

      const { data: sugestoesData, error: sugestoesError } = await supabase
        .from("sugestoes")
        .select("*, usuarios(email)")
        .order("created_at", { ascending: false });

      if (sugestoesError) throw sugestoesError;
      setSugestoes(sugestoesData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Atualizar status de um chamado
  const updateChamadoStatus = async (id: string, novoStatus: ChamadoStatus) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from("chamados")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) throw error;

      // Atualiza localmente sem recarregar tudo
      setChamados((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: novoStatus } : c)),
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Atualizar status de uma sugestão
  const updateSugestaoStatus = async (
    id: string,
    novoStatus: SugestaoStatus,
  ) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from("sugestoes")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) throw error;

      setSugestoes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: novoStatus } : s)),
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/login");
          return;
        }

        const { data, error: roleError } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", user.id)
          .single();

        if (roleError || !data) {
          console.error("Usuário não encontrado na tabela usuarios");
          router.push("/");
          return;
        }

        if (data.role !== "admin") {
          router.push("/");
          return;
        }

        setIsAdmin(true);
        fetchData();
      } catch (err) {
        console.error("Erro ao verificar admin:", err);
        router.push("/");
      }
    };

    checkAdmin();
  }, [supabase, router, fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Estatísticas
  const chamadosStats = {
    total: chamados.length,
    aberto: chamados.filter((c) => c.status === "aberto").length,
    em_andamento: chamados.filter((c) => c.status === "em_andamento").length,
    concluido: chamados.filter((c) => c.status === "concluido").length,
  };

  const sugestoesStats = {
    total: sugestoes.length,
    pendente: sugestoes.filter((s) => s.status === "pendente").length,
    em_analise: sugestoes.filter((s) => s.status === "em_analise").length,
    implementado: sugestoes.filter((s) => s.status === "implementado").length,
    recusado: sugestoes.filter((s) => s.status === "recusado").length,
  };

  // Filtros
  const chamadosFiltrados =
    filterChamadoStatus === "todos"
      ? chamados
      : chamados.filter((c) => c.status === filterChamadoStatus);

  const sugestoesFiltradas =
    filterSugestaoStatus === "todos"
      ? sugestoes
      : sugestoes.filter((s) => s.status === filterSugestaoStatus);

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            🏛️ Painel Administrativo
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Recarregar
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Estatísticas - Chamados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {chamadosStats.total}
              </p>
              <p className="text-xs text-gray-500">Total chamados</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {chamadosStats.aberto}
              </p>
              <p className="text-xs text-red-500">Abertos</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {chamadosStats.em_andamento}
              </p>
              <p className="text-xs text-yellow-500">Em andamento</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {chamadosStats.concluido}
              </p>
              <p className="text-xs text-green-500">Concluídos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chamados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chamados">
              Chamados ({chamados.length})
            </TabsTrigger>
            <TabsTrigger value="sugestoes">
              Sugestões ({sugestoes.length})
            </TabsTrigger>
          </TabsList>

          {/* Aba Chamados */}
          <TabsContent value="chamados" className="mt-4">
            {/* Filtro */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500 font-medium">
                Filtrar:
              </span>
              <Select
                value={filterChamadoStatus}
                onValueChange={(value: any) =>
                  setFilterChamadoStatus(value as ChamadoStatus | "todos")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : chamadosFiltrados.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Nenhum chamado encontrado.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {chamadosFiltrados.map((chamado) => (
                  <Card
                    key={chamado.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <h3 className="font-medium text-gray-800 truncate">
                              {chamado.titulo}
                            </h3>
                            <Link
                              href={`/chamado/${chamado.id}`}
                              target="_blank"
                              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-0.5">
                            <span>{chamado.endereco}</span>
                            <span className="text-xs">•</span>
                            <span className="text-xs">
                              {new Date(chamado.created_at).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                            <span className="text-xs">•</span>
                            <span className="text-xs text-gray-400">
                              {chamado.usuarios?.email ||
                                "Usuário desconhecido"}
                            </span>
                          </div>
                        </div>

                        {/* Status + Select */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge
                            variant={
                              statusChamadoMap[chamado.status]?.variant as any
                            }
                            className="text-xs"
                          >
                            {statusChamadoMap[chamado.status]?.label}
                          </Badge>
                          <Select
                            value={chamado.status}
                            onValueChange={(value: any) =>
                              updateChamadoStatus(
                                chamado.id,
                                value as ChamadoStatus,
                              )
                            }
                            disabled={updatingId === chamado.id}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue placeholder="Alterar status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aberto">Aberto</SelectItem>
                              <SelectItem value="em_andamento">
                                Em andamento
                              </SelectItem>
                              <SelectItem value="concluido">
                                Concluído
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {updatingId === chamado.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba Sugestões */}
          <TabsContent value="sugestoes" className="mt-4">
            {/* Filtro */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500 font-medium">
                Filtrar:
              </span>
              <Select
                value={filterSugestaoStatus}
                onValueChange={(value: any) =>
                  setFilterSugestaoStatus(value as SugestaoStatus | "todos")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_analise">Em análise</SelectItem>
                  <SelectItem value="implementado">Implementado</SelectItem>
                  <SelectItem value="recusado">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : sugestoesFiltradas.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Nenhuma sugestão encontrada.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sugestoesFiltradas.map((sugestao) => (
                  <Card
                    key={sugestao.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">
                            {sugestao.titulo}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-0.5">
                            <span className="capitalize">
                              {sugestao.categoria}
                            </span>
                            <span className="text-xs">•</span>
                            <span className="text-xs">
                              {new Date(sugestao.created_at).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                            <span className="text-xs">•</span>
                            <span className="text-xs text-gray-400">
                              {sugestao.usuarios?.email ||
                                "Usuário desconhecido"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {sugestao.descricao}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge
                            variant={
                              statusSugestaoMap[sugestao.status]?.variant as any
                            }
                            className="text-xs"
                          >
                            {statusSugestaoMap[sugestao.status]?.label}
                          </Badge>
                          <Select
                            value={sugestao.status}
                            onValueChange={(value: any) =>
                              updateSugestaoStatus(
                                sugestao.id,
                                value as SugestaoStatus,
                              )
                            }
                            disabled={updatingId === sugestao.id}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue placeholder="Alterar status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="em_analise">
                                Em análise
                              </SelectItem>
                              <SelectItem value="implementado">
                                Implementado
                              </SelectItem>
                              <SelectItem value="recusado">Recusado</SelectItem>
                            </SelectContent>
                          </Select>
                          {updatingId === sugestao.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Estatísticas - Sugestões (abaixo das tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {sugestoesStats.total}
              </p>
              <p className="text-xs text-gray-500">Total sugestões</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {sugestoesStats.pendente}
              </p>
              <p className="text-xs text-blue-500">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {sugestoesStats.em_analise}
              </p>
              <p className="text-xs text-yellow-500">Em análise</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {sugestoesStats.implementado}
              </p>
              <p className="text-xs text-green-500">Implementados</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
