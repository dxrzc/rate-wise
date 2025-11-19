import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { ITEMS_LIMITS } from 'src/items/constants/items.constants';

@Injectable()
export class ItemsSeedService {
    get title(): string {
        const options = [
            () => faker.company.name(),
            () => faker.commerce.productName(),
            () => faker.book.title(),
            () => faker.book.series(),
            () => faker.food.dish(),
            () => faker.music.songName(),
            () => faker.music.artist(),
            () => faker.music.album(),
        ];
        const randomFn = options[Math.floor(Math.random() * options.length)];
        let randomTitle = '';
        while (
            randomTitle.length < ITEMS_LIMITS.TITLE.MIN ||
            randomTitle.length > ITEMS_LIMITS.TITLE.MAX
        )
            randomTitle = randomFn();
        return randomTitle;
    }

    get description(): string {
        return faker.lorem.paragraphs(2);
    }

    get category(): string {
        return faker.commerce.department();
    }

    get averageRating(): number {
        return parseFloat((Math.random() * 5).toFixed(2));
    }

    get reviewCount(): number {
        return Math.floor(Math.random() * 1000);
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
            reviewCount: this.reviewCount,
        };
    }
}
