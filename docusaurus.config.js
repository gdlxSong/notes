// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const NotesGitHub = 'https://github.com/gdlxSong/notes';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Notes',
  tagline: 'Notes are cool',
  url: 'https://notes-io.github.io',
  baseUrl: process.env.NODE_ENV === 'production' ? '/docs/' : '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'images/logo.svg',
  organizationName: 'notes-io', // Usually your GitHub org/user name.
  projectName: 'docs', // Usually your repo name.
  deploymentBranch: 'gh-pages',

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          editUrl: 'https://github.com/notes-io/docs/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/styles/custom.scss'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Notes',
        logo: {
          alt: 'Notes',
          src: 'images/logo.svg',
        },
        items: [
          { to: '/getting_started/guide', label: '新手引导', position: 'left' },
          { to: '/api/Core/tag', label: 'API', position: 'left' },
          {
            href: NotesGitHub,
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '文档',
            items: [
              {
                label: '痕迹',
                to: '/',
              },
              {
                label: '概念',
                to: '/internal_concepts/platform',
              },
              {
                label: '新手引导',
                to: '/getting_started/guide',
              },
            ],
          },
          {
            title: '社区',
            items: [
              {
                label: 'GitHub',
                href: NotesGitHub,
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Notes. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-cn'],
  },

  scripts: [
    {
      src: 'https://hm.baidu.com/hm.js?fd45d3e0a66aec212c9e87dcf4b45160',
      async: true,
    },
  ],

  plugins: ['docusaurus-plugin-sass'],
};

module.exports = config;
