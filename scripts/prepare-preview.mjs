import { appendFile, mkdir, mkdtemp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { addHomepagePreview } from './preview-site.mjs';

// Only the explicitly dispatched, same-repository preview branch can publish.
const repo = process.env.GITHUB_REPOSITORY;
if (repo !== 'jinxiao/drawio-software-icons' || process.env.GITHUB_REF !== 'refs/heads/preview/homepage' || process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch') {
  throw Error('Homepage preview publication requires the trusted preview branch and workflow_dispatch.');
}
const api = path => JSON.parse(execFileSync('gh', ['api', `repos/${repo}/${path}`], { encoding: 'utf8' }));
const mainSha = api('git/ref/heads/main').object.sha;
const runs = api(`actions/workflows/ci-pages.yml/runs?branch=main&head_sha=${mainSha}&status=success&per_page=10`).workflow_runs;
const run = runs.find(item => item.head_sha === mainSha && item.head_branch === 'main' && item.head_repository.full_name === repo && ['push', 'workflow_dispatch'].includes(item.event));
if (!run) throw Error('Current main must have a successful build and deployment before publishing a preview.');
const artifact = api(`actions/runs/${run.id}/artifacts`).artifacts.find(item => item.name === 'github-pages' && !item.expired);
if (!artifact) throw Error('Production github-pages artifact is unavailable. Run the main workflow before retrying.');

// A fresh directory avoids stale previews; never delete or rebuild production files.
const output = resolve('.preview-pages');
await mkdir(output);
const archive = await mkdtemp(join(tmpdir(), 'homepage-production-'));
execFileSync('gh', ['run', 'download', String(run.id), '--repo', repo, '--name', 'github-pages', '--dir', archive], { stdio: 'inherit' });
execFileSync('tar', ['-xf', join(archive, 'artifact.tar'), '-C', output], { stdio: 'inherit' });
const preserved = await addHomepagePreview(output, resolve('dist'), { productionSha: mainSha, productionRun: run.id, previewSha: process.env.GITHUB_SHA });
if (api('git/ref/heads/main').object.sha !== mainSha) throw Error('Main changed during preview preparation. Retry with the new production artifact.');
await appendFile(process.env.GITHUB_OUTPUT, `path=.preview-pages\nproduction_sha=${mainSha}\n`);
console.log(`Preserved ${preserved} production files from ${mainSha}; preview added at /preview/homepage/.`);
