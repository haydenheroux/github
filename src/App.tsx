import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { github_token } from "./config";

const devicons: Record<string, string> = {
  Go: "go",
  Java: "java",
  C: "c",
  Kotlin: "kotlin",
  Svelte: "svelte",
  Python: "python",
  "C++": "cplusplus",
  Makefile: "cmake", // TODO
  TypeScript: "typescript",
  Processing: "processing",
  Lua: "lua",
  CSS: "css3",
  FreeMarker: "html5",
  HTML: "html5",
  Haskell: "haskell",
  Shell: "bash",
};

const user: string = "haydenheroux";

const github = axios.create({
  headers: {
    common: {
      Authorization: `token ${github_token}`,
    },
  },
});

// TODO How to make these stronger types?
type Repo = string & { readonly __brand: unique symbol };
type Lines = number & { readonly __brand: unique symbol };
type Language = string & { readonly __brand: unique symbol };

// TODO Type bloat
type APIRepo = Record<string, any>;
type RepoToLines = Record<Repo, Lines>;
type RepoToLanguageToLines = Record<Repo, LanguageToLines>;
type LanguageToLines = Record<Language, Lines>;
type LanguageToRepoToLines = Record<Language, RepoToLines>;

const excludeRepos = ["dwm", "dmenu", "st"];

function include(repo: APIRepo): boolean {
  return !repo.fork && !excludeRepos.includes(repo.name);
}

async function getLanguages(url: string): Promise<LanguageToLines> {
  const languages: LanguageToLines = {};
  // Two-pass approach, since the first pass computes totalLines
  let totalLines = 0;

  await github.get(url).then((response) => {
    const data = response.data as LanguageToLines;
    for (const [language, lines] of Object.entries(data)) {
      languages[language as Language] = lines;
      totalLines += lines;
    }
  });

  const tenPercentOfLines = 0.1 * totalLines;

  for (const [language, lines] of Object.entries(languages)) {
    if (lines < tenPercentOfLines) {
      delete languages[language as Language];
    }
  }

  return languages;
}

async function getAllLanguages(
  repos: APIRepo[],
): Promise<RepoToLanguageToLines> {
  const results = await Promise.all(
    repos.filter(include).map(async (repo) => ({
      [repo.name as Repo]: await getLanguages(repo.languages_url as string),
    })),
  );

  return Object.assign({}, ...results);
}

type LanguageToSortedRepoToLines = Record<string, RepoToLines[]>;
type SortedLanguageToRepoToLines = LanguageToSortedRepoToLines[];

async function accumulateLanguages(
  repos: APIRepo[],
): Promise<SortedLanguageToRepoToLines> {
  const repoLangs = await getAllLanguages(repos);

  const reposOf: LanguageToRepoToLines = {};
  const langLines: Record<string, number> = {};

  for (const [repo, languages] of Object.entries(repoLangs)) {
    for (const [language, lines] of Object.entries(languages)) {
      if (!reposOf[language as Language]) {
        reposOf[language as Language] = {};
        langLines[language] = 0;
      }
      reposOf[language as Language][repo as Repo] = lines;
      langLines[language] += lines;
    }
  }

  const languagesOrderedByLineCount = Object.entries(langLines)
    .sort(([, aLines], [, bLines]) => bLines - aLines)
    .map(([language]) => language);

  return languagesOrderedByLineCount.map((language) => {
    const pair: LanguageToSortedRepoToLines = {};
    pair[language as Language] = sortRepos(reposOf[language as Language]);
    return pair;
  });
}

function sortRepos(repos: RepoToLines): RepoToLines[] {
  return Object.entries(repos)
    .sort(([, firstLines], [, secondLines]) => secondLines - firstLines)
    .map(([repo, lines]) => {
      return { [repo as Repo]: lines };
    });
}

function App() {
  const [data, setData] = useState([] as SortedLanguageToRepoToLines);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    github
      .get(`https://api.github.com/users/${user}/repos?per_page=100`)
      .then((response) => {
        accumulateLanguages(response.data as APIRepo[]).then((sorted) => {
          setLoaded(true);
          setData(sorted);
        });
      });
  }, [user]);

  if (!loaded) {
    return <p>Loading...</p>;
  } else {
    return (
      <>
        {data.map((languageToRepoLines) => {
          const language = Object.keys(languageToRepoLines)[0];
          const repoLines = Object.values(languageToRepoLines)[0];
          return (
            <>
              <h1 key={language}>
                <i
                  className={`devicon-${devicons[language]}-plain colored`}
                ></i>{" "}
                {language}
              </h1>
              {repoLines.map((repoToLines) => {
                const repo = Object.keys(repoToLines)[0];
                const bytes = Object.values(repoToLines)[0];
                return (
                  <p key={language + repo}>
                    <b>{repo}</b>: {bytes} bytes
                  </p>
                );
              })}
            </>
          );
        })}
      </>
    );
  }
}

export default App;
