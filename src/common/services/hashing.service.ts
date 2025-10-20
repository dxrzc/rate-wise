import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HashingService {
    async hash(data: string, saltRounds: number): Promise<string> {
        const salt = bcrypt.genSaltSync(saltRounds);
        return await bcrypt.hash(data, salt);
    }

    async compare(data: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(data, hash);
    }
}
