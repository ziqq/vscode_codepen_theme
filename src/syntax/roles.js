// Programming-language roles map the structural hierarchy borrowed from
// GitHub Theme onto the classic CodePen palette. Data and stylesheet refiners
// intentionally keep their own domain-specific color contracts.
const codeRoles = Object.freeze({
  annotation: 'blue',
  binding: 'white',
  enumMember: 'purple',
  functionDeclaration: 'purple',
  global: 'white',
  keyword: 'blue',
  method: 'purple',
  namedArgument: 'white',
  property: 'purple',
  type: 'yellow',
});

module.exports = { codeRoles };
