#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const { default: cherryPick, clean } = require('..')

const DONE_LABEL = chalk.green.inverse(' DONE ')

yargs
	.command(
		'$0 [input-dir]',
		'Create proxy directories',
		yargs =>
			yargs
				.default('input-dir', 'src')
				.option('name')
				.option('cjs-dir', { default: 'lib' })
				.option('esm-dir', { default: 'es' })
				.option('types-dir')
				.option('include', { default: '!(index).{js,ts}' })
				.option('cwd', { default: '.' }),
		options =>
			cherryPick(options).then(files =>
				console.log(
					`\n🍒 ⛏ 📦  ${DONE_LABEL} Created proxy directories: ${files.join(
						', '
					)}.\n`
				)
			)
	)
	.command(
		'clean [input-dir]',
		'Cleanup generated directories',
		yargs =>
			yargs
				.default('input-dir', 'src')
				.option('cwd', { default: '.' })
				.option('include', { default: '!(index).{js,ts}' }),
		options =>
			clean(options).then(files =>
				console.log(
					`\n🍒 ⛏ 🗑  ${DONE_LABEL} Removed proxy directories: ${files.join(
						', '
					)}.\n`
				)
			)
	)
	.help()
	.alias('help', 'h')
	.version()
	.alias('version', 'v')
	.strict().argv
