import React from "react";
import HeroSection from "@/components/marketing/HeroSection";
import ServicesSection from "@/components/marketing/ServicesSection";
import ProjectsSection from "@/components/marketing/ProjectsSection";
import CTASection from "@/components/marketing/CTASection";

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
