import { createClient } from "@supabase/supabase-js";

// Variáveis de ambiente do Vite precisam do prefixo VITE_
// para serem expostas ao frontend. Isso é uma medida de segurança:
// variáveis sem o prefixo ficam apenas no servidor de build.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. " +
      "Copie .env.example para .env e preencha com os valores do seu projeto Supabase."
  );
}

// A anon key é segura para expor no frontend porque o Supabase
// usa Row Level Security (RLS) para controlar acesso.
// Sem RLS habilitado, qualquer pessoa com a anon key poderia ler tudo.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
