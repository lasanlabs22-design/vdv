import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { termsAndConditions } from "@/lib/legal";

export const metadata: Metadata = { title: termsAndConditions.title };

export default function TermsPage() {
  return <LegalPage doc={termsAndConditions} />;
}
