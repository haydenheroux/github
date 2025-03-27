export interface LanguageCount {
  language: string;
  bytes: number;
}

export interface RepoCount {
  repo: string;
  bytes: number;
}

export interface Repo {
  repo: string;
  languages: LanguageCount[];
}

export interface Language {
  language: string;
  repos: RepoCount[];
}
