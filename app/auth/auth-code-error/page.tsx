import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Samigo
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Bekræftelsesfejl</CardTitle>
            <CardDescription className="text-center">Der opstod et problem med at bekræfte din email</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Linket kan være udløbet eller allerede brugt. Prøv at logge ind eller anmod om et nyt bekræftelseslink.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/auth/login">Prøv at logge ind</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/signup">Opret ny konto</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
