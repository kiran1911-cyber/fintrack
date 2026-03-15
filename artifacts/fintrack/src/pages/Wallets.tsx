import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetLinkedWallets, useLinkWallet, useUnlinkWallet, useGetWalletPortfolio } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, ShieldCheck, AlertCircle, X, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const formatCrypto = (n: number, symbol: string) => {
  if (["USDT", "USDC"].includes(symbol)) return formatCurrency(n);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
};

const PROVIDERS = [
  {
    id: "groww",
    name: "Groww",
    logo: "🌱",
    color: "#00B386",
    bgColor: "bg-emerald-950/40",
    borderColor: "border-emerald-500/30",
    description: "Indian stocks, mutual funds & ELSS",
    fields: ["API Key (optional)"],
    note: "Groww portfolio data is simulated for demo purposes. Real API integration requires Groww's business access.",
  },
  {
    id: "binance",
    name: "Binance",
    logo: "🟡",
    color: "#F0B90B",
    bgColor: "bg-yellow-950/40",
    borderColor: "border-yellow-500/30",
    description: "Crypto trading & DeFi assets",
    fields: ["API Key", "Secret Key"],
    note: "Binance portfolio data is simulated for demo purposes. Real API keys are stored encrypted and never shared.",
  },
];

const linkSchema = z.object({
  provider: z.string(),
  label: z.string().min(1, "Label is required"),
  apiKey: z.string().optional(),
  secretKey: z.string().optional(),
});

type LinkForm = z.infer<typeof linkSchema>;

function PortfolioView({ walletId, provider }: { walletId: number; provider: string }) {
  const { data, isLoading } = useGetWalletPortfolio(walletId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.totalGainLoss >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-4"
    >
      {data.isSimulated && (
        <div className="flex items-center gap-2 text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Demo data — simulated portfolio for illustration</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card/50 rounded-xl p-3 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Total Value</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(data.totalValue)}</p>
        </div>
        <div className={`rounded-xl p-3 border ${isPositive ? "bg-emerald-950/30 border-emerald-500/20" : "bg-red-950/30 border-red-500/20"}`}>
          <p className="text-xs text-muted-foreground mb-1">Total Gain/Loss</p>
          <p className={`text-lg font-bold flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? "+" : ""}{formatCurrency(data.totalGainLoss)}
          </p>
          <p className={`text-xs ${isPositive ? "text-emerald-400/70" : "text-red-400/70"}`}>
            {isPositive ? "+" : ""}{data.totalGainLossPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-card/40 hover:bg-card/60 border border-border/50 rounded-xl text-sm font-medium text-foreground transition-colors"
      >
        <span>Holdings ({data.holdings.length})</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {data.holdings.map((holding) => {
              const pos = holding.gainLoss >= 0;
              return (
                <div key={holding.symbol} className="flex items-center justify-between p-3 bg-card/30 rounded-xl border border-border/30 hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {holding.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{holding.symbol}</p>
                      <p className="text-xs text-muted-foreground">{holding.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(holding.currentValue)}</p>
                    <p className={`text-xs ${pos ? "text-emerald-400" : "text-red-400"}`}>
                      {pos ? "+" : ""}{holding.gainLossPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WalletCard({ wallet, onUnlink }: { wallet: { id: number; provider: string; label: string; maskedKey?: string | null; status: string; createdAt: string }; onUnlink: (id: number) => void }) {
  const [showPortfolio, setShowPortfolio] = useState(false);
  const providerInfo = PROVIDERS.find((p) => p.id === wallet.provider);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl border p-5 ${providerInfo?.bgColor || "bg-card"} ${providerInfo?.borderColor || "border-border"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{providerInfo?.logo || "💼"}</span>
          <div>
            <h3 className="font-semibold text-foreground">{wallet.label}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground capitalize">{wallet.provider}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 inline mr-1" />
                Connected
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPortfolio(!showPortfolio)}
            className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-xs font-medium"
          >
            {showPortfolio ? "Hide" : "View"} Portfolio
          </button>
          <button
            onClick={() => onUnlink(wallet.id)}
            className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {wallet.maskedKey && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 font-mono bg-background/20 rounded-lg px-3 py-1.5">
          <span>API Key: {wallet.maskedKey}</span>
        </div>
      )}

      <AnimatePresence>
        {showPortfolio && (
          <PortfolioView walletId={wallet.id} provider={wallet.provider} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LinkWalletModal({ provider: providerConfig, onClose }: { provider: typeof PROVIDERS[0]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const linkMutation = useLinkWallet({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
        onClose();
      },
    },
  });

  const form = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
    defaultValues: { provider: providerConfig.id, label: `My ${providerConfig.name}` },
  });

  const onSubmit = (data: LinkForm) => {
    linkMutation.mutate({ data });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{providerConfig.logo}</span>
            <div>
              <h2 className="text-xl font-bold text-foreground">Link {providerConfig.name}</h2>
              <p className="text-sm text-muted-foreground">{providerConfig.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Account Label</label>
            <input
              {...form.register("label")}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={`My ${providerConfig.name} Portfolio`}
            />
            {form.formState.errors.label && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.label.message}</p>
            )}
          </div>

          {providerConfig.id === "binance" && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">API Key <span className="text-muted-foreground">(optional)</span></label>
                <input
                  {...form.register("apiKey")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your Binance API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Secret Key <span className="text-muted-foreground">(optional)</span></label>
                <input
                  {...form.register("secretKey")}
                  type="password"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your Binance secret key"
                />
              </div>
            </>
          )}

          <div className="flex items-start gap-2 bg-blue-950/40 border border-blue-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-300/80">{providerConfig.note}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={linkMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {linkMutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Linking...</>
              ) : (
                <><Plus className="w-4 h-4" /> Link Account</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Wallets() {
  const [selectedProvider, setSelectedProvider] = useState<typeof PROVIDERS[0] | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetLinkedWallets();
  const unlinkMutation = useUnlinkWallet({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wallets"] }),
    },
  });

  const handleUnlink = (id: number) => {
    if (confirm("Are you sure you want to unlink this wallet?")) {
      unlinkMutation.mutate({ id });
    }
  };

  const wallets = data?.wallets || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Wallet className="w-8 h-8 text-primary" />
          Linked Wallets
        </h1>
        <p className="text-muted-foreground mt-1">Connect your trading accounts to view portfolio performance</p>
      </div>

      {/* Provider Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Connect a Platform</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROVIDERS.map((provider) => {
            const isConnected = wallets.some((w) => w.provider === provider.id);
            return (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider)}
                className={`text-left p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${provider.bgColor} ${provider.borderColor} hover:shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{provider.logo}</span>
                  {isConnected && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Connected
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-foreground">{provider.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: provider.color }}>
                  <Plus className="w-3.5 h-3.5" />
                  Link {provider.name} Account
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected Wallets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Connected Accounts ({wallets.length})</h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/wallets"] })}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/30">
            <Wallet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No wallets connected</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Link Groww or Binance to view your portfolio</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {wallets.map((wallet) => (
                <WalletCard key={wallet.id} wallet={wallet} onUnlink={handleUnlink} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="rounded-2xl border border-border bg-card/30 p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Security & Privacy
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            API keys are masked and stored securely — secret keys never leave the server
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Read-only access only — FinTrack AI cannot place trades or move funds
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Portfolio data shown is simulated — real integration requires platform API approval
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Use a separate read-only API key from Binance for maximum security
          </li>
        </ul>
      </div>

      <AnimatePresence>
        {selectedProvider && (
          <LinkWalletModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
