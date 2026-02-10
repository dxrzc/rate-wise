export type DisableOnSilent<Props> =
    | ({
          silent?: false;
      } & Props)
    | ({
          silent: true;
      } & { [K in keyof Props]?: never });

export type HttpConsoleLogOptions = DisableOnSilent<{
    readonly minLevel: 'info' | 'debug';
}>;

export type HttpFileSystemLogOptions = DisableOnSilent<{
    readonly minLevel: 'info' | 'debug';
    readonly filename: string;
    readonly dir: string;
}>;

export type HttpRequestLogOptions = DisableOnSilent<{
    readonly filename: string;
    readonly dir: string;
}>;
