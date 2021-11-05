const generateLocationMessage = (username, url) => {
  return { username, url, createdAt: new Date().getTime() };
};

module.exports = { generateLocationMessage };
