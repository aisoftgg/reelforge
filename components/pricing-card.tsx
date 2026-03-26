import { cn } from "@/lib/utils";

type PricingCardProps = {
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
};

export function PricingCard({
  name,
  price,
  description,
  features,
  featured = false
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-zinc-900/80 p-6",
        featured
          ? "border-blue-500/60 shadow-glow"
          : "border-zinc-800"
      )}
    >
      <div className="mb-6 space-y-2">
        <p className="text-sm font-medium text-blue-400">{name}</p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-semibold text-white">{price}</span>
          <span className="pb-1 text-sm text-zinc-400">/ month</span>
        </div>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <ul className="space-y-3 text-sm text-zinc-300">
        {features.map((feature) => (
          <li key={feature} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
