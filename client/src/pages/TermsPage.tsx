import { Link } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";
import SEOHead from "../components/SEOHead";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <SEOHead
        title="Terms & Conditions — Topper 2.0"
        description="Read Topper 2.0's Terms & Conditions. Learn about the rules, guidelines and policies for using India's leading free AI study platform for NCERT Class 9 to 12 students."
        keywords="Topper 2.0 terms and conditions, AI study platform terms, NCERT study platform terms of use"
        canonical="/terms"
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
            <ScrollText className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Terms &amp; Conditions</h1>
            <p className="text-sm text-gray-500">Last updated: May 13, 2025 &nbsp;·&nbsp; Effective: May 13, 2025</p>
          </div>
        </div>

        <div className="space-y-10 text-sm leading-7">

          {/* Acceptance */}
          <Section title="1. Acceptance of Terms">
            <p>
              These Terms &amp; Conditions ("Terms") constitute a legally binding agreement between you ("User", "you") and{" "}
              <strong className="text-white">Rupesh Gupta</strong> operating as{" "}
              <strong className="text-white">Plyndrox</strong> ("we", "us", "our"), governing your use of the{" "}
              <strong className="text-white">Topper 2.0</strong> platform and all related services ("Service").
            </p>
            <p>
              By creating an account, uploading content, or otherwise accessing the Service, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must not use the Service.
            </p>
            <p>
              These Terms are governed by the laws of the <strong className="text-white">Republic of India</strong>. Disputes are subject to the exclusive jurisdiction of courts located in Bihar, India.
            </p>
          </Section>

          {/* Service Description */}
          <Section title="2. Description of Service">
            <p>
              Topper 2.0 is an AI-powered educational study platform designed for Class 9 to 12 students, with a focus on NCERT and all major board curricula including Bihar Board, CBSE, UP Board, and others. The Service includes:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "AI-generated study notes, question banks, flashcards, and formula sheets from uploaded PDF chapters.",
                "Interactive Physics and Chemistry simulations.",
                "A Doubt Chat AI tutor that answers subject-specific questions.",
                "A community platform including leaderboards, discussion rooms, class groups, and public notes sharing.",
                "A gamification system with streaks, daily goals, and achievement badges.",
                "A virtual coin system for peer appreciation (no monetary value).",
                "Progress tracking and personalised revision planning tools.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We reserve the right to modify, add, or discontinue any feature of the Service at any time without prior notice.
            </p>
          </Section>

          {/* Eligibility */}
          <Section title="3. Eligibility & Account Registration">
            <p>
              To use Topper 2.0, you must be at least <strong className="text-white">13 years old</strong>. Users under 18 should use the platform with parental or guardian awareness.
            </p>
            <p>
              When creating your account, you agree to:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "Provide accurate, truthful registration information.",
                "Choose a username that is appropriate and does not impersonate any person or entity.",
                "Keep your login credentials confidential and not share your account with others.",
                "Notify us immediately at hello@plyndrox.app if you suspect unauthorised access to your account.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Your <strong className="text-white">username is permanent</strong> once set and cannot be changed. Please choose carefully. We reserve the right to reclaim or remove usernames that violate these Terms.
            </p>
          </Section>

          {/* Acceptable Use */}
          <Section title="4. Acceptable Use Policy">
            <p>You agree to use the Service only for lawful purposes. You must <strong className="text-white">not</strong>:</p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "Upload content you do not have the legal right to share (e.g., copyrighted PDFs without permission).",
                "Upload content that is obscene, defamatory, threatening, discriminatory, or harmful to minors.",
                "Attempt to reverse-engineer, scrape, or automate access to the Service or its AI generation endpoints.",
                "Circumvent the chapter upload limit (5 chapters per account) using technical means or multiple accounts.",
                "Use the platform to harass, bully, or abuse other students in community spaces.",
                "Post misinformation, spam, or promotional content in discussion rooms.",
                "Attempt to exploit the virtual coin system, leaderboard, or any gamification feature through fraudulent means.",
                "Impersonate another user, real person, or Topper 2.0 staff.",
                "Upload any malicious files, code, or scripts.",
                "Use the platform in any way that could damage, disable, or overburden our servers.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500/70 mt-1 flex-shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Violation of this policy may result in immediate account suspension or permanent termination, at our sole discretion.
            </p>
          </Section>

          {/* User Content */}
          <Section title="5. User Content & Uploaded Material">
            <p>
              "User Content" means any material you upload, post, or generate using the Service — including PDF files, notes you publish, discussion posts, and profile information.
            </p>
            <p>
              By uploading content, you represent and warrant that:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "You own the content or have the necessary rights and permissions to upload it.",
                "The content does not infringe any third-party intellectual property rights.",
                "The content complies with all applicable laws and these Terms.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              You retain ownership of your original uploaded content. By uploading, you grant Topper 2.0 a limited, non-exclusive licence to process, store, and use your content solely to provide the Service to you.
            </p>
            <p>
              You also grant us permission to use AI-generated output derived from your content to display within your account and, if you choose to publish, to other users of the platform.
            </p>
            <p>
              We reserve the right to remove any User Content that violates these Terms, without notice.
            </p>
          </Section>

          {/* AI-Generated Content */}
          <Section title="6. AI-Generated Content Disclaimer">
            <p>
              Topper 2.0 uses the <strong className="text-white">NVIDIA NIM API</strong> (model: meta/llama-4-maverick) to generate study notes, questions, flashcards, and other educational material. By using AI generation features, you acknowledge and agree that:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "AI-generated content may contain errors, inaccuracies, or outdated information. It is supplementary study material and not a substitute for your textbooks, teachers, or official study resources.",
                "We do not guarantee that AI-generated content is 100% accurate, complete, or aligned with your exact exam board syllabus.",
                "You should always verify important facts with authoritative sources (NCERT textbooks, Bihar Board official material, qualified teachers).",
                "We are not responsible for any exam outcomes, academic performance, or decisions made based on AI-generated content.",
                "The text of your uploaded chapter is sent to NVIDIA's API servers for processing. By using AI features, you consent to this.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500/70 mt-1 flex-shrink-0">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Chapter Limit */}
          <Section title="7. Service Limits">
            <p>
              Free accounts are limited to <strong className="text-white">5 chapters</strong> at any given time. You may delete a chapter and upload a new one, but regenerating AI content consumes server resources and is subject to fair use.
            </p>
            <p>
              We reserve the right to introduce additional usage limits or tiers in the future. Current free users will be given reasonable notice before any restrictions affect their existing content.
            </p>
          </Section>

          {/* Virtual Coins */}
          <Section title="8. Virtual Coins">
            <p>
              Topper 2.0 includes a virtual <strong className="text-white">coin system</strong> for peer appreciation. Key rules:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "Coins have no real-world monetary value and cannot be exchanged for cash, goods, or services.",
                "Coins cannot be purchased with real money.",
                "Coins are awarded as a starting balance and through peer tips within the platform.",
                "We reserve the right to adjust coin balances, reset the system, or discontinue coins at any time.",
                "Any attempt to exploit, duplicate, or manipulate coin balances is a violation of these Terms and may result in account termination.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Community */}
          <Section title="9. Community Features">
            <p>
              Topper 2.0 includes community spaces (discussion rooms, class groups, public notes, leaderboards). When participating:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "Be respectful. Treat other students with the same respect you expect.",
                "Stay on-topic. Discussion rooms are for academic discussions.",
                "Do not share personal contact information (phone numbers, home addresses) in public spaces.",
                "Class group features are intended for genuine classroom communities. Misuse (e.g., creating fake classes for leaderboard manipulation) will result in account suspension.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We are not responsible for content posted by other users. If you encounter abusive content, please report it to{" "}
              <a href="mailto:hello@plyndrox.app" className="text-green-400 hover:underline">hello@plyndrox.app</a>.
            </p>
          </Section>

          {/* Intellectual Property */}
          <Section title="10. Intellectual Property">
            <p>
              All content, design, branding, software, and features of Topper 2.0 — including the logo, UI, AI prompt architecture, and simulation code — are the intellectual property of Rupesh Gupta / Plyndrox and are protected under applicable intellectual property laws.
            </p>
            <p>
              You may not copy, reproduce, distribute, or create derivative works from any part of the platform without explicit written permission.
            </p>
            <p>
              NCERT content (textbook text, chapter structure) is the property of the National Council of Educational Research and Training (NCERT), Government of India. Topper 2.0 is an independent educational tool and is not affiliated with, endorsed by, or officially connected to NCERT or the Bihar School Examination Board.
            </p>
          </Section>

          {/* Disclaimers */}
          <Section title="11. Disclaimers & Limitation of Liability">
            <p>
              The Service is provided on an <strong className="text-white">"as is" and "as available"</strong> basis without warranties of any kind, express or implied.
            </p>
            <p>
              To the maximum extent permitted by applicable law, Topper 2.0 and Plyndrox shall not be liable for:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "Any inaccuracies in AI-generated study content.",
                "Loss of data due to technical failures, accidental deletion, or third-party service outages (including Firebase or NVIDIA).",
                "Any indirect, incidental, consequential, or punitive damages arising from use of the Service.",
                "Academic results or performance, regardless of how the Service was used.",
                "Temporary unavailability of the Service due to maintenance, outages, or circumstances beyond our control.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1 flex-shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Our total aggregate liability to you for any claim arising from these Terms or the Service shall not exceed <strong className="text-white">₹0</strong> (zero), given that the Service is currently provided free of charge.
            </p>
          </Section>

          {/* Termination */}
          <Section title="12. Account Termination">
            <p>
              You may delete your account at any time by contacting us at{" "}
              <a href="mailto:hello@plyndrox.app" className="text-green-400 hover:underline">hello@plyndrox.app</a>. Upon deletion, your personal data will be removed within 30 days per our Privacy Policy.
            </p>
            <p>
              We reserve the right to suspend or permanently terminate your account, without notice, if you:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "Violate any provision of these Terms.",
                "Engage in behaviour harmful to other users or the platform.",
                "Attempt to tamper with or circumvent platform systems.",
                "Are found to have provided false registration information.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500/70 mt-1 flex-shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Changes */}
          <Section title="13. Changes to These Terms">
            <p>
              We may update these Terms at any time. When we do, we will update the "Last updated" date at the top of this page. Significant changes will be communicated via a notice on the platform. Your continued use of Topper 2.0 after changes are posted constitutes your acceptance of the updated Terms.
            </p>
            <p>
              If you disagree with updated Terms, you must stop using the Service and may request account deletion.
            </p>
          </Section>

          {/* Governing Law */}
          <Section title="14. Governing Law & Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with the laws of the <strong className="text-white">Republic of India</strong>.
            </p>
            <p>
              Any dispute arising out of or relating to these Terms or the Service shall first be attempted to be resolved through informal negotiation. If unresolved within 30 days, disputes shall be subject to the exclusive jurisdiction of the competent courts of <strong className="text-white">Bihar, India</strong>.
            </p>
          </Section>

          {/* Contact */}
          <Section title="15. Contact">
            <p>For questions about these Terms, please contact us:</p>
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
          <Link to="/privacy-policy" className="hover:text-green-400 transition-colors">Privacy Policy</Link>
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
