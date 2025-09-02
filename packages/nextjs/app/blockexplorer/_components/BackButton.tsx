"use client";

import { useRouter } from "next/navigation";
import { Button } from "~~/components/shared/ui/button";

export const BackButton = () => {
  const router = useRouter();
  return (
    <Button size="sm" onClick={() => router.back()}>
      Back
    </Button>
  );
};
