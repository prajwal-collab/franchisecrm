module.exports = (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Health check isolated file.',
    time: new Date().toISOString()
  });
};
