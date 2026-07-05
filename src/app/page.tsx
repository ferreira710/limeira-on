"use client";

import {
  AlertTriangle,
  Building,
  ChevronRight,
  Clock,
  Loader2,
  LogIn,
  MapPin,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

type Chamado = {
  id: string;
  titulo: string;
  status: "aberto" | "em_andamento" | "concluido";
  created_at: string;
  categoria: string;
};

const statusMap = {
  aberto: { label: "Aberto", variant: "destructive" },
  em_andamento: { label: "Em andamento", variant: "warning" },
  concluido: { label: "Concluído", variant: "success" },
} as const;

const statusColorMap = {
  aberto: "bg-red-500",
  em_andamento: "bg-yellow-500",
  concluido: "bg-green-500",
};

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [chamadosRecentes, setChamadosRecentes] = useState<Chamado[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(true);

  // Buscar usuário logado
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, [supabase]);

  // Buscar chamados recentes do usuário (apenas se logado)
  useEffect(() => {
    const fetchChamados = async () => {
      try {
        setLoadingChamados(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setChamadosRecentes([]);
          setLoadingChamados(false);
          return;
        }

        const { data, error } = await supabase
          .from("chamados")
          .select("id, titulo, status, created_at, categoria")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) {
          console.error("❌ Erro na consulta de chamados:", error); // Agora mostra o objeto completo
          throw error;
        }

        setChamadosRecentes(data || []);
      } catch (error) {
        console.error("❌ Erro ao buscar chamados:", error);
        setChamadosRecentes([]);
      } finally {
        setLoadingChamados(false);
      }
    };

    fetchChamados();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setChamadosRecentes([]); // Limpa a lista ao deslogar
  };

  // Formatar data
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

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        {/* ===== 1. HEADER ===== */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
              L
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Limeira ON
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sair
                </Button>
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-green-100">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url || undefined}
                  />
                  <AvatarFallback>
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
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

        {/* ===== 2. BOAS-VINDAS ===== */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Olá{user ? `, ${user.email?.split("@")[0]}` : ", Cidadão!"} 👋
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            {user
              ? "Aqui estão os seus chamados recentes"
              : "Faça login para acompanhar seus chamados"}
          </p>
        </div>

        {/* ===== 3. BOTÃO PRINCIPAL ===== */}
        <Link href={user ? "/novo-chamado" : "/login"} className="block w-full">
          <Button
            variant="destructive"
            className="w-full h-16 sm:h-20 text-base sm:text-lg font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 mb-8 rounded-xl"
          >
            <AlertTriangle className="w-6 h-6" />
            {user ? "REPORTAR UM PROBLEMA" : "ENTRAR PARA REPORTAR"}
          </Button>
        </Link>

        {/* ===== 4. ATALHOS RÁPIDOS ===== */}
        <div className="grid grid-cols-3 justify-center gap-3 mb-8">
          <Link href={user ? "/meus-chamados" : "/login"}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 bg-white shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 gap-1">
                <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                  Meus Chamados
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link
            href="https://www.limeira.sp.gov.br/secretarias/obras-e-servicos-publicos/acompanhamento-de-obras"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 bg-white shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 gap-1">
                <Building className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                  Obras
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href={user ? "/sugestoes" : "/login"}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 bg-white shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-5 gap-1">
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                  Sugestões
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ===== 5. FEED PÚBLICO ===== */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
            📋 Atividades Recentes
          </h3>
          {user && chamadosRecentes.length > 0 && (
            <Link href="/meus-chamados">
              <span className="text-xs sm:text-sm text-green-600 font-medium flex items-center cursor-pointer">
                Ver todos <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          )}
        </div>

        {/* Estado 1: Carregando */}
        {loadingChamados && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <span className="ml-2 text-gray-500 text-sm">Carregando...</span>
          </div>
        )}

        {/* Estado 2: Deslogado */}
        {!loadingChamados && !user && (
          <Card className="border-dashed border-2 border-gray-200 bg-white/50">
            <CardContent className="p-6 text-center">
              <LogIn className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm font-medium">
                Faça login para visualizar seus chamados
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Acompanhe o status dos seus problemas reportados
              </p>
              <Link href="/login">
                <Button variant="outline" size="sm" className="mt-3">
                  Entrar agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Estado 3: Logado, mas sem chamados */}
        {!loadingChamados && user && chamadosRecentes.length === 0 && (
          <Card className="border-dashed border-2 border-gray-200 bg-white/50">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 text-sm">Nenhum chamado recente.</p>
              <p className="text-xs text-gray-400 mt-1">
                Clique em "REPORTAR" para abrir o seu primeiro chamado!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Estado 4: Logado com chamados */}
        {!loadingChamados && user && chamadosRecentes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {chamadosRecentes.map((chamado) => (
              <Card
                key={chamado.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full ${statusColorMap[chamado.status]} flex-shrink-0`}
                    />
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {chamado.titulo}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {formatarData(chamado.created_at)}
                        </span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400 capitalize">
                          {chamado.categoria.replace("-", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={statusMap[chamado.status]?.variant as any}
                    className="flex-shrink-0 ml-2 text-xs"
                  >
                    {statusMap[chamado.status]?.label}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
          <p>Versão 0.1.0 • Dados em tempo real</p>
        </div>
      </div>
    </main>
  );
}
