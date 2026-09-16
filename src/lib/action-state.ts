/**
 * Forma común del estado que devuelven las server actions a `useActionState`.
 * Vive fuera de los archivos "use server" porque esos módulos solo pueden
 * exportar funciones asíncronas.
 */
export type ActionState = {
  error?: string;
  success?: string;
};

export const EMPTY_STATE: ActionState = {};
