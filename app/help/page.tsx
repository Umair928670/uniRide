'use client';

import { useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  AlertTriangle,
  BookOpen,
  Shield,
  Mail,
  Phone,
  Send,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  FileText,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-context";

type Section = "main" | "faq" | "contact" | "report" | "safety";

const FAQ_DATA = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I sign up for UniRide?",
        a: "Sign up using your university .edu email address. You'll receive a verification link to confirm your student status. Once verified, you can start finding or offering rides!",
      },
      {
        q: "Is UniRide free to use?",
        a: "Yes, UniRide is free to download and use. You only pay the ride fare set by the driver when you book a ride. There are no hidden fees or commissions.",
      },
      {
        q: "Can I be both a driver and a passenger?",
        a: "Absolutely! UniRide supports dual roles. You can switch between being a passenger (finding rides) and a driver (offering rides) at any time from your profile. Your stats for both roles are tracked separately.",
      },
    ],
  },
  {
    category: "Rides & Booking",
    questions: [
      {
        q: "How do I book a ride?",
        a: "Search for available rides from the home screen or browse page. Tap on a ride to see details, then tap 'Request Ride' to book. The driver will be notified of your request.",
      },
      {
        q: "Can I cancel a booked ride?",
        a: "Yes, you can cancel from the 'My Rides' section under the Upcoming tab. Please cancel at least 30 minutes before departure to be courteous to the driver.",
      },
      {
        q: "What does 'UniRide Only' mean?",
        a: "When a driver enables 'UniRide Only', only verified university students can request that ride. This adds an extra layer of safety and trust.",
      },
      {
        q: "How are ride prices set?",
        a: "Drivers set their own prices per seat. Prices typically cover fuel costs and are meant to be affordable for students. We recommend checking average prices for similar routes.",
      },
    ],
  },
  {
    category: "Safety & Trust",
    questions: [
      {
        q: "How does UniRide ensure safety?",
        a: "All users must verify their .edu email. Drivers can add vehicle information. Users can rate each other after rides, and we display verification badges. Always share your trip details with a trusted friend.",
      },
      {
        q: "What should I do if I feel unsafe?",
        a: "If you feel unsafe during a ride, contact local emergency services immediately. After the ride, report the issue through our 'Report an Issue' section. We take all safety reports seriously.",
      },
      {
        q: "How does the rating system work?",
        a: "After each ride, both driver and passenger can rate each other from 1-5 stars. Ratings are averaged across all rides. Users with consistently low ratings may be restricted.",
      },
    ],
  },
  {
    category: "Account & Settings",
    questions: [
      {
        q: "How do I change my profile information?",
        a: "Go to Profile → Settings → Edit Profile. You can update your name, phone number, department, and bio. Email cannot be changed as it's linked to your verification.",
      },
      {
        q: "How do I enable dark mode?",
        a: "Toggle dark mode from the Profile page or Settings. Your preference will be saved automatically.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes, go to Settings → Delete Account. This action is permanent and will remove all your data, ride history, and ratings. Active bookings will be cancelled.",
      },
    ],
  },
];

const SAFETY_TIPS = [
  { icon: Shield, title: "Verify Before You Ride", description: "Always check the driver's verification badge and rating before booking. Look for the green checkmark indicating a verified student." },
  { icon: Users, title: "Share Your Trip", description: "Share your ride details (driver name, route, departure time) with a friend or family member before you travel." },
  { icon: Phone, title: "Keep Communication In-App", description: "Use UniRide's built-in chat to communicate with drivers. This keeps a record of all conversations for safety." },
  { icon: FileText, title: "Check Vehicle Details", description: "Before getting in, verify the car's make, model, color, and license plate match what's shown in the app." },
  { icon: AlertTriangle, title: "Trust Your Instincts", description: "If something feels off, don't get in the car. Cancel the ride and report the issue. Your safety comes first." },
  { icon: HelpCircle, title: "Sit in the Back", description: "When riding as a passenger, sitting in the back seat gives you more space and easy access to doors on both sides." },
];

export default function HelpSupportPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("main");

  if (section === "faq") return <FAQSection onBack={() => setSection("main")} />;
  if (section === "contact") return <ContactSection onBack={() => setSection("main")} />;
  if (section === "report") return <ReportSection onBack={() => setSection("main")} />;
  if (section === "safety") return <SafetySection onBack={() => setSection("main")} />;

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2>Help & Support</h2>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1A3C6E] to-[#1A3C6E]/80 rounded-2xl p-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h3 className="text-white mb-1">How can we help?</h3>
          <p className="text-white/70 text-[13px]">Find answers, get support, or report an issue</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <QuickAction icon={<BookOpen className="w-6 h-6 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="FAQ" subtitle="Common questions" onClick={() => setSection("faq")} />
          <QuickAction icon={<MessageCircle className="w-6 h-6 text-[#00C9B1]" />} label="Contact Us" subtitle="Get in touch" onClick={() => setSection("contact")} />
          <QuickAction icon={<AlertTriangle className="w-6 h-6 text-orange-500" />} label="Report Issue" subtitle="Safety & problems" onClick={() => setSection("report")} />
          <QuickAction icon={<Shield className="w-6 h-6 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Safety Guide" subtitle="Stay safe" onClick={() => setSection("safety")} />
        </div>

        {/* Quick Links */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <QuickLink label="Terms of Service" icon={<FileText className="w-5 h-5 text-muted-foreground" />} />
          <Divider />
          <QuickLink label="Privacy Policy" icon={<Shield className="w-5 h-5 text-muted-foreground" />} />
          <Divider />
          <QuickLink label="Community Guidelines" icon={<Users className="w-5 h-5 text-muted-foreground" />} />
        </div>

        <p className="text-center text-[12px] text-muted-foreground pb-4">
          UniRide v1.0.0 · support@uniride.edu
        </p>
      </div>
    </div>
  );
}

/* ============ Sub-sections ============ */

function FAQSection({ onBack }: { onBack: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQ = FAQ_DATA.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0);

  return (
    <SubPage title="Frequently Asked Questions" onBack={onBack}>
      <div className="relative mb-4">
        <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all"
        />
      </div>

      {filteredFAQ.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No results found</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFAQ.map((category) => (
            <div key={category.category}>
              <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide mb-2 px-1">
                {category.category}
              </p>
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {category.questions.map((item, i) => {
                  const id = `${category.category}-${i}`;
                  const isOpen = openId === id;
                  return (
                    <div key={id}>
                      {i > 0 && <Divider />}
                      <button
                        onClick={() => setOpenId(isOpen ? null : id)}
                        className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-[14px] flex-1">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#00C9B1] shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <p className="text-[13px] text-muted-foreground leading-relaxed bg-[#F5F7FA] dark:bg-[#1C2333] rounded-xl p-3">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </SubPage>
  );
}

function ContactSection({ onBack }: { onBack: () => void }) {
  const { addNotification } = useApp();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      addNotification("warning", "Please fill in all fields.");
      return;
    }
    setSent(true);
    addNotification("success", "Message sent! We'll get back to you soon.");
  };

  if (sent) {
    return (
      <SubPage title="Contact Us" onBack={onBack}>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#00C9B1]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#00C9B1]" />
          </div>
          <h3 className="mb-2">Message Sent!</h3>
          <p className="text-muted-foreground text-[14px] mb-6">
            We typically respond within 24 hours. Check your email for updates.
          </p>
          <button
            onClick={() => { setSent(false); setSubject(""); setMessage(""); }}
            className="px-6 py-3 rounded-2xl bg-[#1A3C6E] text-white font-semibold hover:bg-[#1A3C6E]/90 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </SubPage>
    );
  }

  return (
    <SubPage title="Contact Us" onBack={onBack}>
      <div className="space-y-4">
        {/* Contact Methods */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center">
            <Mail className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-2" />
            <p className="text-[13px] font-medium">Email</p>
            <p className="text-[11px] text-muted-foreground">support@uniride.edu</p>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center">
            <Phone className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1] mx-auto mb-2" />
            <p className="text-[13px] font-medium">Phone</p>
            <p className="text-[11px] text-muted-foreground">1-800-UNIRIDE</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
          <p className="font-medium text-[14px] mb-3">Send us a message</p>
          <div className="space-y-3">
            <div>
              <label className="text-[13px] text-muted-foreground mb-1.5 block">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-card border border-border focus:border-[#00C9B1] outline-none transition-all appearance-none"
              >
                <option value="">Select a topic</option>
                <option value="general">General Inquiry</option>
                <option value="billing">Billing & Payments</option>
                <option value="technical">Technical Issue</option>
                <option value="account">Account Problem</option>
                <option value="feedback">Feedback & Suggestions</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] text-muted-foreground mb-1.5 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe your issue or question..."
                className="w-full px-4 py-3 rounded-2xl bg-card border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all resize-none"
              />
            </div>
            <button
              onClick={handleSubmit}
              className="w-full py-3.5 rounded-2xl bg-[#1A3C6E] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1A3C6E]/90 transition-colors"
            >
              <Send className="w-5 h-5" /> Send Message
            </button>
          </div>
        </div>
      </div>
    </SubPage>
  );
}

function ReportSection({ onBack }: { onBack: () => void }) {
  const { addNotification } = useApp();
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reportTypes = [
    "Unsafe driving behavior",
    "Harassment or inappropriate behavior",
    "Driver didn't show up",
    "Wrong vehicle / impersonation",
    "Overcharging",
    "App bug / technical issue",
    "Other",
  ];

  const handleSubmit = () => {
    if (!reportType || !description.trim()) {
      addNotification("warning", "Please select a type and provide a description.");
      return;
    }
    setSubmitted(true);
    addNotification("success", "Report submitted. Our safety team will review it.");
  };

  if (submitted) {
    return (
      <SubPage title="Report an Issue" onBack={onBack}>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#00C9B1]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#00C9B1]" />
          </div>
          <h3 className="mb-2">Report Submitted</h3>
          <p className="text-muted-foreground text-[14px] mb-2">
            Our safety team will review your report within 24-48 hours.
          </p>
          <p className="text-muted-foreground text-[13px] mb-6">
            If this is an emergency, please call local emergency services.
          </p>
          <button
            onClick={() => { setSubmitted(false); setReportType(""); setDescription(""); }}
            className="px-6 py-3 rounded-2xl border border-border font-semibold hover:bg-muted transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      </SubPage>
    );
  }

  return (
    <SubPage title="Report an Issue" onBack={onBack}>
      <div className="bg-orange-500/10 rounded-2xl p-4 mb-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
        <p className="text-[13px]">
          If you're in immediate danger, please contact local emergency services (911) first.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[13px] text-muted-foreground mb-1.5 block">What happened?</label>
          <div className="space-y-2">
            {reportTypes.map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`w-full text-left px-4 py-3 rounded-2xl border transition-all text-[14px] ${
                  reportType === type
                    ? "border-[#00C9B1] bg-[#00C9B1]/5"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                {reportType === type && <CheckCircle className="w-4 h-4 text-[#00C9B1] inline mr-2" />}
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] text-muted-foreground mb-1.5 block">Describe what happened</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Please provide as much detail as possible..."
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
        >
          <AlertTriangle className="w-5 h-5" /> Submit Report
        </button>
      </div>
    </SubPage>
  );
}

function SafetySection({ onBack }: { onBack: () => void }) {
  return (
    <SubPage title="Safety Guidelines" onBack={onBack}>
      <div className="bg-gradient-to-br from-[#00C9B1] to-[#00C9B1]/80 rounded-2xl p-5 text-white mb-4">
        <Shield className="w-8 h-8 mb-2" />
        <h3 className="text-white mb-1">Your Safety Matters</h3>
        <p className="text-white/80 text-[13px]">
          Follow these guidelines to have a safe and enjoyable carpooling experience.
        </p>
      </div>

      <div className="space-y-3">
        {SAFETY_TIPS.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div
              key={i}
              className="bg-card rounded-2xl shadow-sm border border-border p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />
              </div>
              <div>
                <p className="font-medium text-[14px] mb-0.5">{tip.title}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{tip.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 bg-[#1A3C6E]/5 dark:bg-[#00C9B1]/5 rounded-2xl p-4 text-center">
        <p className="text-[13px] text-muted-foreground">
          For emergencies, always call <span className="font-semibold text-foreground">911</span> first.
        </p>
      </div>
    </SubPage>
  );
}

/* ============ Shared UI ============ */

function SubPage({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background pb-24">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="truncate">{title}</h2>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4">{children}</div>
    </div>
  );
}

function QuickAction({ icon, label, subtitle, onClick }: { icon: React.ReactNode; label: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card rounded-2xl shadow-sm border border-border p-4 text-center hover:bg-muted/50 transition-colors active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F5F7FA] dark:bg-[#1C2333] flex items-center justify-center mx-auto mb-2">
        {icon}
      </div>
      <p className="font-medium text-[14px]">{label}</p>
      <p className="text-[12px] text-muted-foreground">{subtitle}</p>
    </button>
  );
}

function QuickLink({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[14px]">{label}</span>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-border mx-4" />;
}
