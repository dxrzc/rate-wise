export const trim = (obj: { value: string }): string =>
    typeof obj.value === 'string' ? obj.value.trim() : obj.value;
