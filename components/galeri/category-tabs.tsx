"use client";

import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { galleryCategories, galleryCategoryLabels } from "@/lib/validations/galeri";

const TABS = [
  { value: "semua", label: "Semua" },
  ...galleryCategories.map((c) => ({ value: c, label: galleryCategoryLabels[c] })),
];

export function CategoryTabs({ active }: { active: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "semua") params.delete("kategori");
    else params.set("kategori", value);
    router.push(`/galeri${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList className="flex-wrap">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer">
            {active === tab.value ? (
              <motion.span
                layoutId="category-tab-indicator"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 350, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
