export type Sugestao = {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  status: "pendente" | "em_analise" | "implementado" | "recusado";
  created_at: string;
  tipo: "sugestao";
  usuarios?: { email: string };
};
