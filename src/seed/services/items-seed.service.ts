import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { ITEMS_LIMITS } from 'src/items/constants/items.constants';

@Injectable()
export class ItemsSeedService {
    get title(): string {
        const options = [
            () => faker.string.alpha({ length: { max: 10, min: 3 } }),
            () => faker.word.adjective() + ' ' + faker.word.noun(),
            () => faker.lorem.words(2),
            () => faker.git.commitMessage(),
        ];
        const randomFn = options[Math.floor(Math.random() * options.length)];
        const randomTitle = randomFn() + ' ' + Math.floor(Math.random() * 1000) + ' ' + randomFn();
        return randomTitle.slice(0, ITEMS_LIMITS.TITLE.MAX);
    }

    get description(): string {
        return faker.lorem.paragraphs(2);
    }

    get category(): string {
        return faker.commerce.department();
    }

    get averageRating(): number {
        return Math.round(Math.random() * 100) / 10;
    }

    get tags(): string[] {
        const tagsCount = Math.floor(Math.random() * 5) + 1;
        const tagsSet = new Set<string>();
        while (tagsSet.size < tagsCount) {
            tagsSet.add(faker.commerce.productAdjective());
        }
        return Array.from(tagsSet);
    }

    get item() {
        return {
            title: this.title,
            description: this.description,
            category: this.category,
            tags: this.tags,
            averageRating: this.averageRating,
        };
    }

    get itemInput() {
        return {
            title: this.title,
            description: this.description,
            category: this.category,
            tags: this.tags,
        };
    }
}
