export type Dish = {
  id: string;
  label: string;
  emoji: string;
};

export const DISHES: Dish[] = [
  { id: "ramen", label: "рамен", emoji: "🍜" },
  { id: "seafood", label: "морепродукты", emoji: "🦐" },
  { id: "pasta", label: "паста", emoji: "🍝" },
  { id: "steak", label: "стейк", emoji: "🥩" },
  { id: "sushi", label: "суши", emoji: "🍣" },
  { id: "borsch", label: "борщ", emoji: "🥣" },
  { id: "dessert", label: "десертики", emoji: "🍰" },
];

export function dishLabel(id: string): string {
  return DISHES.find((dish) => dish.id === id)?.label ?? id;
}
