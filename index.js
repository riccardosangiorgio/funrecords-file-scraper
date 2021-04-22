const { default: axios } = require('axios');
const fs = require('fs');
const { green, yellow } = require('colors');
const { exit } = require('process');

const readData = async () => {
  const rawdata = await fs.promises.readFile('data.json');
  return JSON.parse(rawdata);
};

const isModified = (remote, local) => {
  return (
    remote.headers.etag !== local.etag ||
    remote.headers['last-modified'] !== local.lastModified
  );
};

const updateData = (etag, lastModified) => {
  const data = JSON.stringify({
    etag,
    lastModified,
  });
  fs.writeFileSync('data.json', data);
};

const downloadFile = () => {
  const writer = fs.createWriteStream('download/data.zip');
  return axios
    .get('https://www.funrecords.de/download/newsxls.zip', {
      responseType: 'stream',
    })
    .then(async (response) => {
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          resolve(writer.close());
        });
      });
    });
};

setInterval(async () => {
  const [remote, local] = await Promise.all([
    axios.head('https://www.funrecords.de/download/newsxls.zip'),
    readData(),
  ]);
  if (isModified(remote, local)) {
    updateData(remote.headers.etag, remote.headers['last-modified']);

    await downloadFile();

    console.log(green('Il file è stato aggiornato.'));
    exit(0);
  }
  console.log(
    yellow(
      new Intl.DateTimeFormat('it-IT', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZone: 'Europe/Rome',
      }).format(new Date()) + ' Il file non è ancora stato aggiornato.'
    )
  );
}, 3000);
