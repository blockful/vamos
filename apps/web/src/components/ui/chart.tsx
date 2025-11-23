"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

// const COLORS = ["#0c0a09", "#f4f4f5", "#71717a", "#e11d48"]
// const CHART_COLORS = ["#22c55e", "#fbbf24", "#f97316", "#0ea5e9"]

type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
    icon?: React.ComponentType<{ className?: string }>;
  } & Record<string, any>;
};

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
    children: React.ComponentType<any> | React.ReactNode;
  }
>(({ id, className, children, config, ...props }, ref) => (
  <ChartContext.Provider value={config}>
    <div
      ref={ref}
      className={cn(
        "flex aspect-auto h-80 w-full items-center justify-center",
        className
      )}
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
        {children as any}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  </ChartContext.Provider>
));
ChartContainer.displayName = "ChartContainer";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const cssVariables: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "object" && value !== null && "color" in value) {
      const color = value.color;
      if (color) {
        cssVariables[`--color-${key}`] = color;
      }
    }
  }
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        :root {
          ${Object.entries(cssVariables)
            .map(([key, value]) => `${key}: ${value};`)
            .join("\n")}
        }
      `,
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartLegend = RechartsPrimitive.Legend;

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartLegend,
  RechartsPrimitive,
  useChart,
};
