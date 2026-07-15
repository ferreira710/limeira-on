"use client";

import type { User } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Building,
  Lightbulb,
  Loader2,
  LogIn,
  MapPin,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Atividade } from "@/types/atividade";
import { createClient } from "@/utils/supabase/client";

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

const statusColorMap = {
  chamado: {
    aberto: "bg-red-500",
    em_andamento: "bg-yellow-500",
    concluido: "bg-green-500",
  },
  sugestao: {
    pendente: "bg-blue-500",
    em_analise: "bg-yellow-500",
    implementado: "bg-green-500",
    recusado: "bg-red-500",
  },
};

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [atividadesRecentes, setAtividadesRecentes] = useState<Atividade[]>([]);
  const [loadingAtividades, setLoadingAtividades] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", user.id)
          .single();
        if (!error && data?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdminRole();
  }, [user, supabase]);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        setLoadingAtividades(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAtividadesRecentes([]);
          setLoadingAtividades(false);
          return;
        }

        const { data: chamados, error: chamadosError } = await supabase
          .from("chamados")
          .select("id, titulo, status, created_at, categoria, descricao, endereco, foto_url, user_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4);

        if (chamadosError) throw chamadosError;

        const { data: sugestoes, error: sugestoesError } = await supabase
          .from("sugestoes")
          .select("id, titulo, status, created_at, categoria, user_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4);

        if (sugestoesError) throw sugestoesError;

        const chamadosComTipo: Atividade[] = (chamados || []).map((c) => ({
          ...c,
          tipo: "chamado" as const,
        }));

        const sugestoesComTipo: Atividade[] = (sugestoes || []).map((s) => ({
          ...s,
          tipo: "sugestao" as const,
        }));

        const todas = [...chamadosComTipo, ...sugestoesComTipo];
        todas.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setAtividadesRecentes(todas.slice(0, 4));
      } catch (error) {
        console.error("❌ Erro ao buscar atividades:", error);
        setAtividadesRecentes([]);
      } finally {
        setLoadingAtividades(false);
      }
    };

    fetchAtividades();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAtividadesRecentes([]);
  };

  const formatarData = (data: string) => {
    const agora = new Date();
    const criado = new Date(data);
    const diffMs = agora.getTime() - criado.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));

    if (diffMin < 1) return "agora mesmo";
    if (diffMin < 60) return `${diffMin} min atrás`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `${diffHoras} h atrás`;
    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias === 1) return "ontem";
    return criado.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const obterStatus = (atividade: Atividade) => {
    if (atividade.tipo === "chamado") {
      const s = statusChamadoMap[atividade.status as keyof typeof statusChamadoMap];
      return s || { label: "Desconhecido", variant: "outline" };
    } else {
      const s = statusSugestaoMap[atividade.status as keyof typeof statusSugestaoMap];
      return s || { label: "Desconhecido", variant: "outline" };
    }
  };

  const obterCorStatus = (atividade: Atividade) => {
    if (atividade.tipo === "chamado") {
      return (
        statusColorMap.chamado[
        atividade.status as keyof typeof statusColorMap.chamado
        ] || "bg-gray-400"
      );
    } else {
      return (
        statusColorMap.sugestao[
        atividade.status as keyof typeof statusColorMap.sugestao
        ] || "bg-gray-400"
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        {/* HEADER */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex flex-row gap-1 text-xl sm:text-2xl font-bold text-gray-900">
              <Image
                src="/limeira.svg"
                alt="Logo de Limeira"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              Limeira ON
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                    >
                      <ShieldCheck className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Admin</span>
                      <span className="sm:hidden">Admin</span>
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                >
                  Sair
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="green" size="sm">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* BOAS-VINDAS */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 uppercase">
            Olá{user ? `, ${user.email?.split("@")[0]}` : ", Cidadão!"} 👋
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            {user
              ? "Aqui estão as suas atividades recentes"
              : "Faça login para acompanhar suas atividades"}
          </p>
        </div>

        {/* BOTÕES PRINCIPAIS */}
        <Link href={user ? "/novo-chamado" : "/login"} className="block w-full">
          <Button
            variant="destructive"
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 flex items-center justify-center gap-2 mb-4 rounded-xl cursor-pointer"
          >
            <AlertTriangle className="w-6 h-6" />
            {user ? "REPORTAR UM PROBLEMA" : "ENTRAR PARA REPORTAR"}
          </Button>
        </Link>

        <Link href={user ? "/nova-sugestao" : "/login"} className="block w-full cursor-pointer">
          <Button
            variant="blue"
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 mb-6 rounded-xl cursor-pointer"
          >
            <Lightbulb className="w-6 h-6" />
            {user ? "ENVIAR SUGESTÃO" : "ENTRAR PARA SUGERIR"}
          </Button>
        </Link>

        {/* ATALHOS RÁPIDOS - com hover melhorado */}
        <div className="grid grid-cols-3 justify-center gap-3 mb-8">
          <Link href={user ? "/meus-chamados" : "/login"} className="block">
            <Card className="cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-0 bg-white shadow-sm h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 gap-1 min-h-24">
                <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center group-hover:text-green-700 transition-colors">
                  Meus Chamados
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href={user ? "/minhas-sugestoes" : "/login"} className="block">
            <Card className="cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-0 bg-white shadow-sm h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 gap-1 min-h-24">
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center group-hover:text-orange-700 transition-colors">
                  Minhas Sugestões
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="https://www.limeira.sp.gov.br/secretarias/obras-e-servicos-publicos/acompanhamento-de-obras"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 border-0 bg-white shadow-sm h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 gap-1 min-h-24">
                <Building className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center group-hover:text-purple-700 transition-colors">
                  Obras
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ATIVIDADES RECENTES */}
        {loadingAtividades && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <span className="ml-2 text-gray-500 text-sm">Carregando...</span>
          </div>
        )}

        {!loadingAtividades && !user && (
          <Card className="border-dashed border-2 border-gray-200 bg-white/50">
            <CardContent className="p-6 text-center">
              <LogIn className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm font-medium">
                Faça login para visualizar suas atividades
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Acompanhe o status dos seus chamados e sugestões
              </p>
              <Link href="/login">
                <Button variant="outline" size="sm" className="mt-3 hover:bg-gray-100 transition-colors">
                  Entrar agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!loadingAtividades && user && atividadesRecentes.length === 0 && (
          <Card className="border-dashed border-2 border-gray-200 bg-white/50">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 text-sm">
                Nenhuma atividade recente.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Abra um chamado ou envie uma sugestão para começar!
              </p>
            </CardContent>
          </Card>
        )}

        {!loadingAtividades && user && atividadesRecentes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {atividadesRecentes.map((atividade) => {
              const status = obterStatus(atividade);
              const cor = obterCorStatus(atividade);
              return (
                <Link
                  key={`${atividade.tipo}-${atividade.id}`}
                  href={
                    atividade.tipo === "chamado"
                      ? `/chamado/${atividade.id}`
                      : `/sugestao/${atividade.id}`
                  }
                  className="block no-underline"
                >
                  <Card className="cursor-pointer border-0 shadow-sm hover:shadow-lg hover:bg-gray-50/70 transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full ${cor} shrink-0`}
                        />
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-1">
                            {atividade.titulo}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatarData(atividade.created_at)}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400 capitalize">
                              {atividade.categoria.replace("-", " ")}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400 capitalize">
                              {atividade.tipo === "chamado"
                                ? "Chamado"
                                : "Sugestão"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={status.variant}
                        className="shrink-0 ml-2 text-xs"
                      >
                        {status.label}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
          <p>Versão 0.1.0 • Dados em tempo real</p>
        </div>
      </div>
    </main>
  );
}
