import React from "react";
import { Check } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export const Pricing: React.FC = () => {
  const plans = [
    {
      name: "Developer",
      price: "$0",
      description: "Ideal for testing and building proof of concepts.",
      badge: "Free",
      features: [
        "Up to 1,000 API calls / month",
        "Single API key integration",
        "Baseline XGBoost model access",
        "Manual CSV uploads (100,000 rows limit)",
        "Shared analytics dashboard",
      ],
      cta: "Get Started",
      variant: "secondary" as const,
    },
    {
      name: "Scale",
      price: "$149",
      period: "/ month",
      description: "For startups seeking automated fraud scoring.",
      badge: "Popular",
      features: [
        "Up to 100,000 API calls / month",
        "5 active API keys & rotation",
        "Full CSV uploads (500,000 rows limit)",
        "Priority scoring latency (<30ms p95)",
        "Email support (24hr response)",
      ],
      cta: "Upgrade Console",
      variant: "primary" as const,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For high-volume merchants demanding dedicated capacity.",
      badge: "Contact",
      features: [
        "Unlimited API transactions",
        "Dedicated model instances",
        "Custom decision threshold tuning",
        "Kafka-based event streams (V2)",
        "Dedicated Slack channel & SLA support",
      ],
      cta: "Contact Sales",
      variant: "outline" as const,
    },
  ];

  return (
    <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center">
      <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-3">
        <Badge variant="success">Flexible Plans</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary font-solway">
          Transparent, Developer-Friendly Pricing
        </h1>
        <p className="text-text-secondary">
          No hidden fees. Scale your API queries dynamically as your merchant volume expands.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {plans.map((plan) => (
          <Card key={plan.name} className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={plan.variant === "primary" ? "success" : "default"}>
                  {plan.badge}
                </Badge>
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-xs text-text-secondary mt-1 min-h-[32px]">{plan.description}</p>
            </CardHeader>

            <CardContent className="flex-grow flex flex-col gap-6 pt-4">
              <div className="flex items-baseline text-text-primary">
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                {plan.period && <span className="ml-1 text-xl font-semibold text-text-secondary">{plan.period}</span>}
              </div>

              <ul className="space-y-3 flex-grow" role="list">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <Check className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-4 border-t border-border">
              <Button variant={plan.variant} className="w-full">
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
