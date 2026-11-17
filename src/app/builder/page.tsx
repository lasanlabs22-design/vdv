import type { Metadata } from "next";
import BuilderLoader from "@/components/builder/BuilderLoader";
import "../studio/studio.css";
import "./builder.css";

export const metadata: Metadata = {
  title: "Design your own",
  description: "Set out your plot, place every room, choose colours and an elevation, and watch your project being built in 3D.",
};

export default function BuilderPage() {
  return <BuilderLoader />;
}
