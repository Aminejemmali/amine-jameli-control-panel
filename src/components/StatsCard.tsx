import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function StatsCard({ title, value, change, icon: Icon, variant = 'default' }: StatsCardProps) {
  const variantStyles = {
    default: 'bg-gradient-card border-border',
    success: 'bg-gradient-success border-success/20',
    warning: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20',
    destructive: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20'
  };

  const iconStyles = {
    default: 'text-primary',
    success: 'text-success-foreground', 
    warning: 'text-warning',
    destructive: 'text-destructive'
  };

  return (
    <div className={`stats-card ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              change.trend === 'up' ? 'text-success' : 
              change.trend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {change.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-background/50 ${iconStyles[variant]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}