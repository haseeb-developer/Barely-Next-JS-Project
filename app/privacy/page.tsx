"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, AlertTriangle, Eye } from "lucide-react";

export default function PrivacyPage() {
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
            <Shield className="w-8 h-8 text-[#5865f2]" />
            <h1 className="text-4xl font-bold text-[#e4e6eb]">Privacy & Violation Policy</h1>
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
              <Eye className="w-6 h-6 text-[#5865f2]" />
              1. Information We Collect
            </h2>
            <div className="space-y-3 text-[#b9bbbe] leading-relaxed">
              <p>We collect the following information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-[#e4e6eb]">Account Information:</strong> Username, email address, and password (hashed)</li>
                <li><strong className="text-[#e4e6eb]">IP Address:</strong> Your IP address is collected for security, moderation, and violation tracking purposes</li>
                <li><strong className="text-[#e4e6eb]">Usage Data:</strong> Information about how you interact with the platform</li>
                <li><strong className="text-[#e4e6eb]">Content:</strong> Any content you post or submit on the platform</li>
                <li><strong className="text-[#e4e6eb]">Device Information:</strong> Browser type, device type, and operating system</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#5865f2]" />
              2. How We Use Your Information
            </h2>
            <div className="space-y-3 text-[#b9bbbe] leading-relaxed">
              <p>We use collected information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain our service</li>
                <li>Authenticate your account and prevent unauthorized access</li>
                <li>Monitor for violations and enforce our Terms of Service</li>
                <li>Implement IP-based bans for serious violations</li>
                <li>Improve and optimize the platform</li>
                <li>Respond to your inquiries and provide support</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-[#1a1b23] border border-red-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              3. IP Address Tracking and Permanent Bans
            </h2>
            <div className="space-y-3 text-[#b9bbbe] leading-relaxed">
              <p className="font-medium text-red-400">
                <strong>Important: IP Address Collection and Banning</strong>
              </p>
              <p>
                We collect and store your IP address for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-red-300/80">
                <li><strong>Security:</strong> To prevent fraud, abuse, and unauthorized access</li>
                <li><strong>Violation Enforcement:</strong> To track and prevent repeat violations</li>
                <li><strong>Permanent Bans:</strong> To enforce permanent IP-based bans for serious violations</li>
                <li><strong>Platform Integrity:</strong> To maintain a safe and respectful community</li>
              </ul>
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-medium mb-2">
                  <strong>Permanent IP Ban Policy:</strong>
                </p>
                <p className="text-red-300/90">
                  When you violate our Terms of Service, especially through prohibited conduct such as using offensive usernames, 
                  posting inappropriate content, harassment, or illegal activities, we will:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-red-300/90">
                  <li>Immediately ban your account</li>
                  <li>Permanently ban your IP address from accessing the platform</li>
                  <li>Store your IP address in our violation database</li>
                  <li>Block all future access attempts from your IP address</li>
                </ul>
                <p className="mt-3 text-red-400 font-medium">
                  <strong>This ban is permanent and cannot be appealed for serious violations.</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">4. Data Security</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              We implement industry-standard security measures to protect your information, including encryption, secure servers, 
              and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee 
              absolute security.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">5. Data Sharing</h2>
            <div className="space-y-3 text-[#b9bbbe] leading-relaxed">
              <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>When required by law or legal process</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
                <li>With service providers who assist in operating our platform (under strict confidentiality agreements)</li>
                <li>In case of a business transfer or merger</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">6. Your Rights</h2>
            <div className="space-y-3 text-[#b9bbbe] leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of certain data collection (where applicable)</li>
              </ul>
              <p className="mt-3 text-yellow-400">
                <strong>Note:</strong> If you have been permanently banned, your IP address will remain in our ban database 
                even if you request account deletion, as this is necessary for platform security.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">7. Cookies and Tracking</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our platform and store certain information. 
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">8. Children's Privacy</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              Our service is not intended for users under the age of 13. We do not knowingly collect personal information 
              from children under 13. If you are a parent or guardian and believe your child has provided us with personal 
              information, please contact us immediately.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">9. Changes to This Policy</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy 
              Policy periodically for any changes.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-[#1a1b23] border border-[#2d2f36]/30 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-[#e4e6eb] mb-4">10. Contact Us</h2>
            <p className="text-[#b9bbbe] leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through the platform's support channels.
            </p>
            <Link href="/terms" className="text-[#5865f2] hover:text-[#4752c4] underline mt-2 inline-block">
              View Terms of Service
            </Link>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

