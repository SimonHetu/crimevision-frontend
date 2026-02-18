export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <h1>Privacy Policy</h1>

      <p><strong>Last updated:</strong> February 2026</p>

      <p>
        CrimeVision respects your privacy. This Privacy Policy explains what
        information we collect, how we use it, and how you can control your data.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>Email address (via Clerk authentication)</li>
        <li>Optional home latitude and longitude</li>
        <li>Home radius (meters)</li>
      </ul>

      <h2>2. Why We Collect This Information</h2>
      <p>
        We collect this information to provide personalized “Near you” results
        and maintain secure user accounts.
      </p>

      <h2>3. Data Storage</h2>
      <p>
        Data is stored securely in a PostgreSQL database (Neon). Authentication
        is handled by Clerk.
      </p>

      <h2>4. Your Rights</h2>
      <p>
        You may delete your saved home location at any time from your dashboard.
      </p>

      <h2>5. Contact</h2>
      <p>
        For privacy-related questions, contact: your-email@example.com
      </p>
    </div>
  );
}
