// commitlint.config.js
module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(feat|fix|cicd|chores)\[(.+?)\]:\s(.+)$/,
      headerCorrespondence: ["type", "ticket", "subject"],
    },
  },
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'cicd', 'chores']],
    'subject-empty': [2, 'never'],
  },
};