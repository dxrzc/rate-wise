import { faker } from '@faker-js/faker';

export class ReviewSeedService {
    get content(): string {
        return faker.lorem.paragraphs(2);
    }

    get rating(): number {
        return faker.number.int({ min: 0, max: 10 });
    }

    get votes(): number {
        return faker.number.int({ min: 0, max: 10000 });
    }

    get review() {
        return {
            content: this.content,
            rating: this.rating,
            votes: this.votes,
        };
    }

    get reviewInput() {
        return {
            content: this.content,
            rating: this.rating,
        };
    }
}
