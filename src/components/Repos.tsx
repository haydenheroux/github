import { RepoCount } from "../types";

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

export function Repos(props: Record<string, string | RepoCount[]>) {
  return (
    <div className="repo">
      <div className="language">
        <p>
          <i
            className={`devicon-${devicons[props.language as string]}-plain colored`}
          ></i>
          <br />
          <b>{props.language as string}</b>
        </p>
      </div>
      <div className="repos">
        {(props.repos as RepoCount[]).map(({ repo, bytes }) => {
          return (
            <div className="repoInfo">
              <abbr title={`${bytes} bytes`}>
                <a href={`https://github.com/haydenheroux/${repo}`}><b>{repo}</b></a>
              </abbr>
            </div>
          );
        })}
      </div>
    </div>
  );
}
