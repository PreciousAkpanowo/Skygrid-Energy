"use client";

import Link from "next/link";
import { Twitter, Linkedin, ShieldCheck, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface SocialLinkProps {
  href: string;
  label: string;
  children: React.ReactNode;
}

const SocialLink = ({ href, label, children }: SocialLinkProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/60 text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {children}
    </a>
  );
};

interface FooterGroupProps {
  title: string;
  links: Array<{ label: string; to: string }>;
}

const FooterGroup = ({ title, links }: FooterGroupProps) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold tracking-wide text-foreground">
        {title}
      </h4>
      <div className="grid gap-2">
        {links.map((l) => (
          <Link
            key={l.to}
            href={`/${l.to}`}
            className="text-sm text-foreground/80 no-underline transition-all duration-200 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export function SkyGridFooter() {
  return (
    <footer className="w-full border-t border-border bg-background/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1.3fr_1fr] lg:items-start">
          {/* Brand */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background shadow-sm"
              >
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary/40 to-primary/70" />
              </div>
              <div className="leading-tight">
                <p className="m-0 text-base font-semibold tracking-tight text-foreground">
                  SkyGrid Energy
                </p>
                <p className="m-0 text-xs text-foreground/70">
                  Community energy exchange
                </p>
              </div>
            </div>
            <p className="mt-4 mb-0 text-sm leading-relaxed text-foreground/80">
              Powering local, peer-to-peer energy communities.
            </p>
          </div>

          {/* Link groups */}
          <div className="grid gap-8 text-center lg:grid-cols-2 lg:text-left">
            <FooterGroup
              title="Product"
              links={[
                { label: "Overview", to: "overview" },
                { label: "Marketplace", to: "marketplace" },
                { label: "Wallet", to: "wallet" },
                { label: "FAQ", to: "faq" },
              ]}
            />
            <FooterGroup
              title="Company"
              links={[
                { label: "About", to: "about" },
                { label: "Contact", to: "contact" },
                { label: "Terms", to: "terms" },
                { label: "Privacy", to: "privacy" },
              ]}
            />
          </div>

          {/* Social + note */}
          <div className="flex flex-col items-center gap-4 lg:items-end">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SocialLink href="https://x.com" label="SkyGrid on X">
                      <Twitter size={18} className="text-foreground" />
                    </SocialLink>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="m-0 text-sm">Follow updates on X</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SocialLink
                      href="https://www.linkedin.com"
                      label="SkyGrid on LinkedIn"
                    >
                      <Linkedin size={18} className="text-foreground" />
                    </SocialLink>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="m-0 text-sm">Connect on LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="text-center lg:text-right">
              <p className="m-0 text-xs leading-relaxed text-foreground/70">
                Demo experience only — payments, balances, and settlement flows
                are simulated with sample data.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">
          <p className="text-xs text-foreground/70">
            © {new Date().getFullYear()} SkyGrid Energy. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-foreground/80 shadow-sm">
              <ShieldCheck size={14} className="text-foreground/80" />
              <span>Secure-by-design UX patterns</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-foreground/80 shadow-sm">
              <Zap size={14} className="text-foreground/80" />
              <span>Real-time grid signals (simulated)</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}