export type ChangelogType = {
  versions: {
    version: string;
    date: string;
    changes: {
      added: string[];
      improved: string[];
      fixed: string[];
    };
  }[];
};
