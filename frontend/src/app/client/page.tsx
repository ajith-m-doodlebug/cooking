import Link from "next/link";

export default function ClientHomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome</h1>
      <p className="text-gray-600 mb-6">
        Search for verified CAs and book consultations.
      </p>
      <Link
        href="/search"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
      >
        Search CAs
      </Link>
    </main>
  );
}
