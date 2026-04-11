type ClassNameValue = string | undefined | null | false

export function joinClasses(...values: ClassNameValue[]): string {
  return values.filter(Boolean).join(' ')
}
