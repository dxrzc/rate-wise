import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {
    hash(data: string, saltRounds: number): string {
        const salt = bcrypt.genSaltSync(saltRounds);
        return bcrypt.hashSync(data, salt);
    }

    compare(data: string, hash: string): boolean {
        return bcrypt.compareSync(data, hash);
    }
}
