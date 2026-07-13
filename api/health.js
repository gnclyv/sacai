module.exports = async (req, res) => {
  res.status(200).json({
    ok: true,
    db: !!process.env.DATABASE_URL,
    ai: !!process.env.XAI_API_KEY
  });
};
