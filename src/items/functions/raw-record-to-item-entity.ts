import { Item } from '../entities/item.entity';
import { IItemDbRecord } from '../interfaces/item-db-record.interface';

export function rawRecordToItemEntity(rawRecord: IItemDbRecord): Item {
    return {
        id: rawRecord.id,
        createdAt: rawRecord.created_at,
        updatedAt: rawRecord.updated_at,
        title: rawRecord.title,
        description: rawRecord.description,
        category: rawRecord.category,
        tags: rawRecord.tags,
        averageRating: rawRecord.average_rating,
        reviewCount: rawRecord.review_count,
        user: rawRecord.user,
    };
}
