module.exports = async (req, res) => {
  res.status(200).json({
    ok: true,
    db: !!process.env.DATABASE_URL,
    ai: !!process.env.GEMINI_API_KEY
  });
};
