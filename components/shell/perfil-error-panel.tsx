"use client";

import { LogOut, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "@/app/actions/auth";

export function PerfilErrorPanel({
  titulo,
  mensaje,
}: {
  titulo: string;
  mensaje: string;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-amber-500" />
            <CardTitle>{titulo}</CardTitle>
          </div>
          <CardDescription>{mensaje}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
