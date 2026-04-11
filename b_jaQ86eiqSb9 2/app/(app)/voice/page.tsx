import { EmotionDashboard } from "@/components/emotion-dashboard"
import { PageHeader } from "@/components/page-header"

export default function VoiceAnalysisPage() {
  return (
    <>
      <PageHeader
        title="Voice Analysis"
        subtitle="Capture audio, inspect the spectrum, and read neural interpretations in real time."
      />
      <EmotionDashboard />
    </>
  )
}
