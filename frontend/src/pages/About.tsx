import React from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export const About: React.FC = () => {
  return (
    <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Badge>About the Platform</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary font-solway">
          Our Philosophy
        </h1>
        <p className="text-text-secondary text-base leading-relaxed">
          <strong>flagged!</strong> was built to bridge the gap between complex black-box enterprise risk analysis tools and oversimplified rules-based blocking logic. 
          We believe that businesses of all sizes deserve access to developer-first, explainable, high-performance machine learning models without the overhead of enterprise sales pipelines.
        </p>

        <h2 className="text-xl font-bold mt-4 font-solway text-text-primary">Core Tenets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
          <Card>
            <CardContent className="pt-4 flex flex-col gap-2">
              <h3 className="font-bold">Row-Level Data Separation</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Security is central to our design. RLS logic guarantees your organizational datasets are isolated at the database engine itself.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 flex flex-col gap-2">
              <h3 className="font-bold">Inference Speed</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Our model serving layer runs on stateless FastAPI instances delivering raw predictions under 50 milliseconds.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
