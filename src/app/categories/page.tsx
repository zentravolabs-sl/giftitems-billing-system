import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WebsiteHeader } from "@/components/website-header";
import { WebsiteFooter } from "@/components/website-footer";
import { CartProvider } from "@/lib/cart-context";
import { ArrowRight, Layers } from "lucide-react";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, showOnWebsite: true },
    orderBy: { displayOrder: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2B2625]">
        <WebsiteHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold text-[#8F6B2A] uppercase tracking-wider block mb-1">
              Curated Collections
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
              Explore by Collection
            </h1>
            <p className="text-xs sm:text-sm text-[#756C6A] mt-2">
              Browse handcrafted wooden lighting, artificial flower arrangements, and timeless home accents
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group bg-white rounded-3xl border border-[#EAE5DD] overflow-hidden hover:border-[#C5A059] hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="aspect-16/10 bg-[#FAF5EF] overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop"}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold">
                    {c._count.products} Products
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#1A1817] group-hover:text-[#8F6B2A] transition">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="text-xs text-[#756C6A] mt-2 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#F0EBE4] flex items-center justify-between text-xs font-bold text-[#8F6B2A]">
                    <span>Explore Collection</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <WebsiteFooter />
      </div>
    </CartProvider>
  );
}
