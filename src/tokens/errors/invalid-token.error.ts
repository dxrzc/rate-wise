export class InvalidToken extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidToken';
        Object.setPrototypeOf(this, InvalidToken.prototype);
    }
}

export class InvalidDataInToken extends Error {
    constructor() {
        super('Token payload does not contain expected data');
        this.name = 'InvalidDataInToken';
        Object.setPrototypeOf(this, InvalidDataInToken.prototype);
    }
}

export class InvalidTokenPurpose extends Error {
    constructor() {
        super('Invalid token purpose');
        this.name = 'InvalidTokenPurpose';
        Object.setPrototypeOf(this, InvalidTokenPurpose.prototype);
    }
}
