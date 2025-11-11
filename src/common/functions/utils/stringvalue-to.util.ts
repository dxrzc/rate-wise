import { StringValue } from 'src/common/types/others/string-value.type';
import ms from 'ms';

export function stringValueToSeconds(stringValue: StringValue) {
    const milliseconds = ms(stringValue);
    return milliseconds / 1000;
}

export function stringValueToMinutes(stringValue: StringValue) {
    const milliseconds = ms(stringValue);
    return milliseconds / (1000 * 60);
}
