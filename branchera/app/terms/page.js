export const metadata = {
  title: "Terms of Service - Branches",
  description: "Terms of Service for Branches - Grows With You",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Branches (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Branches is a social platform designed to facilitate critical discussion where clarity and logic prevail over distraction and misinformation. Our mission is to provide the best and most accessible social experience for meaningful discourse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Conduct</h2>
              <p className="text-gray-700 mb-4">
                You agree to use the Service in a manner consistent with any and all applicable laws and regulations. You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Post content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
                <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity</li>
                <li>Post content that infringes on the intellectual property rights of others</li>
                <li>Engage in spamming or other unsolicited advertising</li>
                <li>Attempt to gain unauthorized access to other users&apos; accounts or the Service&apos;s systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Content and Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                You retain ownership of content you post on Branchera. However, by posting content, you grant Branches a non-exclusive, royalty-free, worldwide license to use, display, and distribute your content in connection with the Service.
              </p>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality are owned by Branches and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                The information on this Service is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, Branches excludes all representations, warranties, conditions and terms whether express or implied.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                Branches shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us at legal@branches.live.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}