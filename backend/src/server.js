import { app } from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sri RR Crackers API listening on http://localhost:${PORT}`);
});
