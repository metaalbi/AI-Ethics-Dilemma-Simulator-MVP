export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-iaca-blue mb-4">
        Welcome to IACA Alumni Portal
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mb-8">
        Connect with fellow alumni, stay updated with the latest news, and manage your profile in one place.
      </p>
      <div className="glass-card p-8 grid gap-4 w-full max-w-lg">
        <h2 className="text-xl font-semibold text-iaca-blue">Get Started</h2>
        <p className="text-gray-600">
          Join our growing community of IACA alumni and stay connected with your peers.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <a
            href="/register"
            className="bg-iaca-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            Join Now
          </a>
          <a
            href="/login"
            className="glass-button px-6 py-3 rounded-lg font-medium text-iaca-blue text-center"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
