import { existsSync, writeFileSync } from 'fs';
import * as path from 'path';
import { join } from 'path'
import { homedir, platform } from 'os';
import * as execa from 'execa';
import { WorkspaceConfiguration } from 'vscode';

const FANTOMAS_DOTNET_INSTALL_COMMAND = 'dotnet tool install --global fantomas-tool';
const STDOUT_FLAG = '--stdout';
const FSI_FLAG = '--fsi';

const DEFAULT_SUBPROCESS_OPTIONS = {
    shell: true,
    timeout: 10000
};

const FANTOMAS_COMMAND_OTHER = 'fantomas';
const FANTOMAS_COMMAND_WIN32 = 'fantomas.exe';
const CAT_COMMAND = 'cat';
const PIPE = '|';
const TEMP_FILE_NAME = 'fantomas.tmp.fs';

const fantomasExecutable = platform() === 'win32' ? FANTOMAS_COMMAND_WIN32 : FANTOMAS_COMMAND_OTHER;

const fantomasPath = join(homedir(), '.dotnet/tools/');

const fantomasCommand = join(fantomasPath, 'fantomas');

export async function isFantomasInstalled(): Promise<boolean> {
    log(`check path ${fantomasPath} cmd ${fantomasExecutable}`);
    let result = existsSync(fantomasCommand);
    result ? log('fantomas found') : logError('fantomas not found');
    if (!result) {
        result = await tryInstallFantomas()
    }
    return result
}

async function tryInstallFantomas(): Promise<boolean> {
    let result = false;
    try {
        let { stdout } = await runShell(FANTOMAS_DOTNET_INSTALL_COMMAND, DEFAULT_SUBPROCESS_OPTIONS);
        log(stdout);
        result = stdout !== null
    }
    catch (error) {
        logError(error.toString())
        result = false
    }
    return result;
}

export async function runFantomas(text: string, extPath: string, isfsiFile: boolean, config: WorkspaceConfiguration): Promise<string | null> {
    const tempFile = path.join(extPath, TEMP_FILE_NAME);
    writeFileSync(tempFile, text)
    //TODO parse the incoming config into command line args
    let commands = [CAT_COMMAND, tempFile, PIPE, fantomasCommand, STDOUT_FLAG];
    if (isfsiFile) {
        commands.push(FSI_FLAG);
    }
    let command = commands.join(' ');
    log('attempting command ' + command)
    let result;
    try {
        let { stdout } = await runShell(command, DEFAULT_SUBPROCESS_OPTIONS);
        result = stdout;
    } catch (error) {
        logError(error.message)
        result = null
    }
    return result
}

function runShell(args: string, options: object) {
    return execa.command(args, options);
}

function log(input: string) {
    console.log('[fantomas-format] ' + input);
}

function logError(input: string) {
    console.error('[fantomas-format] ' + input);
}
