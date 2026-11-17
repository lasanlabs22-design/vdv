import type { Metadata } from "next";
import Studio from "@/components/studio/Studio";
import { planById, type PlanId } from "@/lib/plans";
import "./studio.css";

export const metadata: Metadata = {
  title: "3D Studio",
  description: "Pick a 1 BHK, 2 BHK, 3 BHK, villa, office, showroom or pooja room, customise every room and watch it rise in 3D.",
};

export default async function StudioPage({ searchParams }: PageProps<"/studio">) {
  const { type } = await searchParams;
  const initial: PlanId = typeof type === "string" && planById(type) ? (type as PlanId) : "2bhk";
  return <Studio initial={initial} />;
}
