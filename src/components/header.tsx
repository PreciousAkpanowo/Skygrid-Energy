"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  FileText,
  BarChart2,
  PlusCircle,
  Activity,
  Tag,
  Calendar,
  MapPin,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Bolt,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PostEnergyFormValues {
  amount: string;
  price: string;
  delivery: string;
  node: string;
  note?: string;
}

interface EnergyListing extends PostEnergyFormValues {
  id: number;
  createdAt: string;
}

const iconMap = {
  LayoutDashboard,
  Settings,
  FileText,
  BarChart2,
} as const;

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = useMemo(
    () => [
      { label: "Dashboard", targetId: "dashboard", icon: "LayoutDashboard" as const },
      { label: "Marketplace", targetId: "marketplace", icon: "Settings" as const },
      { label: "Wallet", targetId: "wallet", icon: "FileText" as const },
      { label: "Live Activity", targetId: "live-activity", icon: "BarChart2" as const },
    ],
    []
  );

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, targetId: string) => {
      event.preventDefault();

      const scrollToSection = () => {
        if (typeof document === "undefined") return;
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };

      const isOnHome = pathname === "/" || pathname === "/home";

      if (!isOnHome) {
        router.push("/");
        setTimeout(scrollToSection, 50);
      } else {
        scrollToSection();
      }
    },
    [pathname, router]
  );

  const [isPostEnergyOpen, setIsPostEnergyOpen] = useState(false);
  const [listings, setListings] = useState<EnergyListing[]>([]);
  const [lastPostedListing, setLastPostedListing] =
    useState<EnergyListing | null>(null);

  const form = useForm<PostEnergyFormValues>({
    defaultValues: {
      amount: "",
      price: "",
      delivery: "",
      node: "",
      note: "",
    },
    mode: "onSubmit",
  });

  const handleOpenChange = (open: boolean) => {
    setIsPostEnergyOpen(open);
    if (!open) {
      form.reset({ amount: "", price: "", delivery: "", node: "", note: "" });
    }
  };

  const onSubmit = (values: PostEnergyFormValues) => {
    if (!values.amount || !values.price || !values.delivery || !values.node) {
      return;
    }

    const listing: EnergyListing = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...values,
    };

    setListings((prev) => [listing, ...prev]);
    setLastPostedListing(listing);

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent("energy:posted", {
          detail: listing,
        })
      );
    }

    form.reset({ amount: "", price: "", delivery: "", node: "", note: "" });
    setIsPostEnergyOpen(false);
  };

  return (
    <div className="w-full h-full">
      <header className="w-full h-[85px] bg-background shadow-md">
        <NavigationMenu className="w-full h-full max-w-none">
          <NavigationMenuList className="w-full h-full grid grid-cols-3 items-center px-8">
            {/* Logo/Brand - Left */}
            <NavigationMenuItem className="justify-self-start">
              <Link href="/" className="text-xl font-bold text-foreground">
                SkyGrid Energy
              </Link>
            </NavigationMenuItem>

            {/* Navigation Items - Center */}
            <div className="flex items-center justify-center gap-8">
              {navItems.map((item, index) => {
                const IconComponent = iconMap[item.icon];
                return (
                  <NavigationMenuItem key={index}>
                    <NavigationMenuLink asChild>
                      <button
                        type="button"
                        onClick={(event) => handleNavClick(event, item.targetId)}
                        className="flex items-center gap-2 text-sm text-foreground hover:bg-secondary hover:text-secondary-foreground px-4 py-2 rounded transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                      >
                        {IconComponent && (
                          <IconComponent size={18} className="text-inherit" />
                        )}
                        <span>{item.label}</span>
                      </button>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </div>

            {/* Call to Action - Right */}
            <NavigationMenuItem className="justify-self-end flex items-center gap-3">
              {lastPostedListing && (
                <Badge className="hidden xl:inline-flex bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full animate-in fade-in zoom-in">
                  <Bolt size={14} className="mr-1 text-secondary-foreground" />
                  <span>
                    Posted {lastPostedListing.amount} MWh @{" "}
                    {lastPostedListing.price} /MWh
                  </span>
                </Badge>
              )}

              <Dialog open={isPostEnergyOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 shadow-lg rounded transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex items-center gap-2">
                    <PlusCircle size={18} className="text-primary-foreground" />
                    <span>Post Energy</span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="text-foreground text-xl">
                      Post New Energy Offer
                    </DialogTitle>
                    <DialogDescription className="text-sm text-foreground/80">
                      Enter the details of the block you want to list on the
                      SkyGrid marketplace.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="mt-4 space-y-4"
                    >
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="amount"
                          rules={{ required: "Amount is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-1">
                                <Activity size={16} className="text-foreground" />
                                Amount (MWh)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="e.g. 25.0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price"
                          rules={{ required: "Price is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-1">
                                <Tag size={16} className="text-foreground" />
                                Price (/MWh)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="e.g. 68.50"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="delivery"
                          rules={{ required: "Delivery window is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-1">
                                <Calendar size={16} className="text-foreground" />
                                Delivery Window
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. Today 18:00 - 20:00 UTC"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="node"
                          rules={{ required: "Node is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-1">
                                <MapPin size={16} className="text-foreground" />
                                Node
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select node" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="nyiso-zone-j">
                                      NYISO Zone J (NYC)
                                    </SelectItem>
                                    <SelectItem value="ercot-houston">
                                      ERCOT Houston
                                    </SelectItem>
                                    <SelectItem value="caiso-sp15">
                                      CAISO SP-15
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground flex items-center gap-1">
                              <FileText size={16} className="text-foreground" />
                              Optional Note
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder="Grid constraints, firming details, or balancing preferences."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-2">
                        <div className="text-xs text-foreground/70 flex items-center gap-1">
                          <ShieldCheck size={14} className="text-foreground/70" />
                          <p>
                            Frontend-only mock listing. No on-chain transaction
                            will be executed.
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="px-4"
                            onClick={() => handleOpenChange(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
                          >
                            <UploadCloud
                              size={18}
                              className="text-primary-foreground"
                            />
                            <span>Publish Offer</span>
                          </Button>
                        </div>
                      </div>

                      {lastPostedListing && (
                        <div className="pt-2">
                          <Alert>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-foreground" />
                              <div className="text-sm text-foreground">
                                <p>
                                  Your energy offer for {lastPostedListing.amount}{" "}
                                  MWh at {lastPostedListing.price} /MWh has been
                                  published locally.
                                </p>
                              </div>
                            </div>
                          </Alert>
                        </div>
                      )}
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </header>
    </div>
  );
}