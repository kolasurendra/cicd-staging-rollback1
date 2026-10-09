const express = require("express");

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Hello from CI/CD Staging and Rollback Project!");
});

app.get("/health", (req, res) => {

    if (process.env.HEALTH_STATUS === "unhealthy") {
        return res.status(500).json({
            status: "DOWN",
            message: "Application is unhealthy"
        });
    }

    res.status(200).json({
        status: "UP",
        message: "Application is healthy"
    });
});

app.listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
});
