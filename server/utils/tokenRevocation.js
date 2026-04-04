let revokedTokens = [];

exports.addRevokedToken = (token) => {
  revokedTokens.push(token);
};

exports.isTokenRevoked = (token) => {
  return revokedTokens.includes(token);
};