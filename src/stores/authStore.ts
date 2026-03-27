// ============================================
// Auth Store — Zustand
// ============================================
// Gerencia o estado de autenticação globalmente.
// Qualquer componente pode acessar o usuário logado,
// fazer login/signup/logout sem prop drilling.
//
// Zustand é mais simples que Redux: sem reducers, actions,
// dispatchers. É basicamente um hook com estado compartilhado.
// ============================================

import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile } from "../types";

interface AuthState {
  // Estado
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  // Ações
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true, // Começa true porque precisamos checar a sessão existente
  error: null,

  /**
   * Inicializa a autenticação: verifica se já existe uma sessão ativa
   * (ex: usuário recarregou a página) e configura o listener de mudanças.
   * 
   * DEVE ser chamado uma vez, no mount do App.
   */
  initialize: async () => {
    try {
      // getSession verifica se há um token válido no localStorage.
      // O Supabase armazena tokens automaticamente.
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user, session, loading: false });
        // Buscar perfil em paralelo (não bloqueia o loading)
        get().fetchProfile(session.user.id);
      } else {
        set({ loading: false });
      }

      // onAuthStateChange é um listener que dispara quando:
      // - Usuário faz login/logout
      // - Token é renovado automaticamente (refresh)
      // - Sessão expira
      // Isso mantém o estado sincronizado sem precisar de polling.
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          user: session?.user ?? null,
          session: session ?? null,
        });

        if (session?.user) {
          get().fetchProfile(session.user.id);
        } else {
          set({ profile: null });
        }
      });
    } catch {
      set({ loading: false });
    }
  },

  /**
   * Registra um novo usuário.
   * O Supabase Auth cria o user, e o trigger no banco cria o profile automaticamente.
   * Retorna true se sucesso, false se erro.
   */
  signUp: async (email, password, username) => {
    set({ error: null, loading: true });

    try {
      // Verificar se o username já existe antes de criar o user,
      // para dar uma mensagem de erro mais clara.
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (existing) {
        set({ error: "Este nome de usuário já está em uso.", loading: false });
        return false;
      }

      // Criar o usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        set({ error: translateAuthError(error.message), loading: false });
        return false;
      }

      if (data.user) {
        // Atualizar o username no profile (o trigger cria com base no email).
        // Fazemos isso logo após o signup para garantir o username escolhido.
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username })
          .eq("id", data.user.id);

        if (profileError) {
          console.warn("Erro ao atualizar username:", profileError.message);
          // Não falha o signup por causa disso
        }

        set({ user: data.user, session: data.session, loading: false });
        get().fetchProfile(data.user.id);
      }

      set({ loading: false });
      return true;
    } catch {
      set({ error: "Erro inesperado ao criar conta.", loading: false });
      return false;
    }
  },

  /**
   * Faz login com email e senha.
   */
  signIn: async (email, password) => {
    set({ error: null, loading: true });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: translateAuthError(error.message), loading: false });
        return false;
      }

      set({
        user: data.user,
        session: data.session,
        loading: false,
      });

      if (data.user) {
        get().fetchProfile(data.user.id);
      }

      return true;
    } catch {
      set({ error: "Erro inesperado ao fazer login.", loading: false });
      return false;
    }
  },

  /**
   * Faz logout e limpa todo o estado.
   */
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, error: null });
  },

  clearError: () => set({ error: null }),

  /**
   * Busca o perfil do usuário na tabela profiles.
   * Chamado automaticamente após login/signup e refresh de sessão.
   */
  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      set({ profile: data as UserProfile });
    }
  },
}));

/**
 * Traduz mensagens de erro do Supabase Auth para português.
 * O Supabase retorna erros em inglês por padrão.
 */
function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos.",
    "Email not confirmed": "Confirme seu email antes de fazer login.",
    "User already registered": "Este email já está cadastrado.",
    "Password should be at least 6 characters":
      "A senha deve ter pelo menos 6 caracteres.",
    "Signup requires a valid password":
      "A senha é obrigatória.",
    "Unable to validate email address: invalid format":
      "Formato de email inválido.",
  };

  return translations[message] || message;
}
