const path = require('path');
const axios = require('axios');
const moment = require('moment');
const cheerio = require('cheerio');
const { writeFileSync, mkdirSync } = require('fs');

// variable declaration
const url = 'https://github.com/';
const date = moment().endOf('day');
const filePath = `../data/${date.format('YYYY')}/${date.format('MM')}/`;

const instance = axios.create({
  baseURL: url,
  headers: {
    'Host': 'github.com',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.106 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});

const normalizeText = text => text.replace(/\s+/g, ' ').trim();

const parseNumberText = text => {
  const match = text.match(/[\d,]+/);
  return match ? match[0].replace(/,/g, '') : '0';
};

const getRepositoryLink = ($, elm) => {
  const headingLink = $(elm).find('h2 a[href], h1 a[href]').first();
  if (headingLink.length) return headingLink;

  return $(elm)
    .find('a[href]')
    .filter((i, link) => /^\/[^/\s]+\/[^/\s]+$/.test($(link).attr('href') || ''))
    .first();
};

const parseTrendingHtml = html => {
  const $ = cheerio.load(html);
  const arr = [];

  // Retrieve the repositories from response data.
  $('article.Box-row, .Box-row').each((i, elm) => {
    const repositoryLink = getRepositoryLink($, elm);
    const repositoryPath = repositoryLink.attr('href');

    if (!repositoryPath) return;

    const title = normalizeText(repositoryLink.text()).replace(/\s*\/\s*/g, '/');
    const rowText = normalizeText($(elm).text());
    const todayStarsMatch = rowText.match(/[\d,]+\s+stars?\s+today/i);

    const item = {
      title,
      url: new URL(repositoryPath, url).href,
      description: normalizeText($(elm).find('p').first().text()),
      language: normalizeText($(elm).find('[itemprop="programmingLanguage"]').first().text()) || 'none',
      star: todayStarsMatch ? parseNumberText(todayStarsMatch[0]) : '0'
    };

    arr.push(item);
  });

  return arr;
};

const getData = async () => {
  const { data } = await instance.get('/trending');
  return parseTrendingHtml(data);
};

const saveFile = async data => {
  // create folder for files
  await mkdirSync(
    path.resolve(__dirname, filePath),
    { recursive: true },
    err => {
      if (err) throw err;
    }
  );

  // save data in JSON format
  await writeFileSync(
    path.resolve(__dirname, filePath, `${date.format('YYYY-MM-DD')}.json`),
    JSON.stringify(data, null, 2),
    'utf-8'
  );

  // save data in MarkDown format
  const md = [
    `# GitHub Trending (${date.format('YYYY-MM-DD')})`,
    '',
    ...data.map(
      ({ title, url, description, language, star }) =>
        `![](https://img.shields.io/badge/${encodeURIComponent(
          language
        )}-New%20${star}-green?style=flat-square&logo=appveyor)\n- [${title}](${url}): ${description}\n`
    ),
    ''
  ];

  await writeFileSync(
    path.resolve(__dirname, filePath, `${date.format('YYYY-MM-DD')}.md`),
    md.join('\n'),
    'utf-8'
  );
};

const run = async () => {
  let data = await getData();
  await saveFile(data);
};

if (require.main === module) {
  run();
}

module.exports = {
  getData,
  parseTrendingHtml,
  parseNumberText,
  saveFile
};
