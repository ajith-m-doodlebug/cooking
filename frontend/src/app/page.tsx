import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">CA Marketplace</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Discover and book verified Chartered Accountants for consultations.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Log in
        </Link>
        <Link
          href="/search"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Search CAs
        </Link>
      </div>
    </main>
  );
}
