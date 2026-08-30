import { app } from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Sri RR Crackers API listening on port ${PORT}`);
});