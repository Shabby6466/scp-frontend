import Link from 'next/link';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingToolbar } from '@/components/landing-toolbar';
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-elevated">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              School System
            </span>
          </div>
          <nav className="flex items-center gap-4 sm:gap-6">
            <a
              href="#features"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Pricing
            </a>
            <LandingToolbar />
            <Link href="/login" className={cn(buttonVariants({ size: 'sm' }))}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.08] via-background to-background py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            School compliance,{' '}
            <span className="text-primary">simplified</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            The all-in-one platform for school groups to manage compliance documents,
            track expirations, and stay audit-ready. Never miss a deadline again.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: 'lg' }), 'w-full min-w-[200px] sm:w-auto')}
            >
              Get started
            </Link>
            <a
              href="#features"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'w-full min-w-[200px] sm:w-auto',
              )}
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need for compliance
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              Built for school groups managing multi-branch document compliance.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="shadow-elevated transition-shadow hover:shadow-md">
                <CardHeader className="gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-base leading-snug">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-border/80 bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-muted-foreground">Start free, scale as you grow.</p>
          </div>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? 'border-primary shadow-elevated ring-2 ring-primary/20'
                    : 'shadow-elevated'
                }
              >
                <CardHeader>
                  {plan.highlighted && (
                    <Badge className="mb-1 w-fit bg-primary/15 text-primary hover:bg-primary/15">
                      Most popular
                    </Badge>
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: plan.highlighted ? 'default' : 'outline' }),
                      'w-full',
                    )}
                  >
                    Get started
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to simplify your compliance?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join schools using this platform to stay audit-ready.
          </p>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: 'lg' }), 'mt-8 inline-flex')}
          >
            Start your free trial
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-sm font-medium text-muted-foreground">School System</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} School Compliance Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
