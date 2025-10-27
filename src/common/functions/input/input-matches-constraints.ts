/**
 * Useful when you dont want the InputType to reject the input with an invalid input message
 * for security reasons. (e.g password length validation).
 */
export function matchesConstraints(
    input: string,
    constraints: { MIN?: number; MAX?: number },
): boolean {
    if (constraints.MIN !== undefined && input.length < constraints.MIN) {
        return false;
    }
    if (constraints.MAX !== undefined && input.length > constraints.MAX) {
        return false;
    }
    return true;
}
