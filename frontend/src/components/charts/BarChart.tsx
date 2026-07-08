import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface BarChartProps {
  data: any[];
  xKey: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
  layout?: "horizontal" | "vertical";
  showLegend?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  series,
  height = 300,
  layout = "horizontal",
  showLegend = true,
}) => {
  const isVertical = layout === "vertical";

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 10,
            right: 10,
            left: isVertical ? 20 : -20,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={isVertical} horizontal={!isVertical} />
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                dataKey={xKey}
                type="category"
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              borderRadius: "4px",
              fontSize: "12px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }}
            />
          )}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              barSize={16}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
