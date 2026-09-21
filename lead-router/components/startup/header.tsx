"use client"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ArrowRight, List } from "@phosphor-icons/react"

const navLinks = ["Blocks", "Docs", "Pricing", "Changelog"]

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-6 px-6">
        <a href="#" className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="size-6 shrink-0 text-primary"
          >
            <rect x="3" y="3" width="8" height="8" transform="rotate(-6 7 7)" />
            <rect
              x="3"
              y="13"
              width="8"
              height="8"
              transform="rotate(5 7 17)"
            />
            <rect
              x="13"
              y="13"
              width="8"
              height="8"
              transform="rotate(-4 17 17)"
            />
            <rect
              x="13"
              y="3"
              width="8"
              height="8"
              transform="rotate(15 17 7)"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight">Acme</span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button
            render={<a href="#" />}
            nativeButton={false}
            className="hidden md:inline-flex"
          >
            Book A Demo
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="md:hidden" />
              }
              aria-label="Open menu"
            >
              <List aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xs">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="8"
                      height="8"
                      transform="rotate(-6 7 7)"
                    />
                    <rect
                      x="3"
                      y="13"
                      width="8"
                      height="8"
                      transform="rotate(5 7 17)"
                    />
                    <rect
                      x="13"
                      y="13"
                      width="8"
                      height="8"
                      transform="rotate(-4 17 17)"
                    />
                    <rect
                      x="13"
                      y="3"
                      width="8"
                      height="8"
                      transform="rotate(15 17 7)"
                    />
                  </svg>
                  Acme
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-2">
                {navLinks.map((link) => (
                  <SheetClose
                    key={link}
                    render={<a href="#" />}
                    nativeButton={false}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link}
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto p-4">
                <Button
                  render={<a href="#" />}
                  nativeButton={false}
                  className="w-full"
                >
                  Book A Demo
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
