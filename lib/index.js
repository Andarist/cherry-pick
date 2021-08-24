const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const glob = require('tiny-glob')
const readPkgUp = require('read-pkg-up')

const readDir = promisify(fs.readdir)
const mkDir = promisify(fs.mkdir)
const rimraf = promisify(require('rimraf'))
const stat = promisify(fs.stat)
const writeFile = promisify(fs.writeFile)

const isFile = path =>
	stat(path)
		.then(stats => stats.isFile())
		.catch(() => false)

const withDefaults = (
	{ cwd = '.', ...options } = {},
	additionalDefaults = {}
) => ({
	inputDir: 'src',
	cwd: path.resolve(process.cwd(), cwd),
	...additionalDefaults,
	...options,
})

const noop = () => {}

const findFiles = async ({ cwd, inputDir }) => {
	const filePaths = await glob(
		path.posix.join(inputDir, '!(index).{js,jsx,ts,tsx}'),
		{ cwd }
	)
	return filePaths
		.filter(f => !f.endsWith('.d.ts'))
		.map(filePath => path.basename(filePath).replace(/\.(js|ts)x?$/, ''))
}

const pkgCache = new WeakMap()

const getPkgName = async options => {
	if (options.name != null) {
		return options.name
	}
	if (pkgCache.has(options)) {
		return pkgCache.get(options)
	}
	const result = await readPkgUp({ cwd: options.cwd })
	if (!result) {
		throw new Error(
			'Could not determine package name. No `name` option was passed and no package.json was found relative to: ' +
				options.cwd
		)
	}
	const pkgName = result.package.name
	pkgCache.set(options, pkgName)
	return pkgName
}

const fileProxy = async (options, file) => {
	const { cwd, cjsDir, esmDir, typesDir } = options
	const pkgName = await getPkgName(options)

	const proxyPkg = {
		name: `${pkgName}/${file}`,
		private: true,
		main: path.join('..', cjsDir, `${file}.js`),
		module: path.join('..', esmDir, `${file}.js`),
	}

	if (typeof typesDir === 'string') {
		proxyPkg.types = path.join('..', typesDir, `${file}.d.ts`)
	} else if (await isFile(path.join(cwd, `${file}.d.ts`))) {
		proxyPkg.types = path.join('..', `${file}.d.ts`)
		// try the esm path in case types are located with each
	} else if (await isFile(path.join(cwd, esmDir, `${file}.d.ts`))) {
		proxyPkg.types = path.join('..', esmDir, `${file}.d.ts`)
	}

	return JSON.stringify(proxyPkg, null, 2) + '\n'
}

const cherryPick = async inputOptions => {
	const options = withDefaults(inputOptions, {
		cjsDir: 'lib',
		esmDir: 'es',
	})

	const files = await findFiles(options)

	await Promise.all(
		files.map(async file => {
			const proxyDir = path.join(options.cwd, file)
			await mkDir(proxyDir).catch(noop)
			await writeFile(
				`${proxyDir}/package.json`,
				await fileProxy(options, file)
			)
		})
	)

	return files
}

const clean = async inputOptions => {
	const options = withDefaults(inputOptions)
	const files = await findFiles(options)
	await Promise.all(
		files.map(async file => rimraf(path.join(options.cwd, file)))
	)
	return files
}

module.exports.default = cherryPick
module.exports.clean = clean
