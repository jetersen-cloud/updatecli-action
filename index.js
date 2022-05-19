const core = require('@actions/core');
const tool = require('@actions/tool-cache')
const io = require('@actions/io')
const exec = require('@actions/exec')
const path = require('path')

const version = core.getInput('version');
const arg = core.getInput('arg');
const installOnly = core.getBooleanInput('install-only')


// download Updatecli retrieve updatecli binary from Github Release
async function updatecliDownload(){
  const updatecliPackages = [
    {
      arch: 'x64',
      platform: 'win32',
      url: `https://github.com/updatecli/updatecli/releases/download/${version}/updatecli_Windows_x86_64.zip`,
    },
    {
      arch: 'arm64',
      platform: 'win32',
      url: `https://github.com/updatecli/updatecli/releases/download/${version}/updatecli_Windows_arm64.zip`,
    },
    {
      arch: 'x64',
      platform: 'darwin',
      url: `https://github.com/updatecli/updatecli/releases/download/${version}/updatecli_Darwin_x86_64.tar.gz`,
    },
    {
      arch: 'arm64',
      platform: 'darwin',
      url: `https://github.com/updatecli/updatecli/releases/download/${version}/updatecli_Darwin_arm64.tar.gz`,
    },
    {
      arch: 'x64',
      platform: 'linux',
      url: `https://github.com/updatecli/updatecli/releases/download/${version}/updatecli_Linux_x86_64.tar.gz`,
    },
    {
      arch: 'arm64',
      platform: 'linux',
      url: `https://github.com/updatecli/updatecli/releases/download/${version}/updatecli_Linux_arm64.tar.gz`,
    },
  ]

  try {
    for (let i = 0; i < updatecliPackages.length; i++) {
      let updatecliPackage = updatecliPackages[i]
      
      if (process.platform == updatecliPackage.platform && process.arch == updatecliPackage.arch) {
        
        const downloadPath = await tool.downloadTool(updatecliPackage.url);

        core.info(`Downloading ${updatecliPackage.url}`)
        if (updatecliPackage.platform == "win32" ) {
          const updatecliExtractedFolder = await tool.extractZip(downloadPath, undefined);
          const cachedPath = await tool.cacheDir(updatecliExtractedFolder, 'updatecli', version);
          core.addPath(cachedPath);
          core.debug(`Downloaded to ${cachedPath}`);

        } else if (updatecliPackage.platform == "darwin") {
          const updatecliExtractedFolder = await tool.extractXar(downloadPath, undefined);
          core.debug(`Extracting file to ${updatecliExtractedFolder} ...`);

          core.info('Adding to the cache ...');
          const cachedPath = await tool.cacheDir(updatecliExtractedFolder, 'updatecli', version);
          await exec.exec("chmod", ["+x", path.join(cachedPath,"updatecli")]);
          core.addPath(cachedPath);

          const updatecliPath = await io.which('updatecli', true);
          core.info(`Downloaded to ${cachedPath}`);

        } else if (updatecliPackage.platform == "linux"){
          const updatecliExtractedFolder = await tool.extractTar(downloadPath, undefined);

          core.debug(`Extracting file to ${updatecliExtractedFolder} ...`);

          core.info('Adding to the cache ...');
          const cachedPath = await tool.cacheDir(updatecliExtractedFolder, 'updatecli', version, process.arch);
          core.addPath(cachedPath);

          await exec.exec("chmod", ["+x", path.join(cachedPath,"updatecli")]);
          core.info(`Downloaded to ${cachedPath}`);
        }
      }
    }


  }catch(error)  {
    core.setFailed(error.message);
  }
}

async function updatecliVersion(){
  try {
    core.info("Show Updatecli version")
    const updatecliDirectory = tool.find('updatecli', version, process.arch);
    core.addPath(updatecliDirectory);
    await exec.exec("updatecli version");
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function updatecliRun(){
  try {
    core.info("Run Updatecli")
    const updatecliDirectory = tool.find('updatecli', version, process.arch);
    core.addPath(updatecliDirectory);
    await exec.exec(`updatecli ${arg}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function run() {

  if (installOnly) {
    await updatecliDownload()
    await updatecliVersion();
    process.exit(0)
  }

  await updatecliVersion();
  await updatecliRun();

  process.exit(0);
}


run()