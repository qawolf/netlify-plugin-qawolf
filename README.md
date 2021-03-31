# netlify-plugin-qawolf

Run QA Wolf tests on Netlifiy deployments 🐺

See
[QA Wolf documentation](https://www.qawolf.com/docs/run-tests-on-netlify-deployment)
for a detailed walkthrough.

## Overview

This plugin allows you to run your [QA Wolf](https://www.qawolf.com/) tests on
Netlify deployments.

QA Wolf is an [open source](https://github.com/qawolf/qawolf) tool to create,
run, and maintain browser tests 10x faster. Your tests will run on Netlify
deployments in 100% parallel, with no infrastructure setup required.

## Install

### Install with Netlify UI (Recommended)

Install the QA Wolf Build Plugin from the Netlify UI with this
[direct installation link](https://app.netlify.com/plugins/netlify-plugin-qawolf/install).

The QA Wolf Build Plugin is also listed in the
[Netlify Plugins directory](https://app.netlify.com/plugins).

### Install with npm

1. From your project's base directory, use `npm`, `yarn`, or any other Node.js
   package manager to add this plugin to `devDependencies` in `package.json`:

```bash
npm install --save-dev netlify-plugin-qawolf
```

or

```bash
yarn add -D netlify-plugin-qawolf
```

2. Create a `netlify.toml` in the root of your project. Your file should include
   the plugins section below:

```toml
[[plugins]]
  # runs QA Wolf tests against the deployed URL
  package = "netlify-plugin-qawolf"
```

## Environment Variables

Create the `QAWOLF_API_KEY` environment variable in Netlify, and set it to your
team's API key.

See
[these instructions](https://docs.netlify.com/configure-builds/environment-variables/#declare-variables)
to learn about Netlify environment variables.

## Demo

Check out
[this example project](https://github.com/qawolf/netlify-plugin-example) that
uses the QA Wolf Netlify Build Plugin.

Here are example deploy logs for
[passing tests](https://app.netlify.com/sites/netlify-plugin-qawolf-example/deploys/60639a20d105e7000882c69d)
and
[failing tests](https://app.netlify.com/sites/netlify-plugin-qawolf-example/deploys/606399859279c70007f63ef0).

## Support

We want QA Wolf to work well for you, so please reach out for help! Join our
[Slack community](https://slack.qawolf.com) or email us at hello@qawolf.com.
