import Link from 'next/link';
import {
  Shield,
  FileCheck,
  Clock,
  BarChart3,
  Lock,
  Download,
  Bell,
  Search,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileCheck,
    title: 'Document Versioning',
    description:
      'Every upload creates a new version. Old documents are preserved forever for complete audit trails.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description:
      'Fine-grained access control from superadmin down to individual teachers and students.',
  },
  {
    icon: Clock,
    title: 'Expiry Tracking',
    description:
      'Automatic status updates and email alerts 30, 60, and 90 days before documents expire.',
  },
  {
    icon: BarChart3,
    title: 'Risk Heatmap',
    description:
      'Visual compliance overview across all schools and branches. Spot gaps instantly.',
  },
  {
    icon: Download,
    title: 'One-Click Audit Export',
    description:
      'Generate a complete audit-ready ZIP pack of all valid mandatory documents in seconds.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Automated email alerts keep responsible staff informed about upcoming document expirations.',
  },
  {
    icon: Search,
    title: 'Powerful Search',
    description:
      'Find any document instantly with full-text search across names, types, and metadata.',
  },
  {
    icon: Shield,
    title: 'Secure Storage',
    description:
      'All files stored in private buckets with time-limited signed URLs. Never publicly accessible.',
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'For single schools',
    features: ['1 school', 'Up to 3 branches', '5 admin users', '10 document types', 'Email support'],
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    description: 'For school groups',
    features: [
      'Up to 10 schools',
      'Unlimited branches',
      '25 admin users',
      'Unlimited document types',
      'Risk heatmap',
      'Audit ZIP export',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Unlimited schools',
      'Unlimited everything',
      'SSO integration',
      'Custom branding',
      'API access',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">SchoolComply</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</a>
            <Link href="/login" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-24 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            School Compliance,{' '}
            <span className="text-blue-600">Simplified</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
            The all-in-one platform for school groups to manage compliance documents,
            track expirations, and stay audit-ready. Never miss a deadline again.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-gray-300 px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Everything you need for compliance
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Built specifically for school groups managing multi-branch document compliance.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <feature.icon className="h-8 w-8 text-blue-600" />
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Start free, scale as you grow.
            </p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.highlighted
                    ? 'border-blue-600 bg-white shadow-xl ring-1 ring-blue-600 dark:bg-gray-950'
                    : 'bg-white dark:border-gray-800 dark:bg-gray-950'
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileCheck className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-8 block rounded-lg py-2.5 text-center text-sm font-semibold ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ready to simplify your compliance?
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Join hundreds of schools already using SchoolComply to stay audit-ready.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-10 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                SchoolComply
              </span>
            </div>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} School Compliance Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
