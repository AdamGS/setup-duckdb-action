const core = require('@actions/core');
const github = require('@actions/github');
const { exec } = require('child_process');
const axios = require('axios');

module.exports = async function () {
    try {
        let version = core.getInput('version');
        let latestVersion;
        const url = `https://github.com/duckdb/duckdb/releases/download/${version}/duckdb_cli-linux-amd64.zip`
        const wgetCmd = `wget ${url}`
        const unzipCmd = `unzip duckdb_cli-linux-amd64.zip`
        const installCmd = 'mkdir /opt/duckdb && mv duckdb /opt/duckdb && chmod +x /opt/duckdb/duckdb && sudo ln -s /opt/duckdb/duckdb /usr/bin/duckdb'
        const checkVersionCmd = 'duckdb --version'
        const cleanupCmd = 'rm duckdb_cli-linux-amd64.zip'

        core.info(`🔍 looking for the latest DuckDB version.`);
        const headers = {'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
        const res = await axios.get('https://api.github.com/repos/duckdb/duckdb/releases/latest', {headers: headers});
        if (res.status != 200) {
            core.error(`❌ Failed to get latest DuckDB version`);
            core.setFailed(res.statusText);
        } else {
            core.info(`✔️ Latest DuckDB version found is ${res.data.tag_name}.`);
            latestVersion = res.data.tag_name;
        }

        if (version === 'latest') {
            core.info(`📦 DuckDb latest version requested : ${latestVersion} will be installed.`);
        }
        else {
            core.info(`📦 DuckDb ${version} requested.`);
            if (version != latestVersion)
                core.warning(`🆕 DuckDb ${version} is available.`);
        }

        core.info(`📥 Install DuckDB version : ${version}`);
        exec(`${wgetCmd} && ${unzipCmd} && ${installCmd} && ${cleanupCmd} && ${checkVersionCmd}`, (error, stdout, stderr) => {
            if (error) {
                core.error(`❌ ${error.message}`);
                core.setFailed(error.message);
                return;
            }
            if (stderr) {
                core.error(`❌ ${stderr}`);
                return;
            }
            core.info(`🚀 DuckDB ${version} successfully installed.`);
        });
    } catch (error) {
        core.setFailed(error.message);
    }
}