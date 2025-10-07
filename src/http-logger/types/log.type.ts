export type DisableOnSilent<Props> =
    | ({
          silent?: false;
      } & Props)
    | ({
          silent: true;
      } & { [K in keyof Props]?: never });

export type HttpConsoleLogOptions = DisableOnSilent<{
    minLevel: 'info' | 'debug';
}>;

export type HttpFileSystemLogOptions = DisableOnSilent<{
    minLevel: 'info' | 'debug';
    filename: string;
    dir: string;
}>;

export type HttpRequestLogOptions = DisableOnSilent<{
    filename: string;
    dir: string;
}>;
