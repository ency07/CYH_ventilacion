import React from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/components/marketing/HeroSection";

const ServicesSection = dynamic(() => import("@/components/marketing/ServicesSection"));
const ProjectsSection = dynamic(() => import("@/components/marketing/ProjectsSection"));
const CTASection = dynamic(() => import("@/components/marketing/CTASection"));

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <ProjectsSection />
      <CTASection />
    </>
  );
}
