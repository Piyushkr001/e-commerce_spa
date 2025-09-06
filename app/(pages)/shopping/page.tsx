"use client"

import React from "react"
import FiltersBar from "../../_components/FiltersBar"
import ProductsGrid from "../../_components/ProductsGrid"

export default function ShoppingPage() {
  return (
    <div>
      <div className="mt-10 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold">Shop</h2>
        <p className="text-sm text-gray-400 mt-1">
          Explore All New Products here
        </p>
      </div>

      {/* Products section */}
      <section className="max-w-7xl mx-auto px-4 py-8 space-y-5">
        {/* Assumes FiltersBar manipulates the URL (q, category, min, max, sort, page) */}
        <FiltersBar />
        {/* ProductsGrid handles its own fetching, loading, error, and pagination */}
        <ProductsGrid />
      </section>
    </div>
  )
}
