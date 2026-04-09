import Link from "next/link"

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="text-5xl mb-4">✓</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
      <p className="text-sm text-gray-500 mb-8">
        Thank you for your order. The vendor will process it shortly.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  )
}
