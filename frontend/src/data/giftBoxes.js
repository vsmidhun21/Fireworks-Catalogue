// Static Gift Box collection data.
//
// This is intentionally NOT wired to the backend yet — the product/category
// database does not have a dedicated Gift Box entity. The shape below mirrors
// the fields a future `AdminGiftBoxService` / `/api/v1/gift-boxes` API would
// return, so this file can be swapped for a real API call later without
// changing any component that consumes it.
//
// Future admin-manageable fields: title, slug, image, description, contents,
// highlights, price, active, featured, sortOrder.

export const GIFT_BOXES = [
  {
    id: "gb-1",
    slug: "silver-celebration-box",
    title: "Silver Celebration Box",
    tagline: "A joyful starter collection for family celebrations.",
    accent: "from-slate-500 to-slate-700",
    price: 3000,
    description:
      "A thoughtfully curated mix of crowd-pleasing crackers and sparklers, perfect for a warm family evening of celebration without overwhelming variety.",
    highlights: ["Great for first-time gifting", "Balanced mix of sound & light items", "Compact, easy to carry box"],
    contents: [
      "Assorted sparklers",
      "Ground chakkars",
      "Flower pots",
      "Single sound crackers",
      "Children's fancy items",
    ],
    suitableFor: "Small family gatherings and get-togethers",
  },
  {
    id: "gb-2",
    slug: "gold-festive-box",
    title: "Gold Festive Box",
    tagline: "Our most popular pick — festive variety at its best.",
    accent: "from-amber-500 to-orange-600",
    price: 5000,
    price_original: 6000,
    featured: true,
    description:
      "A generous festive assortment spanning aerial fancy items, fountains and classic favourites — built for a full evening of celebration with friends and family.",
    highlights: ["Best value for the variety included", "Popular pick across repeat customers", "A mix of ground, aerial & sparkler items"],
    contents: [
      "Aerial fancy shots",
      "Peacock fountains",
      "Repeating shots",
      "Premium sparklers",
      "Ground chakkars & flower pots",
      "Children's special items",
    ],
    suitableFor: "Diwali nights, housewarmings and larger family functions",
  },
  {
    id: "gb-3",
    slug: "diamond-premium-box",
    title: "Diamond Premium Box",
    tagline: "A premium collection for a spectacular show.",
    accent: "from-brand-primary to-brand-primary-dark",
    price: 7000,
    description:
      "Built for those who want their celebration to stand out — a richer selection of aerial fancy items, bombs and combo favourites for an extended fireworks display.",
    highlights: ["Wider variety across every category", "Ideal for larger celebrations", "Elevated presentation box"],
    contents: [
      "Extended aerial fancy range",
      "Repeating shots (higher shot counts)",
      "Premium peacock & fountain items",
      "Bomb & sound cracker selection",
      "Full sparkler range",
    ],
    suitableFor: "Community celebrations and bigger festive nights",
  },
  {
    id: "gb-4",
    slug: "platinum-signature-box",
    title: "Platinum Signature Box",
    tagline: "Our most complete collection, for the grandest celebration.",
    accent: "from-brand-navy to-slate-800",
    price: 10000,
    description:
      "The complete Sri RR Crackers experience in one box — our widest possible variety, curated for a long, memorable, show-stopping celebration.",
    highlights: ["Our largest curated variety", "Designed for extended celebrations", "A signature gifting choice"],
    contents: [
      "Full aerial fancy & repeating shot range",
      "Premium fountains & peacocks",
      "Complete sparkler range",
      "Ground chakkars, flower pots & bombs",
      "Children's special assortment",
      "New arrival highlights",
    ],
    suitableFor: "Large celebrations, weddings and community events",
  },
];

export function getGiftBoxBySlug(slug) {
  return GIFT_BOXES.find((g) => g.slug === slug);
}
