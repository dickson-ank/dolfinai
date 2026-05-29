export type MessageRole = "user" | "assistant";

export interface StockCard {
  ticker: string;
  exchange: string;
  name: string;
  changePercent: string;
  price: string;
}

export interface RiskProfile {
  label: string;
  description: string;
  level: "low" | "medium" | "high";
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  stockCard?: StockCard;
  riskProfile?: RiskProfile;
  /** Substrings within `content` to render in accent color */
  highlights?: string[];
}
