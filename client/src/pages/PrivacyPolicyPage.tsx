import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import SEOHead from "../components/SEOHead";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <SEOHead
        title="Privacy Policy — Topper 2.0"
        description="Read Topper 2.0's Privacy Policy. Understand how we collect, use, and protect your data as a student on India's leading AI study platform for Bihar Board Class 11 & 12."
        keywords="Topper 2.0 privacy policy, AI study platform privacy, student data protection"
        canonical="/privacy-policy"
      />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 pb-20">
        {/* Title block */}
        <div className="flex items-start gap-4 mb-10">
          <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: May 13, 2025 &nbsp;·&nbsp; Effective: May 13, 2025</p>
          </div>
        </div>

        <div className="space-y-10 text-sm leading-7">

          {/* Introduction */}
          <Section title="1. Introduction">
            <p>
              Welcome to <strong className="text-white">Topper 2.0</strong> ("we", "our", or "us"), an AI-powered study
              platform operated by <strong className="text-white">Rupesh Gupta</strong> under the brand{" "}
              <strong className="text-white">Plyndrox</strong>, based in Bihar, India.
            </p>
            <p>
              This Privacy Policy explains what personal information we collect when you use Topper 2.0 (available at{" "}
              <a href="https://topper2.plyndrox.app" className="text-green-400 hover:underline">topper2.plyndrox.app</a>),
              how we use it, and the choices you have. By creating an account or using our service, you agree to the
              practices described below.
            </p>
            <p>
              If you have any questions, reach us at{" "}
              <a href="mailto:hello@plyndrox.app" className="text-green-400 hover:underline">hello@plyndrox.app</a>.
            </p>
          </Section>

          {/* Information We Collect */}
          <Section title="2. Information We Collect">
            <Subsection title="2.1 Account Information">
              <p>When you sign up, we collect your <strong className="text-white">email address</strong> and create a unique user ID. If you sign in with Google, we also receive your name and profile photo from Google.</p>
            </Subsection>
            <Subsection title="2.2 Profile Information">
              <p>You may optionally provide your <strong className="text-white">display name, username, school name, Bihar district, class (11 or 12), a short bio, and a profile photo</strong>. This information is used to personalise your experience and, where you choose, to display on your public profile.</p>
            </Subsection>
            <Subsection title="2.3 Study Content">
              <p>When you upload a PDF chapter, we extract and temporarily process its <strong className="text-white">text content</strong> to generate AI study material (notes, questions, flashcards, etc.). The extracted text and all AI-generated content are stored in your personal account in our database.</p>
            </Subsection>
            <Subsection title="2.4 Usage & Progress Data">
              <p>We automatically record your <strong className="text-white">study activity</strong> — chapters studied, questions answered, streaks, badges earned, daily goals, and exam dates — so we can show you meaningful progress reports and maintain the gamification features.</p>
            </Subsection>
            <Subsection title="2.5 Community Content">
              <p>If you post in discussion rooms, share chapters publicly, or participate in leaderboards, the content you submit and your username are visible to other users of the platform. Anonymous mode (available in Settings) replaces your username with a randomly assigned identifier in public posts.</p>
            </Subsection>
            <Subsection title="2.6 Coin Transactions">
              <p>The platform has a virtual <strong className="text-white">coin system</strong> used for peer tipping (sending coins to other students as appreciation for their shared notes). We log coin balances and transaction history. These are not real-money transactions and have no monetary value.</p>
            </Subsection>
            <Subsection title="2.7 Device & Log Data">
              <p>Like most web services, we may automatically receive standard <strong className="text-white">log data</strong> — IP address, browser type, device type, pages visited, and timestamps — for security monitoring and debugging. We do not use this to track you across the web.</p>
            </Subsection>
          </Section>

          {/* How We Use It */}
          <Section title="3. How We Use Your Information">
            <ul className="space-y-2 list-none pl-0">
              {[
                "Provide, operate, and improve the Topper 2.0 service.",
                "Authenticate your identity and secure your account.",
                "Generate personalised AI study material from your uploaded content.",
                "Track and display your progress, streaks, badges, and leaderboard ranking.",
                "Enable community features — public notes, discussions, class groups, and the leaderboard.",
                "Send important service notifications (e.g., email verification, password reset).",
                "Detect and prevent fraud, abuse, or policy violations.",
                "Understand aggregate usage patterns to improve features (using anonymised data).",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We do <strong className="text-white">not</strong> sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </Section>

          {/* Third-Party Services */}
          <Section title="4. Third-Party Services We Use">
            <div className="space-y-4">
              <ThirdParty name="Firebase (Google)" purpose="Authentication (login/signup) and our primary database (Firestore). Your account data, study content, and progress are stored in Firebase Firestore. Google's Privacy Policy governs Firebase's data handling." link="https://firebase.google.com/support/privacy" />
              <ThirdParty name="NVIDIA NIM API" purpose="Powers the AI content generation (notes, questions, flashcards, etc.). When you generate AI content, the extracted text of your chapter is sent to NVIDIA's API servers for processing. NVIDIA processes this data as a service provider. We do not send personally identifiable information (name, email, etc.) to NVIDIA." link="https://www.nvidia.com/en-us/about-nvidia/privacy-policy/" />
              <ThirdParty name="Google OAuth" purpose="Optional 'Sign in with Google'. If used, Google shares your email, display name, and profile photo with us." link="https://policies.google.com/privacy" />
            </div>
          </Section>

          {/* Data Storage */}
          <Section title="5. Data Storage & Security">
            <p>
              Your data is stored in <strong className="text-white">Google Firebase Firestore</strong>, which encrypts data at rest and in transit using industry-standard TLS/SSL. We also apply Firestore security rules so that each user can only access their own data.
            </p>
            <p>
              While we take reasonable precautions, no system is 100% secure. Please use a strong password and do not share your account credentials.
            </p>
          </Section>

          {/* Data Retention */}
          <Section title="6. Data Retention">
            <p>
              We retain your account and study data for as long as your account is active. If you delete your account (by contacting us at{" "}
              <a href="mailto:hello@plyndrox.app" className="text-green-400 hover:underline">hello@plyndrox.app</a>), we will delete your personal information from our systems within <strong className="text-white">30 days</strong>, except where we are required to retain it for legal or security reasons.
            </p>
            <p>
              Anonymised aggregate data (e.g., "10,000 questions were answered this week") may be retained indefinitely for analytics.
            </p>
          </Section>

          {/* Children & Minors */}
          <Section title="7. Students & Minors">
            <p>
              Topper 2.0 is designed for Class 11 and 12 students, who are typically <strong className="text-white">16–18 years old</strong>. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has created an account, please contact us immediately and we will delete their data.
            </p>
            <p>
              For users aged 13–18, we encourage parental awareness of the platform. We collect only the minimum information necessary to provide the educational service.
            </p>
          </Section>

          {/* Your Rights */}
          <Section title="8. Your Rights">
            <p>You have the right to:</p>
            <ul className="space-y-2 mt-3 list-none pl-0">
              {[
                "Access the personal information we hold about you.",
                "Correct inaccurate profile or account information (directly in the app's Profile & Settings pages).",
                "Request deletion of your account and personal data.",
                "Opt out of non-essential notifications (in the Settings page).",
                "Use Anonymous mode in community features to limit public identification.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any of the above rights, email us at{" "}
              <a href="mailto:hello@plyndrox.app" className="text-green-400 hover:underline">hello@plyndrox.app</a>. We will respond within <strong className="text-white">7 business days</strong>.
            </p>
          </Section>

          {/* Public Content */}
          <Section title="9. Public Content">
            <p>
              When you publish notes or post in community discussion rooms, that content is visible to other logged-in users of Topper 2.0. Please do not include sensitive personal information in shared notes or posts.
            </p>
            <p>
              You can unpublish your shared notes at any time from your chapter page or dashboard.
            </p>
          </Section>

          {/* Changes */}
          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make significant changes, we will update the "Last updated" date at the top of this page. Continued use of Topper 2.0 after changes are posted constitutes acceptance of the updated policy.
            </p>
          </Section>

          {/* Contact */}
          <Section title="11. Contact Us">
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
            <div className="mt-4 p-4 bg-gray-900 rounded-xl border border-gray-800 text-sm space-y-1">
              <p className="text-white font-medium">Rupesh Gupta · Plyndrox</p>
              <p>Email: <a href="mailto:hello@plyndrox.app" className="text-green-400 hover:underline">hello@plyndrox.app</a></p>
              <p>Location: Bihar, India 821105</p>
              <p>Instagram: <a href="https://www.instagram.com/rupesh_gupta___/" className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">@rupesh_gupta___</a></p>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Topper 2.0 · Plyndrox · Bihar, India</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link to="/terms" className="hover:text-green-400 transition-colors">Terms &amp; Conditions</Link>
          <Link to="/" className="hover:text-green-400 transition-colors">Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-4 pb-2 border-b border-gray-800">{title}</h2>
      <div className="space-y-3 text-gray-400">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-300 mb-1.5">{title}</h3>
      <div className="text-gray-400">{children}</div>
    </div>
  );
}

function ThirdParty({ name, purpose, link }: { name: string; purpose: string; link: string }) {
  return (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
      <p className="font-medium text-white text-sm mb-1">{name}</p>
      <p className="text-gray-400 text-sm leading-relaxed">{purpose}</p>
      <a href={link} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline text-xs mt-1 inline-block">
        View their privacy policy →
      </a>
    </div>
  );
}
