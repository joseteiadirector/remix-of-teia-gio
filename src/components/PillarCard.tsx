import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface Module {
  code: string;
  name: string;
}

interface PillarCardProps {
  icon: LucideIcon;
  code: string;
  title: string;
  modules: Module[];
  color: "primary" | "secondary" | "accent";
}

const PillarCard = ({ icon: Icon, code, title, modules, color }: PillarCardProps) => {
  const colorClasses = {
    primary: "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40",
    secondary: "from-secondary/10 to-secondary/5 border-secondary/20 hover:border-secondary/40",
    accent: "from-accent/10 to-accent/5 border-accent/20 hover:border-accent/40",
  };

  const iconColorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <Card 
      className={`group relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} border-2 hover:shadow-lg transition-all duration-300 cursor-pointer`}
    >
      <div className="p-6 space-y-4">
        {/* Icon and Code */}
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${iconColorClasses[color]} transition-transform group-hover:scale-110`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            {code}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Modules */}
        <div className="space-y-2">
          {modules.map((module) => (
            <div 
              key={module.code}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-card/50 transition-colors"
            >
              <span className="text-xs font-mono text-muted-foreground min-w-[80px]">
                {module.code}
              </span>
              <span className="text-sm text-foreground">{module.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover effect gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-card/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );
};

export default PillarCard;
