"use client";

import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { formatCurrencyWithSymbol } from "@/lib/currency";

interface ShareCardProps {
  month: string;
  balance: number;
  savingsRate: number;
  previousMonthBalance?: number;
  goalsProgress?: Array<{ name: string; percentage: number }>;
  format: "stories" | "post";
}

const THEME = {
  primary: "#10b981",
  secondary: "#059669",
  accent: "#34d399",
  dark: "#064e3b",
  light: "#d1fae5",
  text: "#ffffff",
  textMuted: "#a7f3d9",
  background: "#0f172a",
};

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                   "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function ShareCard({
  month,
  balance,
  savingsRate,
  previousMonthBalance = 0,
  goalsProgress = [],
  format,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const [year, monthNum] = month.split("-").map(Number);
  const monthName = monthNames[monthNum - 1];

  const comparison = previousMonthBalance !== 0
    ? ((balance - previousMonthBalance) / Math.abs(previousMonthBalance)) * 100
    : 0;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        logging: false,
        useCORS: true,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 1.0);
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `famflow-${month}-${format}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating image:", error);
    }
  }, [month, format]);

  const isStories = format === "stories";
  const isPositive = balance >= 0;

  if (isStories) {
    return (
      <div className="relative" style={{ width: 540, height: 960, transform: "scale(2)", transformOrigin: "top left" }}>
        <div
          ref={cardRef}
          className="absolute"
          style={{
            width: 540,
            height: 960,
            background: `linear-gradient(180deg, ${THEME.primary} 0%, ${THEME.secondary} 50%, ${THEME.dark} 100%)`,
            borderRadius: 24,
            padding: 40,
            boxSizing: "border-box",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: THEME.text,
            overflow: "hidden",
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 400,
              height: 400,
              background: `radial-gradient(circle, ${THEME.accent}20 0%, transparent 70%)`,
              borderRadius: "0 0 0 100%",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 200,
              left: -100,
              width: 300,
              height: 300,
              background: `radial-gradient(circle, ${THEME.light}10 0%, transparent 70%)`,
            }}
          />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.1)",
                padding: "8px 20px",
                borderRadius: 50,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 24 }}>📊</span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                FamFlow
              </span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{monthName} {year}</p>
          </div>

          {/* Hero Section */}
          <div
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: 32,
              padding: 40,
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: THEME.textMuted,
                margin: "0 0 8px 0",
              }}
            >
              {isPositive ? "🎯 POUPANÇA" : "📉 DÉFICE"}
            </p>
            <p
              style={{
                fontSize: 72,
                fontWeight: 800,
                margin: "0 0 8px 0",
                lineHeight: 1,
              }}
            >
              {isPositive ? "" : "-"}
              {formatCurrencyWithSymbol(balance).replace("€", "").trim()}
              <span style={{ fontSize: 36 }}>€</span>
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: THEME.textMuted,
                margin: "0 0 16px 0",
              }}
            >
              {savingsRate.toFixed(0)}% da receita
            </p>
            {comparison !== 0 && (
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: comparison >= 0 ? "#a7f3d9" : "#fca5a5",
                  margin: 0,
                }}
              >
                {comparison >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(comparison).toFixed(0)}% vs mês anterior
              </p>
            )}
          </div>

          {/* Goals Progress */}
          {goalsProgress.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: THEME.textMuted,
                  margin: "0 0 16px 0",
                }}
              >
                📌 METAS
              </p>
              {goalsProgress.slice(0, 2).map((goal, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 14,
                      marginBottom: 6,
                    }}
                  >
                    <span>{goal.name}</span>
                    <span>{goal.percentage}%</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(goal.percentage, 100)}%`,
                        height: "100%",
                        background: THEME.accent,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quote */}
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 40,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 16,
                fontStyle: "italic",
                color: THEME.textMuted,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Toma o controlo das tuas finanças
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: 40,
              right: 40,
              textAlign: "center",
            }}
          >
            {/* QR Code placeholder */}
            <div
              style={{
                width: 80,
                height: 80,
                background: THEME.text,
                borderRadius: 8,
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: THEME.dark,
                fontWeight: 700,
              }}
            >
              <span>QR</span>
            </div>
            <p style={{ fontSize: 14, margin: 0, opacity: 0.8 }}>famflow.app</p>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, margin: 0, opacity: 0.6 }}>
                #FamFlow #PoupançaInteligente #FinançasPessoais
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Post format (square)
  return (
    <div className="relative" style={{ width: 540, height: 540, transform: "scale(2)", transformOrigin: "top left" }}>
      <div
        ref={cardRef}
        className="absolute"
        style={{
          width: 540,
          height: 540,
          background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.secondary} 100%)`,
          borderRadius: 24,
          padding: 32,
          boxSizing: "border-box",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: THEME.text,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>FamFlow</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{monthName} {year}</p>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              padding: "8px 16px",
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 12, margin: 0, opacity: 0.8 }}>Relatório Mensal</p>
          </div>
        </div>

        {/* Hero Section */}
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: THEME.textMuted,
              margin: "0 0 8px 0",
            }}
          >
            {isPositive ? "🎯 POUPANÇA" : "📉 DÉFICE"}
          </p>
          <p
            style={{
              fontSize: 64,
              fontWeight: 800,
              margin: "0 0 8px 0",
              lineHeight: 1,
            }}
          >
            {isPositive ? "" : "-"}
            {formatCurrencyWithSymbol(balance).replace("€", "").trim()}
            <span style={{ fontSize: 28 }}>€</span>
          </p>
          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: THEME.textMuted,
              margin: "0 0 8px 0",
            }}
          >
            {savingsRate.toFixed(0)}% da receita
          </p>
          {comparison !== 0 && (
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: comparison >= 0 ? "#a7f3d9" : "#fca5a5",
                margin: 0,
              }}
            >
              {comparison >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(comparison).toFixed(0)}% vs mês anterior
            </p>
          )}
        </div>

        {/* Goals Progress */}
        {goalsProgress.length > 0 && (
          <div
            style={{
              background: "rgba(0,0,0,0.15)",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1,
                color: THEME.textMuted,
                margin: "0 0 12px 0",
              }}
            >
              📌 PROGRESSO DAS METAS
            </p>
            {goalsProgress.slice(0, 1).map((goal, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  <span>{goal.name}</span>
                  <span>{goal.percentage}%</span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(goal.percentage, 100)}%`,
                      height: "100%",
                      background: THEME.accent,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 32,
            right: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: THEME.text,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                color: THEME.dark,
                fontWeight: 700,
              }}
            >
              <span>QR</span>
            </div>
            <span style={{ fontSize: 12, opacity: 0.8 }}>famflow.app</span>
          </div>
          <p style={{ fontSize: 10, opacity: 0.6, margin: 0 }}>
            #PoupançaInteligente
          </p>
        </div>
      </div>
    </div>
  );
}

export function downloadShareCard(props: ShareCardProps): Promise<void> {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    const cardElement = document.createElement("div");
    container.appendChild(cardElement);

    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(cardElement, {
        logging: false,
        useCORS: true,
      })
        .then((canvas) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `famflow-${props.month}-${props.format}.png`;
              link.click();
              URL.revokeObjectURL(url);
            }
            document.body.removeChild(container);
            resolve();
          }, "image/png", 1.0);
        })
        .catch(reject);
    });
  });
}