"use client";

import { useActionState } from "react";

import { Button, Field, FormError, Input } from "@/components/ui";

import { loginAction, type LoginState } from "./actions";

const INITIAL: LoginState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {/*
        La cuenta ROOT entra con un usuario simple (`root`), así que la etiqueta
        no puede hablar solo de correos. Los clientes siguen usando su correo o
        su código.
      */}
      <Field
        label="Usuario, correo o código de cliente"
        hint="Tu código tiene el formato TGC-0001."
      >
        <Input
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="vos@tunegocio.com"
        />
      </Field>

      <Field label="Contraseña">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </Field>

      <FormError>{state.error}</FormError>

      <Button type="submit" disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
