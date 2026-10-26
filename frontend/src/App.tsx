import { Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import LandingPage from "@/pages/LandingPage"
import OverviewPage from "@/pages/OverviewPage"
import JourneyPage from "@/pages/JourneyPage"
import StoryPage from "@/pages/StoryPage"
import InsightsPage from "@/pages/InsightsPage"
import ExplorePage from "@/pages/ExplorePage"
import ComparePage from "@/pages/ComparePage"
import ResearchPage from "@/pages/ResearchPage"
import MethodologyPage from "@/pages/MethodologyPage"
import StudyPage from "@/pages/StudyPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/study" element={<StudyPage />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="journey" element={<JourneyPage />} />
        <Route path="story" element={<StoryPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}