import { IAls } from 'src/common/types/async-local-storage.type';
import { IEmailInfo } from '../interface/email-info.interface';

// requestId + email info
export type EmailsJobData = IAls & IEmailInfo;
