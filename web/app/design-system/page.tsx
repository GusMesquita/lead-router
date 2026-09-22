"use client"

import Link from "next/link"

import { Auth13 } from "@/components/beste/block/auth13"
import { FinancialTable } from "@/components/bjork-ui/tables/financial-table"
import { LeadsTable } from "@/components/bjork-ui/tables/leads-table"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "@/components/ui/card"
import {
  ContactChannelItem,
  ContactChannels,
} from "@/components/ui/contact-channels"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon, UserIcon } from "@phosphor-icons/react"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
            <AvatarBadge className="bg-green-600 dark:bg-green-800" />
          </Avatar>
          <Avatar className="grayscale">
            <AvatarImage
              src="https://github.com/pranathip.png"
              alt="@pranathip"
            />
            <AvatarFallback>PP</AvatarFallback>
            <AvatarBadge>
              <PlusIcon />
            </AvatarBadge>
          </Avatar>
          <AvatarGroup className="grayscale">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://github.com/maxleiter.png"
                alt="@maxleiter"
              />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage
                src="https://github.com/evilrabbit.png"
                alt="@evilrabbit"
              />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
          </AvatarGroup>
        </div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full">
          <Badge variant={"link"}>link</Badge>
          <Badge variant={"default"}>default</Badge>
          <Badge variant={"outline"}>outline</Badge>
          <Badge variant={"secondary"}>secondary</Badge>
          <Badge variant={"ghost"}>ghost</Badge>
          <Badge variant={"destructive"}>destructive</Badge>
        </div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<a href="/components" />}>
                  Components
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Separator orientation="vertical"/>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<a href="#">Home</a>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button size="icon-sm" variant="ghost">
                        <BreadcrumbEllipsis />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuItem>Documentation</DropdownMenuItem>
                      <DropdownMenuItem>Themes</DropdownMenuItem>
                      <DropdownMenuItem>GitHub</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<a href="#">Components</a>} />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full">
          <Button variant={"default"} size={"default"}>default</Button>
          <Button variant={"link"} size={"default"}>Link</Button>
          <Button variant={"outline"} size={"default"}>outline</Button>
          <Button variant={"secondary"} size={"default"}>secondary</Button>
          <Button variant={"ghost"} size={"default"}>ghost</Button>
          <Button variant={"destructive"} size={"default"}>descrutive</Button>
          <Button variant={"default"} size={"default"}>default</Button>
          <Button variant={"default"} size={"xs"}>xs</Button>
          <Button variant={"default"} size={"sm"}>sm</Button>
          <Button variant={"default"} size={"lg"}>lg</Button>
          <Button variant={"default"} size={"icon"}>icon</Button>
          <Button variant={"default"} size={"icon-xs"}>icon-xs</Button>
          <Button variant={"default"} size={"icon-sm"}>icon-sm</Button>
          <Button variant={"default"} size={"icon-lg"}>icon-lg</Button>
        </div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
              <CardAction>
                <Button variant="link">Sign Up</Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <form>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input id="password" type="password" required />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full">
                Login
              </Button>
              <Button variant="outline" className="w-full">
                Login with Google
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full"></div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full"></div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full"></div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full"></div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full"></div>
        <div className="flex flex-row gap-4 py-2 bg-accent items-center justify-center rounded-full"></div>
        
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Auth13 />
          <FinancialTable />
          <LeadsTable />
          <ContactChannels items={[Example]} />
        </div>
      </div>
    </div>
  )
}

const Example: ContactChannelItem = {
  id: "1",
  platform: "#",
  handle: "Advantages",
  href: "#",
  action: "copy",
  copyValue: "#",
  tooltip: "Narrative",
  shortcutKey: "g",
  icon: <UserIcon />,
}
