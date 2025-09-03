import express from 'express';
const app = express();

app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'API is working' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});