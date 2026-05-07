const assert = require('assert');
const { parseNumberText, parseTrendingHtml } = require('../src/index');

const html = `
  <article class="Box-row">
    <form><button>Star</button></form>
    <h2 class="h3 lh-condensed">
      <a href="/anthropics/financial-services">
        <span class="text-normal">anthropics /</span>
        financial-services
      </a>
    </h2>
    <p class="col-9 color-fg-muted my-1 pr-4">
      Useful agents for financial services.
    </p>
    <span itemprop="programmingLanguage">Python</span>
    <a href="/anthropics/financial-services/stargazers">10,512</a>
    <a href="/anthropics/financial-services/network/members">1,378</a>
    <span class="d-inline-block float-sm-right">1,367 stars today</span>
  </article>
  <article class="Box-row">
    <h2><a href="/owner/no-language">owner / no-language</a></h2>
    <p></p>
    <span>Built by someone</span>
    <span>42 stars today</span>
  </article>
`;

assert.strictEqual(parseNumberText('1,367 stars today'), '1367');

const result = parseTrendingHtml(html);

assert.deepStrictEqual(result, [
  {
    title: 'anthropics/financial-services',
    url: 'https://github.com/anthropics/financial-services',
    description: 'Useful agents for financial services.',
    language: 'Python',
    star: '1367'
  },
  {
    title: 'owner/no-language',
    url: 'https://github.com/owner/no-language',
    description: '',
    language: 'none',
    star: '42'
  }
]);

console.log('parser tests passed');
