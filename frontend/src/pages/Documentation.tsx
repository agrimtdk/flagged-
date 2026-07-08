import React from "react";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";

export const Documentation: React.FC = () => {
  return (
    <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Badge>Integration Guide</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary font-solway">
          Developer Documentation
        </h1>
        <p className="text-text-secondary leading-relaxed">
          Learn how to integrate the <strong>flagged!</strong> real-time scoring endpoint into your custom shopping cart or checkout pipelines.
        </p>

        {/* Auth Details */}
        <h2 className="text-xl font-bold mt-4 font-solway text-text-primary border-b border-border pb-2">
          Authentication
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Authenticate your requests by passing your generated API key inside the headers:
        </p>
        <Card className="bg-card/45 border-border">
          <CardContent className="font-mono text-xs overflow-x-auto p-4 text-text-primary">
            Authorization: Bearer fl_live_382ef9104032a10
          </CardContent>
        </Card>

        {/* Prediction Endpoint */}
        <h2 className="text-xl font-bold mt-6 font-solway text-text-primary border-b border-border pb-2">
          Perform Scoring
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="success">POST</Badge>
          <span className="font-mono text-sm text-text-primary font-bold">/api/v1/predict</span>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">
          Send transaction payload details. Required parameters:
        </p>

        {/* Payload Example */}
        <h3 className="font-bold text-sm text-text-primary">Request Body</h3>
        <Card className="bg-card/45 border-border">
          <CardContent className="font-mono text-xs overflow-x-auto p-4 text-text-primary whitespace-pre">
{`{
  "transaction_external_id": "tx_9981242",
  "amount": 250.00,
  "card_brand": "VISA",
  "billing_country": "USA",
  "ip_address": "192.168.1.1",
  "device_type": "desktop",
  "email_domain": "gmail.com",
  "card_country": "USA"
}`}
          </CardContent>
        </Card>

        <h3 className="font-bold text-sm text-text-primary mt-2">Response Body (200 OK)</h3>
        <Card className="bg-card/45 border-border">
          <CardContent className="font-mono text-xs overflow-x-auto p-4 text-text-primary whitespace-pre">
{`{
  "transaction_id": "7bf3b3ef-8dfc-474c-811c-99fb3a65529f",
  "transaction_external_id": "tx_9981242",
  "risk_score": 0.875,
  "is_fraud": true,
  "prediction_details": {
    "reasons": [
      {"feature": "ip_card_country_mismatch", "impact": 0.42},
      {"feature": "high_amount_for_device", "impact": 0.25}
    ]
  }
}`}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
