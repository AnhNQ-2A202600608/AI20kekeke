function readPackage(pkg, context) {
  if (pkg.dependencies && pkg.dependencies['postcss']) {
    context.log(`Overriding postcss dependency in ${pkg.name}@${pkg.version} from ${pkg.dependencies['postcss']} to ^8.5.10`);
    pkg.dependencies['postcss'] = '^8.5.10';
  }
  if (pkg.devDependencies && pkg.devDependencies['postcss']) {
    context.log(`Overriding postcss devDependency in ${pkg.name}@${pkg.version} from ${pkg.devDependencies['postcss']} to ^8.5.10`);
    pkg.devDependencies['postcss'] = '^8.5.10';
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
