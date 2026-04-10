import { useState } from 'react';
import { CompanyLayout } from '../components/company/CompanyLayout';
import { HomeSection } from '../components/company/sections/HomeSection';
import { OrgSection } from '../components/company/sections/OrgSection';
import { Scope1FuelSection, Scope1FleetSection } from '../components/company/sections/Scope1Sections';
import { Scope2ElecSection, Scope2HeatingSection } from '../components/company/sections/Scope2Sections';
import { Scope3CommuteSection, Scope3TravelSection, Scope3SupplySection } from '../components/company/sections/Scope3Sections';
import { AnalyticsSection } from '../components/company/sections/AnalyticsSection';
import { AIRecommendationSection } from '../components/company/sections/AIRecommendationSection';
import { InstitutionalAnalyticsPanel } from '../components/company/sections/InstitutionalAnalyticsPanel';
import type { UserProfile } from '../types';

// All valid section IDs – mapped to exact problem statement module names
type SectionId =
  | 'home'
  | 'org'
  // Module 1: Activity-Based Carbon Tracking (sub-sections)
  | 'activity-tracking'
  | 'scope1-fuel'
  | 'scope1-fleet'
  | 'scope2-elec'
  | 'scope2-heating'
  | 'scope3-commute'
  | 'scope3-travel'
  | 'scope3-supply'
  // Module 2: Carbon Footprint Calculator
  | 'footprint-calculator'
  // Module 3: AI-Based Recommendation System
  | 'ai-recommendations'
  // Module 4: Visualization Dashboard
  | 'visualization'
  // Module 5: Institutional Analytics Panel
  | 'institutional-analytics';

const SectionContent = ({
  section,
  onNav,
}: {
  section: SectionId;
  onNav: (id: string) => void;
}) => {
  switch (section) {
    // ── Home ────────────────────────────────────────────────────────
    case 'home':
      return <HomeSection onNav={onNav} />;

    // ── My Organization ─────────────────────────────────────────────
    case 'org':
      return <OrgSection />;

    // ── Module 1: Activity-Based Carbon Tracking ────────────────────
    case 'activity-tracking':
    case 'scope1-fuel':
      return <Scope1FuelSection />;
    case 'scope1-fleet':
      return <Scope1FleetSection />;
    case 'scope2-elec':
      return <Scope2ElecSection />;
    case 'scope2-heating':
      return <Scope2HeatingSection />;
    case 'scope3-commute':
      return <Scope3CommuteSection />;
    case 'scope3-travel':
      return <Scope3TravelSection />;
    case 'scope3-supply':
      return <Scope3SupplySection />;

    // ── Module 2: Carbon Footprint Calculator ───────────────────────
    case 'footprint-calculator':
      return <AnalyticsSection />;

    // ── Module 3: AI-Based Recommendation System ────────────────────
    case 'ai-recommendations':
      return <AIRecommendationSection />;

    // ── Module 4: Visualization Dashboard ──────────────────────────
    case 'visualization':
      return <AnalyticsSection showCharts />;

    // ── Module 5: Institutional Analytics Panel ─────────────────────
    case 'institutional-analytics':
      return <InstitutionalAnalyticsPanel />;

    default:
      return <HomeSection onNav={onNav} />;
  }
};

export const CompanyPage = ({ profile }: { profile: UserProfile }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('home');

  return (
    <CompanyLayout
      profile={profile}
      activeSection={activeSection}
      onNav={(id) => setActiveSection(id as SectionId)}
    >
      <SectionContent
        section={activeSection}
        onNav={(id) => setActiveSection(id as SectionId)}
      />
    </CompanyLayout>
  );
};
