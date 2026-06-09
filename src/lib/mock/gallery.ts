import type { GalleryItem } from "@/lib/types/phase6";

export const MOCK_GALLERY: GalleryItem[] = [
  {
    id: "gal-1",
    plantId: "mock-1",
    plantName: "Meyer Lemon Tree",
    beforeUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    afterUrl: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=400&fit=crop",
    daysBetween: 90,
    note: "From sparse leaves to full canopy after consistent deep watering.",
  },
  {
    id: "gal-2",
    plantId: "mock-2",
    plantName: "Monstera",
    beforeUrl: "https://images.unsplash.com/photo-1593691502-6c263a056f09?w=400&h=400&fit=crop",
    afterUrl: "https://images.unsplash.com/photo-1614594975524-2aba8ac3cb18?w=400&h=400&fit=crop",
    daysBetween: 120,
    note: "Split leaves developed after moving to brighter indirect light.",
  },
  {
    id: "gal-3",
    plantId: "mock-3",
    plantName: "Bougainvillea",
    beforeUrl: "https://images.unsplash.com/photo-1593691502-6c263a056f09?w=400&h=400&fit=crop",
    afterUrl: "https://images.unsplash.com/photo-1466781176434-3370249eaa0a?w=400&h=400&fit=crop",
    daysBetween: 60,
    note: "Explosion of color after fixing drainage and full sun exposure.",
  },
];
