import { WidgetScoreCard } from "./WidgetScoreCard";
import { WidgetMentionsChart } from "./WidgetMentionsChart";
import { WidgetAlertsCard } from "./WidgetAlertsCard";
import { WidgetBrandsOverview } from "./WidgetBrandsOverview";
import { WidgetTrendsChart } from "./WidgetTrendsChart";
import { WidgetWeeklyVariation } from "./WidgetWeeklyVariation";
import WidgetUnifiedScore from "./WidgetUnifiedScore";
import WidgetAIAnalytics from "./WidgetAIAnalytics";

interface DashboardWidgetsProps {
  widgets: Record<string, boolean>;
}

const widgetComponents = {
  aiAnalytics: WidgetAIAnalytics,
  unified: WidgetUnifiedScore,
  weekly: WidgetWeeklyVariation,
  score: WidgetScoreCard,
  mentions: WidgetMentionsChart,
  alerts: WidgetAlertsCard,
  brands: WidgetBrandsOverview,
  trends: WidgetTrendsChart,
};

export function DashboardWidgets({ widgets }: DashboardWidgetsProps) {
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
      role="region"
      aria-label="Widgets do dashboard"
    >
      {(Object.keys(widgetComponents) as Array<keyof typeof widgetComponents>).map((key) => {
        if (!widgets[key]) return null;
        const WidgetComponent = widgetComponents[key];
        return (
          <div key={key} role="article" aria-label={`Widget ${key}`}>
            <WidgetComponent />
          </div>
        );
      })}
    </div>
  );
}
