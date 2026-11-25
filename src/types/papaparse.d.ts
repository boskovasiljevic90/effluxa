declare module "papaparse" {
  export type ParseResult<T> = {
    data: T[];
    errors: Array<{ type: string; code: string; message: string; row?: number }>;
    meta: {
      fields?: string[];
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
    };
  };

  export type ParseConfig<T> = {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    delimiter?: string;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: Error) => void;
  };

  export function parse<T>(input: string | File | Blob, config?: ParseConfig<T>): void;

  const Papa: {
    parse: typeof parse;
  };

  export default Papa;
}
