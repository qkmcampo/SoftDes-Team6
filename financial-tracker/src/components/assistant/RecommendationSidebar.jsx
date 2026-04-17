import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  PiggyBank,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRecommendations } from "../../services/geminiService";

const iconMap = {
  budget: Wallet,
  sales: TrendingUp,
  inventory: AlertTriangle,
  savings: PiggyBank,
  alert: AlertTriangle,
};

function RecommendationSidebar() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await getRecommendations();
      setRecommendations(Array.isArray(response) ? response : []);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      setRecommendations([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleRecommendationClick = (recommendation) => {
    let destination = "/dashboard#business-pulse";
    let focusSection = "business-pulse";

    if (recommendation.type === "inventory" || recommendation.type === "alert") {
      destination = "/calendar#restock-panel";
      focusSection = "restock-panel";
    } else if (recommendation.type === "budget") {
      destination = "/dashboard#budget-outlook";
      focusSection = "budget-outlook";
    } else if (recommendation.type === "savings") {
      destination = "/profile#financial-settings";
      focusSection = "financial-settings";
    }

    navigate(destination, {
      state: {
        focusSection,
        focusNonce: Date.now(),
      },
    });
  };

  return (
    <section className="surface-panel surface-panel-pad xl:flex xl:max-h-[calc(100vh-10rem)] xl:flex-col xl:overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">AI recommendations</p>
          <h3 className="section-subtitle">Live decision support</h3>
          <p className="section-copy">
            Refresh this panel anytime to pull the latest budget, sales, and inventory suggestions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2C2F45]/10 bg-white/70 text-[#2C2F45] transition hover:bg-white disabled:opacity-50"
          title="Refresh recommendations"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
        </button>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#2C2F45]/10 bg-white/70 px-4 py-2 text-xs font-medium text-[#6F6F76]">
        <Sparkles size={13} className="text-[#F9B672]" />
        {lastUpdated ? `Updated ${lastUpdated}` : "Waiting for first refresh"}
      </div>

      <div className="mt-6 space-y-3 xl:flex-1 xl:overflow-y-auto xl:pr-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[24px] border border-[#2C2F45]/8 bg-white/70 px-4 py-4">
              <div className="h-4 w-32 rounded bg-[#2C2F45]/10" />
              <div className="mt-3 h-3 w-full rounded bg-[#2C2F45]/8" />
              <div className="mt-2 h-3 w-4/5 rounded bg-[#2C2F45]/8" />
            </div>
          ))
        ) : recommendations.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#2C2F45]/12 bg-white/45 px-5 py-8 text-center">
            <BarChart3 size={22} className="mx-auto text-[#F9B672]" />
            <p className="mt-4 text-sm font-semibold text-[#050725]">No recommendations available yet</p>
            <p className="mt-2 text-sm leading-6 text-[#6F6F76]">
              Add more financial activity so the assistant can generate stronger insights for Gerald Retail.
            </p>
          </div>
        ) : (
          recommendations.map((recommendation, index) => {
            const Icon = iconMap[recommendation.type] || BarChart3;

            return (
              <button
                key={`${recommendation.title}-${index}`}
                type="button"
                onClick={() => handleRecommendationClick(recommendation)}
                className="interactive-surface w-full rounded-[24px] border border-[#2C2F45]/8 bg-white/75 px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-[#F9B672]/25"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2C2F45] text-[#F9B672]">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#050725]">{recommendation.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#6F6F76]">{recommendation.text}</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

export default RecommendationSidebar;
