export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Branchera',
    description: 'Where Progress Happens',
    url: 'https://branchera.com',
    logo: 'https://branchera.com/logo.png', // Update when you have a logo
    sameAs: [
      // Add your social media URLs here
      // 'https://twitter.com/branchera',
      // 'https://linkedin.com/company/branchera',
      // 'https://github.com/branchera'
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex items-center justify-center">
        <main className="text-center">
          <h1 className="text-6xl font-bold mb-4">
            Branchera
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Where Progress Happens
          </p>
        </main>
      </div>
    </>
  );
}