interface LoginCTAProps {
  onLogin: () => void;
  onClose: () => void;
}

export function LoginCTA({ onLogin, onClose }: LoginCTAProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          borderRadius: "16px",
          border: "1px solid #334155",
          backgroundColor: "#0f172a",
          padding: "32px 28px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "14px",
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "20px",
            cursor: "pointer",
            lineHeight: 1,
          }}
          aria-label="Fechar"
        >
          ✕
        </button>
        <p style={{ fontSize: "32px", margin: 0 }}>🏆</p>
        <p style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "16px", margin: 0 }}>
          Quer aparecer no leaderboard?
        </p>
        <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
          Crie uma conta ou faça login. Seu resultado de hoje será salvo automaticamente!
        </p>
        <button
          onClick={onLogin}
          style={{
            marginTop: "4px",
            padding: "11px 28px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#16a34a",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Entrar / Criar conta
        </button>
      </div>
    </div>
  );
}
