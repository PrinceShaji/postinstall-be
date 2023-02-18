import app from "./app.js";

app.listen(process.env.PORT || 3001, () => {
    console.info(`Server running on  http://localhost:${process.env.PORT || 3001}`);
})