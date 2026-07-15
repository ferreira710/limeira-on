export type Chamado = {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  endereco: string;
  status: "aberto" | "em_andamento" | "concluido";
  foto_url: string | null;
  created_at: string;
  user_id: string;
  tipo: "chamado";
  usuarios?: { email: string };
};
