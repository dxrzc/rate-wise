export const trimAndLowercase = (obj: { value: string }): string =>
    typeof obj.value === 'string' ? obj.value.trim().toLowerCase() : obj.value;
