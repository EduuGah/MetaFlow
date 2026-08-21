type ClassValue = string | false | null | undefined;

/**
 * Junta nomes de classe, descartando os valores falsos.
 *
 * Antes isto era `twMerge(clsx(...))` — duas dependências para uma linha de
 * trabalho. A resolução de conflitos do tailwind-merge (transformar
 * `px-2 px-4` em `px-4`) nunca foi usada aqui: nenhuma composição de classes
 * do projeto passa duas vezes a mesma propriedade.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
