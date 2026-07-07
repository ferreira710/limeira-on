// src/app/login/page.tsx
"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Redireciona para a home após o login
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setMessage(`Erro: ${error.message}`);
        return;
      }

      setMessage("📧 Link mágico enviado! Verifique seu e-mail.");
      // Aguarda a confirmação (o usuário clica no link e volta para o app)
      // Podemos redirecionar automaticamente após alguns segundos, mas é melhor esperar o clique no e-mail.
      // Vamos apenas orientar o usuário.
    } catch {
      setMessage("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            🔐 Acesse o Limeira ON
          </CardTitle>
          <p className="text-sm text-gray-500 text-center">
            Use seu e-mail para receber um link mágico
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              variant="green"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Entrar com link mágico"
              )}
            </Button>
          </form>
          {message && (
            <div
              className={`mt-4 text-sm ${message.includes("Erro") ? "text-red-500" : "text-green-600"}`}
            >
              {message}
            </div>
          )}
          <div className="mt-4 text-xs text-gray-400 text-center">
            Ao clicar, você receberá um e-mail com um link para acessar.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
