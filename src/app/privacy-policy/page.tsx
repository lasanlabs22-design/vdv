import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { privacyPolicy } from "@/lib/legal";

export const metadata: Metadata = { title: privacyPolicy.title };

export default function PrivacyPolicyPage() {
  return <LegalPage doc={privacyPolicy} />;
}
