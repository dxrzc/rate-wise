export type DisableOnSilent<Props> =
    | ({
          silent?: false;
      } & Props)
    | ({
          silent: true;
      } & { [K in keyof Props]?: never });

export type ConsoleLogOptions = DisableOnSilent<{
    minLevel: 'info' | 'debug';
}>;

export type FileSystemLogOptions = DisableOnSilent<{
    minLevel: 'info' | 'debug';
    filename: string;
    dir: string;
}>;

export type RequestLogOptions = DisableOnSilent<{
    filename: string;
    dir: string;
}>;
