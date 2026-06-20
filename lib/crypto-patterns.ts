export type CryptoPatternVariant = "btc" | "eth" | "sol";

export function getCryptoPatternVariant(symbol: string): CryptoPatternVariant {
  switch (symbol) {
    case "BTC":
      return "btc";
    case "ETH":
      return "eth";
    case "SOL":
      return "sol";
    default:
      return "btc";
  }
}

export function getCryptoPatternRows(symbol: string): string[] {
  const variant = getCryptoPatternVariant(symbol);

  if (variant === "btc") {
    return [
      "\u20BF   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF",
      "   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF",
      "\u20BF   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF",
      "   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF",
      "\u20BF   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF",
      "   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF   \u20BF"
    ];
  }

  if (variant === "eth") {
    return [
      "\u25C7   \u25C7   \u25C7   \u25C7   \u25C7",
      "\u25C7   \u25C7   \u25C7   \u25C7   \u25C7",
      "\u25C7   \u25C7   \u25C7   \u25C7   \u25C7",
      "\u25C7   \u25C7   \u25C7   \u25C7   \u25C7"
    ];
  }

  return [];
}
