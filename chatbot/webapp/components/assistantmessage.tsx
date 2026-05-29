import type { Message } from "@/types";

const riskBarWidth = { low: "28%", medium: "62%", high: "92%" };

function HighlightedContent({
  content,
  highlights,
}: {
  content: string;
  highlights?: string[];
}) {
  if (!highlights?.length) return <>{content}</>;

  const pattern = new RegExp(
    `(${highlights
      .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})`,
    "g",
  );

  return (
    <>
      {content.split(pattern).map((part, i) =>
        highlights.includes(part) ? (
          <span key={i} className="ai-body-highlight">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function AssistantMessage({ message }: { message: Message }) {
  const isPositive = !message.stockCard?.changePercent.startsWith("-");

  return (
    <div className="message-assistant animate-in">
      <div className="assistant-header">
        <div className="assistant-avatar">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="3" y="8" width="18" height="13" rx="3" />
            <path d="M8 8V6a4 4 0 0 1 8 0v2" />
            <circle cx="9" cy="14" r="1.2" fill="currentColor" />
            <circle cx="15" cy="14" r="1.2" fill="currentColor" />
          </svg>
        </div>
        <span className="assistant-name">DolFin</span>
      </div>

      {message.stockCard && (
        <div className="stock-card">
          <div className="stock-card-left">
            <div className="stock-card-top">
              <span className="stock-ticker">{message.stockCard.ticker}</span>
              <span className="stock-exchange-badge">
                {message.stockCard.exchange}
              </span>
            </div>
            <span className="stock-name">{message.stockCard.name}</span>
          </div>
          <div className="stock-card-right">
            <span
              className={`stock-change ${isPositive ? "positive" : "negative"}`}
            >
              {isPositive ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="18,15 12,9 6,15" />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              )}
              {message.stockCard.changePercent}
            </span>
            <span className="stock-price">{message.stockCard.price}</span>
          </div>
        </div>
      )}

      {message.riskProfile && (
        <div className="risk-card">
          <div className="risk-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9,12 11,14 15,10" />
            </svg>
          </div>
          <div className="risk-content">
            <p className="risk-label">{message.riskProfile.label}</p>
            <p className="risk-description">
              {message.riskProfile.description}
            </p>
          </div>
          <div className="risk-bar-track">
            <div
              className={`risk-bar-fill ${message.riskProfile.level === "low" ? "" : message.riskProfile.level}`}
              style={{ width: riskBarWidth[message.riskProfile.level] }}
            />
          </div>
        </div>
      )}

      {message.content && (
        <p className="text-[15px] leading-[1.7] text-[var(--text-primary)]">
          <HighlightedContent
            content={message.content}
            highlights={message.highlights}
          />
        </p>
      )}
    </div>
  );
}
