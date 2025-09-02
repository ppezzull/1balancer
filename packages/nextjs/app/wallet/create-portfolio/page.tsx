"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChartCreator } from "~~/components/shared/PieChartCreator";

export default function WalletCreatePortfolio() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Check for stored template on mount
  useEffect(() => {
    const storedTemplate = localStorage.getItem("selectedPortfolioTemplate");
    if (storedTemplate) {
      try {
        setSelectedTemplate(JSON.parse(storedTemplate));
      } catch (error) {
        console.error("Error parsing stored template:", error);
      }
    }
  }, []);

  // No longer need event listener since we use Next.js routing

  return (
    <div className="min-h-screen bg-background">
      <PieChartCreator
        initialTemplate={selectedTemplate}
        onBack={() => {
          // Clear stored template and navigate back to wallet home
          localStorage.removeItem("selectedPortfolioTemplate");
          setSelectedTemplate(null);
          router.push("/wallet");
        }}
      />
    </div>
  );
}
