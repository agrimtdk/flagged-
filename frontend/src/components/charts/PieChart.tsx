import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  height?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  showLegend?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  innerRadius = 0,
  outerRadius = "80%",
  showLegend = true,
}) => {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RechartsPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
            ))}
          </Pie>
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
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)", paddingTop: "10px" }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};
