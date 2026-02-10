import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { ITEM_RULES } from 'src/items/policy/items.rules';

@Injectable()
export class ItemDataGenerator {
    get title(): string {
        const options = [
            () => faker.string.alpha({ length: { max: 10, min: 3 } }),
            () => faker.word.adjective() + ' ' + faker.word.noun(),
            () => faker.lorem.words(2),
            () => faker.git.commitMessage(),
        ];
        const randomFn = options[Math.floor(Math.random() * options.length)];
        const randomTitle = randomFn() + ' ' + Math.floor(Math.random() * 1000) + ' ' + randomFn();
        return randomTitle.slice(0, ITEM_RULES.TITLE.MAX).trim();
    }

    get description(): string {
        return faker.lorem.paragraphs(2);
    }

    get category(): string {
        return faker.commerce.department().toLowerCase();
    }

    get tags(): string[] {
        const tagsCount = Math.floor(Math.random() * 5) + 1;
        const tagsSet = new Set<string>();
        while (tagsSet.size < tagsCount) {
            tagsSet.add(faker.commerce.productAdjective().toLowerCase());
        }
        return Array.from(tagsSet);
    }

    get item() {
        return {
            title: this.title,
            description: this.description,
            category: this.category,
            tags: this.tags,
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
