import { ObjectLiteral, Repository } from 'typeorm';
import { IDecodedCursor } from 'src/pagination/interfaces/decoded-cursor.interface';

export type PaginationEdgesFactoryOptions<
    EntityType extends ObjectLiteral,
    RawRecord extends { id: string },
> = {
    repository: Repository<EntityType>;
    limit: number;
    transformFunction: (obj: RawRecord) => EntityType;
    decodedCursor?: IDecodedCursor;
};
