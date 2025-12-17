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
  const enabledWidgets = (Object.keys(widgetComponents) as Array<keyof typeof widgetComponents>)
    .filter(key => widgets[key]);

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
      role="region"
      aria-label="Widgets do dashboard"
    >
      {enabledWidgets.map((key, index) => {
        const WidgetComponent = widgetComponents[key];
        return (
          <div 
            key={key} 
            role="article" 
            aria-label={`Widget ${key}`}
            className="animate-fade-in"
            style={{ 
              animationDelay: `${300 + index * 100}ms`,
              animationFillMode: 'backwards'
            }}
          >
            <WidgetComponent />
          </div>
        );
      })}
    </div>
  );
}