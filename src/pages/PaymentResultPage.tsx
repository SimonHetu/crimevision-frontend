import { Link, useSearchParams } from "react-router-dom";

type PaymentResultPageProps = {
  kind: "support" | "billing";
  status: "success" | "cancel";
};

const copy = {
  support: {
    success: {
      eyebrow: "Payment complete",
      title: "Thank you for supporting CrimeVision.",
      body: "Your contribution went through in Stripe test mode. It helps keep the maps, alerts, and data work moving.",
    },
    cancel: {
      eyebrow: "Payment cancelled",
      title: "No support payment was made.",
      body: "You can head back to CrimeVision and try another support amount any time.",
    },
  },
  billing: {
    success: {
      eyebrow: "Subscription active",
      title: "CrimeVision Alerts is set up.",
      body: "Stripe completed the checkout session. Your alerts subscription status will update after the webhook is processed.",
    },
    cancel: {
      eyebrow: "Checkout cancelled",
      title: "Your subscription was not started.",
      body: "You can return to CrimeVision and start the alerts checkout again when you are ready.",
    },
  },
} as const;

export default function PaymentResultPage({ kind, status }: PaymentResultPageProps) {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const content = copy[kind][status];

  return (
    <section className="payment-result" aria-labelledby="payment-result-title">
      <div className="payment-result-card">
        <div className="payment-result-eyebrow">{content.eyebrow}</div>
        <h1 id="payment-result-title">{content.title}</h1>
        <p>{content.body}</p>

        {sessionId ? (
          <div className="payment-result-session">
            <span>Session</span>
            <code>{sessionId}</code>
          </div>
        ) : null}

        <div className="payment-result-actions">
          <Link className="payment-result-primary" to="/">
            Back to map
          </Link>
          <Link className="payment-result-secondary" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
