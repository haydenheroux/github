import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { github_token } from "./config";
import { Repos } from "./components/Repos";
import { Language, LanguageCount, Repo, RepoCount } from "./types";

const user: string = "haydenheroux";

const github = axios.create({
  headers: {
    common: {
      Authorization: `token ${github_token}`,
    },
  },
});

const EXCLUDE_REPOS = new Set(["dwm", "dmenu", "st", "FiniteStateMachineDemo"]);

function include(repo: Record<string, any>): boolean {
  return !repo.fork && !EXCLUDE_REPOS.has(repo.name);
}

async function getLanguages(url: string): Promise<LanguageCount[]> {
  const response = await github.get(url);
  const data = response.data as Record<string, number>;

  const totalBytes = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);
  const threshold = 0.1 * totalBytes;

  return Object.entries(data)
    .map(([language, bytes]) => ({ language, bytes }))
    .filter(({ bytes }) => {
      return bytes > threshold;
    });
}

async function getAllLanguages(repos: Record<string, any>[]): Promise<Repo[]> {
  return Promise.all(
    repos.filter(include).map(async (repo) => ({
      repo: repo.name as string,
      languages: await getLanguages(repo.languages_url as string),
    })),
  );
}

function accumulateLanguages(repos: Repo[]): Language[] {
  const languageRepos: Record<string, RepoCount[]> = {};

  for (const {repo, languages} of repos) {
    for (const { language, bytes } of languages) {
      languageRepos[language] ||= [];
      languageRepos[language].push({
        repo: repo,
        bytes,
      });
    }
  }

  return Object.entries(languageRepos)
    .map(([language, counts]) => {
      const totalBytes = counts
        .map(({ bytes }) => bytes)
        .reduce((prev, bytes) => prev + bytes);
      const repos = languageRepos[language].sort((a, b) => b.bytes - a.bytes);
      return { language, totalBytes, repos };
    })
    .sort((a, b) => b.totalBytes - a.totalBytes)
    .map(({ language, repos }) => ({ language, repos }));
}

function App() {
  const [languages, setLanguages] = useState([] as Language[]);

  useEffect(() => {
    github
      .get(`https://api.github.com/users/${user}/repos?per_page=100`)
      .then(async (response) => {
        const apiRepos = response.data as Record<string, any>[];
        const repos = await getAllLanguages(apiRepos);
        const languages = accumulateLanguages(repos);
        setLanguages(languages);
      });
  }, [user]);

  return (
    <>
      {languages.map(({ language, repos }) => {
        return <Repos key={language} language={language} repos={repos} />;
      })}
    </>
  );
}

export default App;
