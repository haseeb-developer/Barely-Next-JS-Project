"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileText, Shield, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#1a1b23] text-[#e4e6eb]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
                <Link href="/home">
          <motion.button
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="mb-8 flex items-center gap-2 text-[#e4e6eb] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </motion.button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-[#5865f2]" />
            <h1 className="text-4xl font-bold text-[#e4e6eb]">Terms of Service</h1>
          </div>
          <p className="text-[#b9bbbe] text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", damping: 20, stiffness: 300 }}
          className="space-y-8"
        >
          {/* Section 1 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#5865f2]" />
              1. Acceptance of Terms
            </h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">2. User Accounts</h2>
            <div className="space-y-3 text-[#b9bbbe] leading-relaxed">
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information when creating an account</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              3. Prohibited Conduct
            </h2>
            <div className="space-y-3 text-[#b9bbbe] leading-relaxed">
              <p className="font-medium text-[#e4e6eb]">You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use offensive, profane, or inappropriate usernames or content</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Post illegal, harmful, or malicious content</li>
                <li>Attempt to bypass security measures or violate system integrity</li>
                <li>Use automated systems to access the platform without authorization</li>
                <li>Impersonate others or provide false information</li>
                <li>Distribute spam, malware, or viruses</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-[#1a1b23] border border-red-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              4. Violations and Permanent Bans
            </h2>
            <div className="space-y-3 text-[#b9bbbe] leading-relaxed">
              <p className="font-medium text-red-400">
                <strong>Permanent IP Ban Policy:</strong>
              </p>
              <p>
                Violation of these terms, especially prohibited conduct, will result in immediate and permanent 
                banning of your account and IP address from this platform. This includes but is not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-red-300/80">
                <li>Using profane or offensive usernames</li>
                <li>Posting inappropriate or harmful content</li>
                <li>Harassment or threats towards other users</li>
                <li>Attempting to circumvent security measures</li>
                <li>Any illegal activity or violation of laws</li>
              </ul>
              <p className="mt-4 text-red-400 font-medium">
                <strong>Once banned, you will not be able to access this platform from your IP address permanently. 
                Appeals will not be considered for serious violations.</strong>
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">5. Content Ownership</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              You retain ownership of content you post, but grant us a worldwide, non-exclusive, royalty-free license 
              to use, reproduce, and distribute your content on the platform. You are responsible for ensuring you have 
              the right to post any content you submit.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">6. Privacy</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              Your use of this platform is also governed by our Privacy Policy. Please review our Privacy Policy to understand 
              how we collect, use, and protect your information.
            </p>
            <Link href="/privacy" className="text-[#5865f2] hover:text-[#4752c4] underline mt-2 inline-block">
              View Privacy Policy
            </Link>
          </section>

          {/* Section 7 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">7. Service Modifications</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice. 
              We are not liable to you or any third party for any modification, suspension, or discontinuation of the service.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">8. Limitation of Liability</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, 
              use, goodwill, or other intangible losses.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">9. Changes to Terms</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material changes. 
              Your continued use of the service after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">10. Contact Information</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through the platform's support channels.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

