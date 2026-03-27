-- ============================================
-- Migration: 001_initial_schema.sql
-- Brasileirão Quiz - Schema completo inicial
-- ============================================
-- Este arquivo cria todas as tabelas, índices, políticas RLS
-- e triggers necessários para a aplicação.
--
-- Para executar: cole este SQL no SQL Editor do Supabase
-- (Dashboard → SQL Editor → New Query → colar → Run)
-- ============================================


-- ============================================
-- 1. TABELA: clubs
-- ============================================
-- Clubes de futebol brasileiro. Populada pelo script de seed.
-- Separamos clubes de jogadores porque a relação é N:N
-- (um jogador passa por vários clubes, um clube tem vários jogadores).

CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Flamengo", "Palmeiras"
  short_name TEXT NOT NULL,              -- "FLA", "PAL"
  logo_url TEXT,                         -- URL do escudo (da API-Football)
  league TEXT NOT NULL DEFAULT 'Série A', -- Liga principal do clube
  api_football_id INTEGER UNIQUE NOT NULL, -- ID original na API-Football
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca por nome (usado no autocomplete do Grid)
CREATE INDEX idx_clubs_name ON public.clubs (name);


-- ============================================
-- 2. TABELA: players
-- ============================================
-- Jogadores de futebol. Dados base vindos da API-Football,
-- enriquecidos manualmente quando necessário.

CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Nome usado no jogo: "Neymar Jr"
  full_name TEXT NOT NULL,               -- Nome completo: "Neymar da Silva Santos Júnior"
  nationality TEXT NOT NULL,             -- "Brazil", "Argentina"
  position TEXT NOT NULL,                -- "Goalkeeper", "Defender", "Midfielder", "Attacker"
  date_of_birth DATE,                   -- Pode ser null se a API não tiver
  photo_url TEXT,                        -- URL da foto (da API-Football)
  api_football_id INTEGER UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para os filtros mais comuns nos jogos
CREATE INDEX idx_players_name ON public.players (name);
CREATE INDEX idx_players_nationality ON public.players (nationality);
CREATE INDEX idx_players_position ON public.players (position);


-- ============================================
-- 3. TABELA: player_clubs (relacionamento N:N)
-- ============================================
-- Registra cada passagem de um jogador por um clube.
-- Um jogador pode ter múltiplas entradas no mesmo clube
-- (se saiu e voltou em temporadas diferentes).
--
-- Esta tabela é o CORAÇÃO do jogo Grid: para validar se
-- um jogador atende ao critério "Flamengo + Atacante",
-- precisamos buscar aqui.

CREATE TABLE public.player_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  season TEXT NOT NULL,                  -- "2023", "2024"
  jersey_number INTEGER,                -- Número da camisa (nullable)
  
  -- Evita duplicatas: mesmo jogador no mesmo clube na mesma temporada
  UNIQUE(player_id, club_id, season)
);

-- Índices para as queries mais frequentes:
-- "Quais jogadores passaram pelo Flamengo?" → busca por club_id
-- "Por quais clubes o Neymar passou?" → busca por player_id
CREATE INDEX idx_player_clubs_player ON public.player_clubs (player_id);
CREATE INDEX idx_player_clubs_club ON public.player_clubs (club_id);


-- ============================================
-- 4. TABELA: categories (para o Connections)
-- ============================================
-- Categorias temáticas para agrupar jogadores no Connections.
-- Ex: "Artilheiros da Copa do Brasil 2023", "Jogaram na Europa",
-- "Revelados pelo Santos", "Convocados para a Copa 2022".

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Nome exibido ao revelar o grupo
  type TEXT NOT NULL DEFAULT 'custom',   -- "achievement", "club", "nationality", "stat", "custom"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================
-- 5. TABELA: player_categories (N:N)
-- ============================================
-- Liga jogadores às categorias. Um jogador pode pertencer
-- a múltiplas categorias, e cada categoria tem múltiplos jogadores.

CREATE TABLE public.player_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  
  UNIQUE(player_id, category_id)
);

CREATE INDEX idx_player_categories_player ON public.player_categories (player_id);
CREATE INDEX idx_player_categories_category ON public.player_categories (category_id);


-- ============================================
-- 6. TABELA: daily_challenges
-- ============================================
-- Cada registro = um desafio diário de um tipo específico.
-- O campo "config" é JSONB e guarda a estrutura do jogo
-- (quais clubes/critérios no Grid, quais grupos no Connections).
--
-- A constraint UNIQUE garante que só existe um desafio
-- por tipo de jogo por dia.

CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL,               -- "grid" ou "connections"
  challenge_date DATE NOT NULL,          -- A data do desafio
  config JSONB NOT NULL,                 -- Configuração específica do jogo
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Um desafio por tipo por dia
  UNIQUE(game_type, challenge_date)
);

-- Índice para a query mais comum: "qual é o desafio de hoje?"
CREATE INDEX idx_daily_challenges_date ON public.daily_challenges (challenge_date DESC);
CREATE INDEX idx_daily_challenges_type_date ON public.daily_challenges (game_type, challenge_date DESC);


-- ============================================
-- 7. TABELA: profiles (extensão do auth.users)
-- ============================================
-- O Supabase Auth gerencia login/signup, mas não tem campos
-- customizados (username, avatar, streak). Esta tabela estende
-- o usuário com dados do nosso domínio.
--
-- O id é FK para auth.users, garantindo integridade.

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  streak INTEGER NOT NULL DEFAULT 0,     -- Dias consecutivos jogando
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_username ON public.profiles (username);


-- ============================================
-- 8. TABELA: user_scores
-- ============================================
-- Registra o resultado de cada jogador em cada desafio.
-- A constraint UNIQUE(user_id, challenge_id) impede que
-- alguém jogue o mesmo desafio duas vezes.

CREATE TABLE public.user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  time_seconds INTEGER,                  -- Tempo total (se jogou com timer)
  result_data JSONB DEFAULT '{}'::jsonb, -- Detalhes: quais acertou/errou
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Cada usuário só pode jogar cada desafio uma vez
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_user_scores_user ON public.user_scores (user_id);
CREATE INDEX idx_user_scores_challenge ON public.user_scores (challenge_id);
-- Para o leaderboard: buscar os melhores scores de um desafio
CREATE INDEX idx_user_scores_leaderboard ON public.user_scores (challenge_id, score DESC);


-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================
-- RLS é o que torna seguro expor a anon key no frontend.
-- Sem RLS, qualquer pessoa com a key poderia ler/escrever tudo.
-- Com RLS, cada query é filtrada pelas políticas que definimos.
--
-- Regra geral do nosso app:
-- - Dados de jogos (players, clubs, challenges): leitura pública
-- - Dados de usuário (scores, profiles): leitura pública, escrita restrita ao dono

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

-- DADOS DE JOGO: leitura pública (qualquer pessoa, logada ou não)
CREATE POLICY "Clubs são públicos" ON public.clubs
  FOR SELECT USING (true);

CREATE POLICY "Players são públicos" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Player_clubs são públicos" ON public.player_clubs
  FOR SELECT USING (true);

CREATE POLICY "Categories são públicas" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Player_categories são públicas" ON public.player_categories
  FOR SELECT USING (true);

CREATE POLICY "Challenges são públicos" ON public.daily_challenges
  FOR SELECT USING (true);

-- PROFILES: leitura pública (leaderboard), escrita restrita ao dono
CREATE POLICY "Profiles são públicos para leitura" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuário pode criar seu próprio perfil" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuário pode atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- SCORES: leitura pública (leaderboard), escrita restrita ao dono
CREATE POLICY "Scores são públicos para leitura" ON public.user_scores
  FOR SELECT USING (true);

CREATE POLICY "Usuário pode inserir seus próprios scores" ON public.user_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar seus próprios scores" ON public.user_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- Não permitimos DELETE de scores (integridade do leaderboard)


-- ============================================
-- 10. TRIGGER: Criar perfil automaticamente no signup
-- ============================================
-- Quando um novo usuário se registra via Supabase Auth,
-- este trigger cria automaticamente uma entrada na tabela profiles.
-- O username inicial é gerado a partir do email (parte antes do @).
-- O usuário pode alterar depois.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    -- Gera username a partir do email: "joao@email.com" → "joao"
    -- Se já existir, adiciona 4 caracteres aleatórios
    COALESCE(
      NULLIF(split_part(NEW.email, '@', 1), ''),
      'user_' || substr(NEW.id::text, 1, 8)
    )
  );
  RETURN NEW;
EXCEPTION
  -- Se o username já existir (UNIQUE violation), tenta com sufixo
  WHEN unique_violation THEN
    INSERT INTO public.profiles (id, username)
    VALUES (
      NEW.id,
      split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- O trigger dispara APÓS cada INSERT na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 11. VIEWS auxiliares (queries comuns pré-prontas)
-- ============================================

-- View: jogadores com seus clubes (desnormalizado para queries rápidas)
-- Útil para o Grid: "jogadores que passaram pelo Flamengo"
CREATE OR REPLACE VIEW public.players_with_clubs AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.nationality,
  p.position,
  p.photo_url AS player_photo,
  c.id AS club_id,
  c.name AS club_name,
  c.short_name AS club_short_name,
  c.logo_url AS club_logo,
  pc.season
FROM public.players p
JOIN public.player_clubs pc ON pc.player_id = p.id
JOIN public.clubs c ON c.id = pc.club_id;

-- View: leaderboard diário (ranking por desafio)
CREATE OR REPLACE VIEW public.daily_leaderboard AS
SELECT
  us.challenge_id,
  dc.game_type,
  dc.challenge_date,
  us.user_id,
  pr.username,
  us.score,
  us.attempts,
  us.time_seconds,
  us.completed,
  us.created_at AS played_at
FROM public.user_scores us
JOIN public.daily_challenges dc ON dc.id = us.challenge_id
JOIN public.profiles pr ON pr.id = us.user_id
WHERE us.completed = true
ORDER BY dc.challenge_date DESC, us.score DESC, us.time_seconds ASC NULLS LAST;
