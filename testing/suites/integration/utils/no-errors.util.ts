import { Response } from 'express';

export const success = (res: Response) => {
    expect(res).notToFail();
};
